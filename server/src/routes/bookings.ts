import { Router } from 'express';
import { db } from '../db.js';
import { broadcastEvent } from '../services/websocket.js';
import { simulatePaymentTokenization, processTokenizedCharge } from '../services/paymentSimulator.js';
import type { Reservation, Guest, FolioCharge } from '../types/domain.types.js';

export const bookingsRouter = Router();

// Search room availability
bookingsRouter.get('/search', (req, res) => {
  try {
    const { propertyId, checkIn, checkOut, promoCode } = req.query as any;

    if (!propertyId || !checkIn || !checkOut) {
      return res.status(400).json({ success: false, error: 'propertyId, checkIn, and checkOut are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const totalNights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Get all room types for property
    const roomTypes = db.roomTypes.find(rt => rt.propertyId === propertyId);
    const ratePlans = db.ratePlans.find(rp => rp.propertyId === propertyId);

    const results = roomTypes.map((rt) => {
      // Find booked reservations during requested date range
      const overlapBookings = db.reservations.find(res =>
        res.propertyId === propertyId &&
        res.roomTypeId === rt.id &&
        ['confirmed', 'checked_in'].includes(res.status) &&
        res.checkInDate < checkOut &&
        res.checkOutDate > checkIn
      );

      const totalInventory = rt.totalInventory || 10;
      const availableCount = Math.max(0, totalInventory - overlapBookings.length);

      const applicablePlans = ratePlans.map((rp) => {
        let modifier = rp.priceModifier || 1.0;
        if (rp.isPromo && promoCode && promoCode.toUpperCase() === rp.promoCode?.toUpperCase()) {
          modifier = rp.priceModifier;
        }

        const nightlyPrice = Math.round(rt.basePrice * modifier);
        const subtotal = nightlyPrice * totalNights;
        const taxAmount = Math.round(subtotal * 0.12 * 100) / 100;
        const resortFee = 35 * totalNights;
        const grandTotal = Math.round((subtotal + taxAmount + resortFee) * 100) / 100;

        return {
          ratePlan: rp,
          calculatedNightlyPrice: nightlyPrice,
          calculatedTotalPrice: subtotal,
          taxAmount,
          resortFee,
          grandTotal,
        };
      });

      return {
        roomType: rt,
        availableCount,
        totalInventory,
        nightlyRates: applicablePlans,
      };
    });

    res.json({
      success: true,
      data: {
        propertyId,
        checkIn,
        checkOut,
        totalNights,
        results,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Reservation
bookingsRouter.post('/', (req, res) => {
  try {
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
      paymentDetails,
    } = req.body;

    if (!propertyId || !roomTypeId || !ratePlanId || !checkInDate || !checkOutDate || !guest?.email) {
      return res.status(400).json({ success: false, error: 'Missing required reservation fields' });
    }

    // 1. Calculate pricing
    const roomType = db.roomTypes.findById(roomTypeId);
    const ratePlan = db.ratePlans.findById(ratePlanId);
    const property = db.properties.findById(propertyId);

    if (!roomType || !ratePlan || !property) {
      return res.status(404).json({ success: false, error: 'Invalid room type, rate plan, or property' });
    }

    const dIn = new Date(checkInDate);
    const dOut = new Date(checkOutDate);
    const totalNights = Math.max(1, Math.ceil((dOut.getTime() - dIn.getTime()) / (1000 * 60 * 60 * 24)));

    const nightlyRate = Math.round(roomType.basePrice * (ratePlan.priceModifier || 1.0));
    const subtotal = nightlyRate * totalNights;
    const taxAmount = Math.round(subtotal * 0.12 * 100) / 100;
    const resortFee = 35 * totalNights;
    const totalAmount = Math.round((subtotal + taxAmount + resortFee) * 100) / 100;

    // 2. Find or create guest
    let existingGuest = db.guests.findOne(g => g.email.toLowerCase() === guest.email.toLowerCase());
    let guestId: string;

    if (!existingGuest) {
      guestId = `gst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newGuest: Guest = {
        id: guestId,
        firstName: guest.firstName || 'Guest',
        lastName: guest.lastName || '',
        email: guest.email,
        phone: guest.phone || '(555) 000-0000',
        city: guest.city || null,
        state: guest.state || null,
        country: guest.country || 'USA',
        loyaltyTier: 'member',
        loyaltyPoints: Math.round(totalAmount * 10),
        specialPreferences: guest.specialPreferences || null,
        notes: 'Direct website booking',
        vipStatus: false,
        createdAt: new Date().toISOString(),
      };
      db.guests.insert(newGuest);
    } else {
      guestId = existingGuest.id;
      db.guests.update(guestId, {
        loyaltyPoints: existingGuest.loyaltyPoints + Math.round(totalAmount * 10),
      });
    }

    // 3. Generate confirmation code
    const propPrefix = property.name.replace(/The\s+/i, '').substring(0, 2).toUpperCase();
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const confirmationCode = `LMN-${propPrefix}-${codeNum}`;
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // 4. Pre-assign available physical room
    const bookedRoomIds = db.reservations
      .find(r =>
        r.propertyId === propertyId &&
        Boolean(r.assignedRoomId) &&
        ['confirmed', 'checked_in'].includes(r.status) &&
        r.checkInDate < checkOutDate &&
        r.checkOutDate > checkInDate
      )
      .map(r => r.assignedRoomId as string);

    const availableRoom = db.rooms.findOne(r =>
      r.propertyId === propertyId &&
      r.roomTypeId === roomTypeId &&
      !bookedRoomIds.includes(r.id)
    );

    const assignedRoomId = availableRoom ? availableRoom.id : null;

    // 5. Payment processing
    const cardToken = paymentDetails?.token || simulatePaymentTokenization(paymentDetails?.cardNumber || '4242 4242 4242 4242');
    const paymentResult = processTokenizedCharge(cardToken, totalAmount);

    // 6. Insert reservation
    const newReservation: Reservation = {
      id: reservationId,
      confirmationCode,
      propertyId,
      guestId,
      roomTypeId,
      assignedRoomId,
      ratePlanId,
      status: 'confirmed',
      checkInDate,
      checkOutDate,
      adultCount,
      childCount,
      totalNights,
      nightlyRate,
      taxAmount,
      resortFee,
      totalAmount,
      paidAmount: totalAmount,
      paymentStatus: 'paid',
      specialRequests: specialRequests || null,
      estimatedArrival,
      digitalKeyIssued: false,
      source: 'direct',
      createdAt: now,
      updatedAt: now,
    };
    db.reservations.insert(newReservation);

    // 7. Generate Folio Ledger
    const charges: FolioCharge[] = [
      {
        id: `fol_${Date.now()}_1`,
        reservationId,
        propertyId,
        category: 'room_rate',
        description: `Nightly Rate (${totalNights} nights @ $${nightlyRate}/nt)`,
        amount: subtotal,
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
        amount: taxAmount,
        status: 'posted',
        postedBy: 'Booking Engine',
        createdAt: now,
      },
      {
        id: `fol_${Date.now()}_3`,
        reservationId,
        propertyId,
        category: 'resort_fee',
        description: 'Boutique Property Resort Amenity Fee',
        amount: resortFee,
        status: 'posted',
        postedBy: 'Booking Engine',
        createdAt: now,
      },
      {
        id: `fol_${Date.now()}_4`,
        reservationId,
        propertyId,
        category: 'payment',
        description: `Prepaid Online - Card ending in ${paymentResult.last4}`,
        amount: -totalAmount,
        status: 'paid',
        postedBy: 'Square Gateway',
        paymentMethod: `Credit Card (${paymentResult.brand} ending in ${paymentResult.last4})`,
        paymentRef: paymentResult.transactionId,
        createdAt: now,
      },
    ];
    db.folioCharges.insertMany(charges);

    // Broadcast WebSocket
    broadcastEvent('RESERVATION_CREATED', {
      reservationId,
      confirmationCode,
      propertyId,
      guestName: `${guest.firstName} ${guest.lastName}`,
      totalAmount,
    });

    res.json({
      success: true,
      data: {
        reservationId,
        confirmationCode,
        totalAmount,
        assignedRoomNumber: availableRoom?.roomNumber || 'Assigned at Check-In',
        paymentResult,
        status: 'confirmed',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lookup booking by confirmation code or ID
bookingsRouter.get('/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    const booking = db.reservations.findOne(r => r.confirmationCode === identifier || r.id === identifier);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    const property = db.properties.findById(booking.propertyId);
    const guest = db.guests.findById(booking.guestId);
    const roomType = db.roomTypes.findById(booking.roomTypeId);
    const ratePlan = db.ratePlans.findById(booking.ratePlanId);
    const assignedRoom = booking.assignedRoomId ? db.rooms.findById(booking.assignedRoomId) : null;
    const charges = db.folioCharges.find(c => c.reservationId === booking.id);

    res.json({
      success: true,
      data: {
        ...booking,
        property,
        guest,
        roomType,
        ratePlan,
        assignedRoom,
        charges,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cancel reservation
bookingsRouter.patch('/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const booking = db.reservations.findOne(r => r.id === id || r.confirmationCode === id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    db.reservations.update(booking.id, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });

    if (booking.assignedRoomId) {
      db.rooms.update(booking.assignedRoomId, { isOccupied: false });
    }

    broadcastEvent('RESERVATION_CANCELLED', { reservationId: booking.id, confirmationCode: booking.confirmationCode });

    res.json({ success: true, message: 'Reservation cancelled successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
