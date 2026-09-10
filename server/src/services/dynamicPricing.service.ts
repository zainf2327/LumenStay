import { db } from '../db/index.js';
import { channexService } from './channex.service.js';
import { broadcastEvent } from './websocket.js';
import { logger } from '../utils/logger.js';
import type { DynamicPricingRule } from '../types/domain.types.js';

export interface DynamicRateCalculation {
  propertyId: string;
  roomTypeId: string;
  basePrice: number;
  effectivePrice: number;
  occupancyPercent: number;
  appliedRules: {
    ruleName: string;
    adjustmentPercent: number;
    amount: number;
  }[];
  isOverridden: boolean;
  minNights: number;
}

class DynamicPricingService {
  private static instance: DynamicPricingService;

  // In-memory rules store with seeded intelligent defaults for all properties
  private rules: DynamicPricingRule[] = [];
  // Manual overrides set by Revenue Manager: key is `${propertyId}_${roomTypeId}`
  private manualOverrides: Map<string, { price: number; expiresAt: string; setBy: string }> = new Map();

  private constructor() {
    this.initDefaultRules();
  }

  public static getInstance(): DynamicPricingService {
    if (!DynamicPricingService.instance) {
      DynamicPricingService.instance = new DynamicPricingService();
    }
    return DynamicPricingService.instance;
  }

  private initDefaultRules() {
    const now = new Date().toISOString();
    const defaultProperties = [
      'prop_birchwood',
      'prop_copperline',
      'prop_wren',
      'prop_sundowner',
      'prop_cedar',
      'prop_ledger',
    ];

    this.rules = defaultProperties.flatMap(propId => [
      {
        id: `rule_surge_${propId}`,
        propertyId: propId,
        ruleType: 'occupancy_surge',
        name: 'High Occupancy Peak Surge',
        thresholdPercent: 80,
        priceAdjustmentPercent: 15,
        isActive: true,
        updatedAt: now,
      },
      {
        id: `rule_shoulder_${propId}`,
        propertyId: propId,
        ruleType: 'shoulder_season',
        name: 'Low Demand Shoulder Incentive',
        thresholdPercent: 35,
        priceAdjustmentPercent: -10,
        isActive: true,
        updatedAt: now,
      },
      {
        id: `rule_mlos_${propId}`,
        propertyId: propId,
        ruleType: 'mlos_restriction',
        name: 'Peak Weekend 2-Night Minimum',
        thresholdPercent: 70,
        priceAdjustmentPercent: 0,
        minNights: 2,
        isActive: true,
        updatedAt: now,
      },
    ]);

    logger.info(`[DynamicPricing] Initialized ${this.rules.length} default yield management rules across 6 properties`);
  }

  public getRules(propertyId?: string): DynamicPricingRule[] {
    if (propertyId) {
      return this.rules.filter(r => r.propertyId === propertyId);
    }
    return [...this.rules];
  }

  public updateRule(ruleId: string, updates: Partial<DynamicPricingRule>): DynamicPricingRule | null {
    const idx = this.rules.findIndex(r => r.id === ruleId);
    if (idx === -1) return null;

    this.rules[idx] = {
      ...this.rules[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    broadcastEvent('PRICING_RULES_UPDATED', {
      rule: this.rules[idx],
    });

    return this.rules[idx];
  }

  public setManualOverride(propertyId: string, roomTypeId: string, overridePrice: number, setBy: string = 'Revenue Manager') {
    const key = `${propertyId}_${roomTypeId}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days default

    this.manualOverrides.set(key, {
      price: overridePrice,
      expiresAt,
      setBy,
    });

    // Immediately push new rate to external OTAs via Channex
    channexService.syncRates(propertyId, roomTypeId, 'rp_standard', overridePrice);

    broadcastEvent('RATE_OVERRIDE_APPLIED', {
      propertyId,
      roomTypeId,
      overridePrice,
      setBy,
    });

    logger.info(`[DynamicPricing] Set manual override for ${key} to $${overridePrice}/nt`);
  }

  public clearManualOverride(propertyId: string, roomTypeId: string) {
    const key = `${propertyId}_${roomTypeId}`;
    this.manualOverrides.delete(key);
  }

  /**
   * Evaluates occupancy and calculates current dynamic price for a room type.
   */
  public async calculateDynamicRate(
    propertyId: string,
    roomTypeId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<DynamicRateCalculation> {
    const property = await db.properties.findById(propertyId);
    const roomType = await db.roomTypes.findById(roomTypeId);
    const basePrice = roomType ? roomType.basePrice : 350;

    // Check manual override first
    const overrideKey = `${propertyId}_${roomTypeId}`;
    const override = this.manualOverrides.get(overrideKey);
    if (override && new Date(override.expiresAt) > new Date()) {
      return {
        propertyId,
        roomTypeId,
        basePrice,
        effectivePrice: override.price,
        occupancyPercent: 85,
        appliedRules: [
          {
            ruleName: `Manual Override by ${override.setBy}`,
            adjustmentPercent: Math.round(((override.price - basePrice) / basePrice) * 100),
            amount: override.price - basePrice,
          },
        ],
        isOverridden: true,
        minNights: 1,
      };
    }

    // Calculate property occupancy for target date range
    const activeReservations = await db.reservations.findOverlapping(
      propertyId,
      roomTypeId,
      checkInDate,
      checkOutDate
    );

    const totalRooms = property?.totalRooms || 30;
    const occupancyPercent = Math.min(100, Math.round((activeReservations.length / totalRooms) * 100));

    // Evaluate active rules
    const propertyRules = this.getRules(propertyId).filter(r => r.isActive);
    let priceMultiplier = 1.0;
    let minNights = 1;
    const appliedRules: DynamicRateCalculation['appliedRules'] = [];

    for (const rule of propertyRules) {
      if (rule.ruleType === 'occupancy_surge' && occupancyPercent >= rule.thresholdPercent) {
        const factor = 1 + rule.priceAdjustmentPercent / 100;
        priceMultiplier *= factor;
        appliedRules.push({
          ruleName: `${rule.name} (Occ ${occupancyPercent}% >= ${rule.thresholdPercent}%)`,
          adjustmentPercent: rule.priceAdjustmentPercent,
          amount: parseFloat((basePrice * (rule.priceAdjustmentPercent / 100)).toFixed(2)),
        });
      } else if (rule.ruleType === 'shoulder_season' && occupancyPercent <= rule.thresholdPercent) {
        const factor = 1 + rule.priceAdjustmentPercent / 100;
        priceMultiplier *= factor;
        appliedRules.push({
          ruleName: `${rule.name} (Occ ${occupancyPercent}% <= ${rule.thresholdPercent}%)`,
          adjustmentPercent: rule.priceAdjustmentPercent,
          amount: parseFloat((basePrice * (rule.priceAdjustmentPercent / 100)).toFixed(2)),
        });
      } else if (rule.ruleType === 'mlos_restriction' && occupancyPercent >= rule.thresholdPercent) {
        minNights = Math.max(minNights, rule.minNights || 2);
        appliedRules.push({
          ruleName: `${rule.name} (Min ${rule.minNights} nights enforced)`,
          adjustmentPercent: 0,
          amount: 0,
        });
      }
    }

    const effectivePrice = Math.round(basePrice * priceMultiplier);

    return {
      propertyId,
      roomTypeId,
      basePrice,
      effectivePrice,
      occupancyPercent,
      appliedRules,
      isOverridden: false,
      minNights,
    };
  }
}

export const dynamicPricingService = DynamicPricingService.getInstance();
