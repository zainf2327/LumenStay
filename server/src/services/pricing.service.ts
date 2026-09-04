import { config } from '../config/index.js';
import type { RatePlan, RoomType } from '../types/domain.types.js';

export interface CalculatedPricing {
  nightlyRate: number;
  subtotal: number;
  taxAmount: number;
  resortFee: number;
  grandTotal: number;
  totalNights: number;
}

export class PricingService {
  public calculateNights(checkIn: string, checkOut: string): number {
    const dIn = new Date(checkIn);
    const dOut = new Date(checkOut);
    const diff = dOut.getTime() - dIn.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  public calculateBookingPricing(
    roomType: RoomType,
    ratePlan: RatePlan,
    checkIn: string,
    checkOut: string,
    promoCode?: string
  ): CalculatedPricing {
    const totalNights = this.calculateNights(checkIn, checkOut);

    let modifier = ratePlan.priceModifier || 1.0;
    if (ratePlan.isPromo && promoCode && promoCode.toUpperCase() === ratePlan.promoCode?.toUpperCase()) {
      modifier = ratePlan.priceModifier;
    }

    const nightlyRate = Math.round(roomType.basePrice * modifier);
    const subtotal = nightlyRate * totalNights;
    const taxAmount = Math.round(subtotal * config.defaultTaxRate * 100) / 100;
    const resortFee = config.defaultResortFeePerNight * totalNights;
    const grandTotal = Math.round((subtotal + taxAmount + resortFee) * 100) / 100;

    return {
      nightlyRate,
      subtotal,
      taxAmount,
      resortFee,
      grandTotal,
      totalNights,
    };
  }
}

export const pricingService = new PricingService();
