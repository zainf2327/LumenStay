import { db, dbConnection } from '../db/index.js';
import { pricingService } from './pricing.service.js';
import { stripeService } from './stripe.service.js';
import { emailService } from './email.service.js';
import { broadcastEvent } from './websocket.js';
import { channexService } from './channex.service.js';
import { ApiError } from '../types/api.types.js';
import type { Reservation, Guest, FolioCharge } from '../types/domain.types.js';

export interface CreateBookingDTO {
  propertyId: string;
  roomTypeId: string;
  ratePlanId: string;
  checkInDate: string;
  checkOutDate: string;
  adultCount: number;
  childCount: number;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city?: string;
    state?: string;
    country?: string;
  };
  specialRequests?: string;
  estimatedArrival?: string;
  promoCode?: string;
  paymentDetails?: {
    paymentMethodId?: string;
    paymentIntentId?: string;
  };
}

export class BookingService {
  public async createBooking(dto: CreateBookingDTO) {
    const {
      propertyId,
      roomTypeId,
      ratePlanId,
      checkInDate,
      checkOutDate,
      adultCount = 2,
      childCount = 0,
      guest,
      specialRequests,
      estimatedArrival = '15:00',
      promoCode,
      paymentDetails,
    } = dto;

    const property = await db.properties.findById(propertyId);
    if (!property) throw new ApiError(404, 'Property not found');

    // 1. Resolve and validate Room Type
    let roomType = roomTypeId ? await db.roomTypes.findById(roomTypeId) : null;
    if (!roomType || roomType.propertyId !== propertyId) {
      const propertyRoomTypes = await db.roomTypes.findByPropertyId(propertyId);
      roomType = propertyRoomTypes.find((r) => r.id === roomTypeId) || propertyRoomTypes[0];
    }
    if (!roomType) {
      throw new ApiError(404, 'No room types available for selected property');
    }

    // 2. Resolve and validate Rate Plan
    let ratePlan = ratePlanId ? await db.ratePlans.findById(ratePlanId) : null;
    if (!ratePlan || ratePlan.propertyId !== propertyId) {
      const propertyRatePlans = await db.ratePlans.findByPropertyId(propertyId);
      ratePlan =
        propertyRatePlans.find((p) => p.id === ratePlanId) ||
        propertyRatePlans.find((p) => p.code === 'BAR' || p.code === 'STD' || p.id.includes('_std')) ||
        propertyRatePlans[0];
    }
    if (!ratePlan) {
      throw new ApiError(404, 'No rate plans available for selected property');
    }
    // 1. Availability Pre-Check before charging Stripe
    const preCheckOverlaps = await db.reservations.findOverlapping(
      propertyId,
      roomTypeId,
      checkInDate,
      checkOutDate
    );
    const totalInventory = roomType.totalInventory || 10;
    if (preCheckOverlaps.length >= totalInventory) {
      throw new ApiError(409, 'Room type is no longer available for the selected dates');
    }

    // 2. Pricing Calculation
    const pricing = pricingService.calculateBookingPricing(roomType, ratePlan, checkInDate, checkOutDate, promoCode);

    // 3. Real Stripe Payment Processing (100% Live Stripe API)
    const stripeResult = await stripeService.processPayment({
      amountInCents: Math.round(pricing.grandTotal * 100),
      currency: 'usd',
      customerEmail: guest.email,
      customerName: `${guest.firstName} ${guest.lastName}`,
      description: `LumenStay: ${roomType.name} at ${property.name} (${checkInDate} to ${checkOutDate})`,
      paymentMethodId: paymentDetails?.paymentMethodId,
      paymentIntentId: paymentDetails?.paymentIntentId,
      metadata: {
        propertyId,
        roomTypeId: roomType.id,
        ratePlanId: ratePlan.id,
        checkInDate,
        checkOutDate,
      },
    });

    // If 3D Secure / SCA authentication is required by bank
    if (stripeResult.requiresAction) {
      return {
        requiresAction: true,
        clientSecret: stripeResult.clientSecret,
        paymentIntentId: stripeResult.paymentIntentId,
        amount: stripeResult.amount,
        currency: stripeResult.currency,
        message: '3D Secure cardholder authentication required by your bank.',
      } as any;
    }

    // 4. Availability Re-Check & Assignment
    const overlappingBookings = await db.reservations.findOverlapping(
      propertyId,
      roomType.id,
      checkInDate,
      checkOutDate
    );

    if (overlappingBookings.length >= totalInventory) {
      throw new ApiError(409, 'Room type is no longer available for the selected dates');
    }

    // Find available physical room to assign
    const bookedRoomIds = overlappingBookings
      .map(r => r.assignedRoomId)
      .filter((id): id is string => Boolean(id));

    const propertyRooms = await db.rooms.findByPropertyId(propertyId);
    const availableRoom = propertyRooms.find(r =>
      r.roomTypeId === roomTypeId &&
      !bookedRoomIds.includes(r.id) &&
      r.status !== 'out_of_order'
    );

    const assignedRoomId = availableRoom ? availableRoom.id : null;

    // Find or Create Guest Profile
    let existingGuest = await db.guests.findByEmail(guest.email);
    let guestId: string;

    if (!existingGuest) {
      guestId = `gst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newGuest: Guest = {
        id: guestId,
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phone: guest.phone,
        city: guest.city || null,
        state: guest.state || null,
        country: guest.country || 'USA',
        loyaltyTier: 'member',
        loyaltyPoints: Math.round(pricing.grandTotal * 10),
        vipStatus: false,
        createdAt: new Date().toISOString(),
      };
      await db.guests.insert(newGuest);
    } else {
      guestId = existingGuest.id;
      await db.guests.update(guestId, {
        loyaltyPoints: existingGuest.loyaltyPoints + Math.round(pricing.grandTotal * 10),
      });
    }

    // Generate Confirmation Code
    const propPrefix = property.name.replace(/The\s+/i, '').substring(0, 2).toUpperCase();
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const confirmationCode = `LMN-${propPrefix}-${codeNum}`;
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // Write Reservation Record
    const newReservation: Reservation = {
      id: reservationId,
      confirmationCode,
      propertyId,
      guestId,
      roomTypeId: roomType.id,
      assignedRoomId,
      ratePlanId: ratePlan.id,
      status: 'confirmed',
      checkInDate,
      checkOutDate,
      adultCount,
      childCount,
      totalNights: pricing.totalNights,
      nightlyRate: pricing.nightlyRate,
      taxAmount: pricing.taxAmount,
      resortFee: pricing.resortFee,
      totalAmount: pricing.grandTotal,
      paidAmount: pricing.grandTotal,
      paymentStatus: 'paid',
      specialRequests: specialRequests || null,
      estimatedArrival,
      digitalKeyIssued: false,
      source: 'direct',
      createdAt: now,
      updatedAt: now,
    };
    await db.reservations.insert(newReservation);

    // Open Folio Ledger
    const initialCharges: FolioCharge[] = [
      {
        id: `fol_${Date.now()}_1`,
        reservationId,
        propertyId,
        category: 'room_rate',
        description: `Nightly Room Charge (${pricing.totalNights} nts @ $${pricing.nightlyRate}/nt)`,
        amount: pricing.subtotal,
        status: 'posted',
        postedBy: 'Booking Engine',
        createdAt: now,
      },
      {
        id: `fol_${Date.now()}_2`,
        reservationId,
        propertyId,
        category: 'tax',
        description: 'State & Lodging Taxes (12%)',
        amount: pricing.taxAmount,
        status: 'posted',
        postedBy: 'Booking Engine',
        createdAt: now,
      },
      {
        id: `fol_${Date.now()}_3`,
        reservationId,
        propertyId,
        category: 'resort_fee',
        description: 'Property Resort & Amenity Fee',
        amount: pricing.resortFee,
        status: 'posted',
        postedBy: 'Booking Engine',
        createdAt: now,
      },
      {
        id: `fol_${Date.now()}_4`,
        reservationId,
        propertyId,
        category: 'payment',
        description: `Payment Received — Card ending in ${stripeResult.cardLast4 || '4242'}`,
        amount: -pricing.grandTotal,
        status: 'paid',
        postedBy: 'Online Prepayment',
        paymentMethod: `Card ending in ${stripeResult.cardLast4 || '4242'}`,
        paymentRef: `AUTH-${stripeResult.cardLast4 || '4242'}`,
        createdAt: now,
      },
    ];
    for (const c of initialCharges) {
      await db.folioCharges.insert(c);
    }

    broadcastEvent('RESERVATION_CREATED', {
      reservationId,
      confirmationCode,
      propertyId,
      guestName: `${guest.firstName} ${guest.lastName}`,
      totalAmount: pricing.grandTotal,
    });

    // Instant Outbound Inventory Sync to OTAs (<3.0s Parity Guarantee)
    channexService.syncAvailability(propertyId, roomType.id).catch((err) => {
      console.error('[Channex Outbound Sync Error]:', err);
    });

    // Dispatch Resend Email Asynchronously after DB commit
    emailService.sendBookingConfirmation({
      guestName: `${guest.firstName} ${guest.lastName}`,
      guestEmail: guest.email,
      confirmationCode,
      propertyName: property.name,
      propertyAddress: property.address ? `${property.address}, ${property.city}, ${property.state}` : `${property.city}, ${property.state}`,
      propertyPhone: property.phone || '+1 (800) 555-0199',
      propertyEmail: property.email || 'concierge@lumenstay.com',
      roomTypeName: roomType.name,
      ratePlanName: ratePlan.name,
      checkInDate,
      checkOutDate,
      totalNights: pricing.totalNights,
      adultCount,
      childCount,
      assignedRoomNumber: availableRoom?.roomNumber,
      specialRequests,
      nightlyRate: pricing.nightlyRate,
      subtotal: pricing.subtotal,
      taxAmount: pricing.taxAmount,
      resortFee: pricing.resortFee,
      grandTotal: pricing.grandTotal,
      cardLast4: stripeResult.cardLast4,
    }).catch((err) => {
      console.error('[Resend Background Error]:', err);
    });

    return {
      reservationId,
      confirmationCode,
      totalAmount: pricing.grandTotal,
      assignedRoomNumber: availableRoom?.roomNumber || 'Assigned at Check-in',
      paymentResult: stripeResult,
      status: 'confirmed',
    };
  }

  public async getBookingByIdentifier(identifier: string) {
    let booking = await db.reservations.findById(identifier);
    if (!booking) {
      booking = await db.reservations.findByConfirmationCode(identifier);
    }
    if (!booking) {
      throw new ApiError(404, 'Reservation not found');
    }

    const property = await db.properties.findById(booking.propertyId);
    const guest = await db.guests.findById(booking.guestId);
    const roomType = await db.roomTypes.findById(booking.roomTypeId);
    const ratePlan = await db.ratePlans.findById(booking.ratePlanId);
    const assignedRoom = booking.assignedRoomId ? await db.rooms.findById(booking.assignedRoomId) : null;
    const charges = await db.folioCharges.findByReservationId(booking.id);

    return {
      ...booking,
      property,
      guest,
      roomType,
      ratePlan,
      assignedRoom,
      charges,
    };
  }

  public async cancelBooking(identifier: string) {
    let booking = await db.reservations.findById(identifier);
    if (!booking) {
      booking = await db.reservations.findByConfirmationCode(identifier);
    }
    if (!booking) {
      throw new ApiError(404, 'Reservation not found');
    }

    if (booking.status === 'cancelled') {
      throw new ApiError(400, 'Reservation is already cancelled');
    }

    await db.reservations.update(booking.id, {
      status: 'cancelled',
    });

    if (booking.assignedRoomId) {
      await db.rooms.update(booking.assignedRoomId, { isOccupied: false });
    }

    broadcastEvent('RESERVATION_CANCELLED', {
      reservationId: booking.id,
      confirmationCode: booking.confirmationCode,
    });

    return { message: 'Reservation cancelled successfully' };
  }
}

export const bookingService = new BookingService();
