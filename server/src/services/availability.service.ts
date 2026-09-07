import { db } from '../db/index.js';
import { pricingService } from './pricing.service.js';
import { ApiError } from '../types/api.types.js';
import type { RoomType, RatePlan } from '../types/domain.types.js';

export interface RoomAvailabilityResponse {
  roomType: RoomType;
  availableCount: number;
  totalInventory: number;
  nightlyRates: {
    ratePlan: RatePlan;
    calculatedNightlyPrice: number;
    calculatedTotalPrice: number;
    taxAmount: number;
    resortFee: number;
    grandTotal: number;
  }[];
}

export class AvailabilityService {
  public async getAvailability(
    propertyId: string,
    checkIn: string,
    checkOut: string,
    promoCode?: string
  ) {
    const property = await db.properties.findById(propertyId);
    if (!property) {
      throw new ApiError(404, 'Property not found');
    }

    const totalNights = pricingService.calculateNights(checkIn, checkOut);
    const roomTypes = await db.roomTypes.findByPropertyId(propertyId);
    const ratePlans = await db.ratePlans.findByPropertyId(propertyId);

    const results: RoomAvailabilityResponse[] = await Promise.all(
      roomTypes.map(async (rt) => {
        // OVERLAP QUERY LOGIC per AGENTS.md §6:
        // existing.check_in < requested.check_out AND existing.check_out > requested.check_in
        const overlappingBookings = await db.reservations.findOverlapping(
          propertyId,
          rt.id,
          checkIn,
          checkOut
        );

        const totalInventory = rt.totalInventory || 10;
        const availableCount = Math.max(0, totalInventory - overlappingBookings.length);

        const nightlyRates = ratePlans.map((rp) => {
          const pricing = pricingService.calculateBookingPricing(rt, rp, checkIn, checkOut, promoCode);
          return {
            ratePlan: rp,
            calculatedNightlyPrice: pricing.nightlyRate,
            calculatedTotalPrice: pricing.subtotal,
            taxAmount: pricing.taxAmount,
            resortFee: pricing.resortFee,
            grandTotal: pricing.grandTotal,
          };
        });

        return {
          roomType: rt,
          availableCount,
          totalInventory,
          nightlyRates,
        };
      })
    );

    return {
      propertyId,
      propertyName: property.name,
      checkIn,
      checkOut,
      totalNights,
      results,
    };
  }
}

export const availabilityService = new AvailabilityService();

