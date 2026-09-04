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
  public getAvailability(
    propertyId: string,
    checkIn: string,
    checkOut: string,
    promoCode?: string
  ) {
    const property = db.properties.findById(propertyId);
    if (!property) {
      throw new ApiError(404, 'Property not found');
    }

    const totalNights = pricingService.calculateNights(checkIn, checkOut);
    const roomTypes = db.roomTypes.find(rt => rt.propertyId === propertyId);
    const ratePlans = db.ratePlans.find(rp => rp.propertyId === propertyId);

    const results: RoomAvailabilityResponse[] = roomTypes.map((rt) => {
      // OVERLAP QUERY LOGIC per AGENTS.md §6:
      // existing.check_in < requested.check_out AND existing.check_out > requested.check_in
      const overlappingBookings = db.reservations.find(res =>
        res.propertyId === propertyId &&
        res.roomTypeId === rt.id &&
        ['confirmed', 'checked_in'].includes(res.status) &&
        res.checkInDate < checkOut &&
        res.checkOutDate > checkIn
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
    });

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
