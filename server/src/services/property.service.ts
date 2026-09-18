import { db } from '../db/index.js';
import { ApiError } from '../types/api.types.js';
import { broadcastEvent } from './websocket.js';

export interface BroadcastNotice {
  id: string;
  propertyId: string;
  message: string;
  priority: 'urgent' | 'warning' | 'info';
  author: string;
  createdAt: string;
  isActive: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completedBy?: string | null;
  completedAt?: string | null;
}

export interface PropertyChecklists {
  propertyId: string;
  date: string;
  amAudit: ChecklistItem[];
  pmTurnover: ChecklistItem[];
  amChecklist?: ChecklistItem[];
  pmChecklist?: ChecklistItem[];
  handoverNotes: string;
  activeShift?: 'AM' | 'PM';
}

const DEFAULT_AM_ITEMS: ChecklistItem[] = [
  { id: 'am_1', label: 'Reconcile previous night audit revenue & average daily rate (ADR)', completed: true, completedBy: 'Night Audit' },
  { id: 'am_2', label: 'Inspect VIP and Lumen Elite Platinum arrival suites for welcome amenities', completed: true, completedBy: 'Marcus Weil' },
  { id: 'am_3', label: 'Verify clean and inspected room inventory ready for 3:00 PM check-in', completed: false },
  { id: 'am_4', label: 'Confirm front desk cash float and tokenized card terminal settlement ledger', completed: false },
  { id: 'am_5', label: 'Review open maintenance work orders and antique heating/radiator bleed logs', completed: false },
];

const DEFAULT_PM_ITEMS: ChecklistItem[] = [
  { id: 'pm_1', label: 'Perform keycard inventory count and Salto BLE digital lock sync check', completed: false },
  { id: 'pm_2', label: 'Review late check-out extension requests and overstay room manifest', completed: false },
  { id: 'pm_3', label: 'Sign off on daily housekeeping turnover completion (100% inspected)', completed: false },
  { id: 'pm_4', label: 'Audit mini-bar, restaurant, and incidental charges posted to active folios', completed: false },
  { id: 'pm_5', label: 'Verify exterior perimeter security, ski locker access, and night manager handover', completed: false },
];

export class PropertyService {
  private activeBroadcasts: Map<string, BroadcastNotice | null> = new Map();
  private propertyChecklists: Map<string, PropertyChecklists> = new Map();

  public async getAllProperties() {
    return await db.properties.find();
  }

  public async getPropertyByIdOrSlug(idOrSlug: string) {
    let property = await db.properties.findById(idOrSlug);
    if (!property) {
      property = await db.properties.findBySlug(idOrSlug);
    }
    if (!property) {
      throw new ApiError(404, 'Property not found');
    }

    const roomTypes = await db.roomTypes.findByPropertyId(property.id);
    const ratePlans = await db.ratePlans.findByPropertyId(property.id);

    return {
      ...property,
      roomTypes,
      ratePlans,
    };
  }

  public async getActiveBroadcast(propertyId: string): Promise<BroadcastNotice | null> {
    return this.activeBroadcasts.get(propertyId) || null;
  }

  public async setBroadcast(
    propertyId: string,
    message: string,
    priority: 'urgent' | 'warning' | 'info' = 'urgent',
    author: string = 'General Manager'
  ): Promise<BroadcastNotice> {
    const notice: BroadcastNotice = {
      id: `bc_${Date.now()}`,
      propertyId,
      message,
      priority,
      author,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    this.activeBroadcasts.set(propertyId, notice);
    broadcastEvent('STAFF_BROADCAST', notice);
    return notice;
  }

  public async clearBroadcast(propertyId: string): Promise<boolean> {
    this.activeBroadcasts.delete(propertyId);
    broadcastEvent('STAFF_BROADCAST_CLEARED', { propertyId });
    return true;
  }

  public async getChecklists(propertyId: string): Promise<PropertyChecklists> {
    const today = new Date().toISOString().split('T')[0];
    const existing = this.propertyChecklists.get(propertyId);

    if (existing && existing.date === today) {
      return existing;
    }

    const amItems = DEFAULT_AM_ITEMS.map((item) => ({ ...item }));
    const pmItems = DEFAULT_PM_ITEMS.map((item) => ({ ...item }));

    const initial: PropertyChecklists = {
      propertyId,
      date: today,
      amAudit: amItems,
      pmTurnover: pmItems,
      amChecklist: amItems,
      pmChecklist: pmItems,
      handoverNotes: 'All early morning VIP arrivals received complimentary upgrades. Ski valet shuttle running on regular schedule.',
      activeShift: 'AM',
    };

    this.propertyChecklists.set(propertyId, initial);
    return initial;
  }

  public async updateChecklists(
    propertyId: string,
    updates: Partial<PropertyChecklists>
  ): Promise<PropertyChecklists> {
    const current = await this.getChecklists(propertyId);
    const updated: PropertyChecklists = {
      ...current,
      ...updates,
      propertyId,
    };

    if (updates.amChecklist && !updates.amAudit) updated.amAudit = updates.amChecklist;
    if (updates.amAudit && !updates.amChecklist) updated.amChecklist = updates.amAudit;
    if (updates.pmChecklist && !updates.pmTurnover) updated.pmTurnover = updates.pmChecklist;
    if (updates.pmTurnover && !updates.pmChecklist) updated.pmChecklist = updates.pmTurnover;

    this.propertyChecklists.set(propertyId, updated);
    broadcastEvent('GM_CHECKLISTS_UPDATED', updated);
    return updated;
  }
}

export const propertyService = new PropertyService();


