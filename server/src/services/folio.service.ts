import { db } from '../db/index.js';
import { processTokenizedCharge } from './paymentSimulator.js';
import { broadcastEvent } from './websocket.js';
import { ApiError } from '../types/api.types.js';
import type { FolioCharge } from '../types/domain.types.js';

export class FolioService {
  public getFolioByReservationId(reservationId: string) {
    const reservation = db.reservations.findById(reservationId);
    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }

    const guest = db.guests.findById(reservation.guestId);
    const assignedRoom = reservation.assignedRoomId ? db.rooms.findById(reservation.assignedRoomId) : null;
    const property = db.properties.findById(reservation.propertyId);
    const charges = db.folioCharges.find(c => c.reservationId === reservationId);

    let totalCharges = 0;
    let totalPayments = 0;

    for (const c of charges) {
      if (c.amount > 0 && c.status !== 'void') {
        totalCharges += c.amount;
      } else if (c.amount < 0 && c.status === 'paid') {
        totalPayments += Math.abs(c.amount);
      }
    }

    totalCharges = Math.round(totalCharges * 100) / 100;
    totalPayments = Math.round(totalPayments * 100) / 100;
    const balanceDue = Math.max(0, Math.round((totalCharges - totalPayments) * 100) / 100);

    return {
      reservationId: reservation.id,
      confirmationCode: reservation.confirmationCode,
      guestName: guest ? `${guest.firstName} ${guest.lastName}` : 'Guest',
      guestEmail: guest?.email,
      guestPhone: guest?.phone,
      propertyName: property?.name,
      propertyAddress: `${property?.address}, ${property?.city}, ${property?.state} ${property?.postalCode}`,
      propertyPhone: property?.phone,
      roomNumber: assignedRoom?.roomNumber || 'Not assigned',
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      charges,
      totalCharges,
      totalPayments,
      balanceDue,
      status: balanceDue <= 0 ? 'settled' : 'open',
    };
  }

  public addCharge(reservationId: string, category: FolioCharge['category'], description: string, amount: number, postedBy = 'Front Desk') {
    const reservation = db.reservations.findById(reservationId);
    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }

    const charge: FolioCharge = {
      id: `fol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reservationId,
      propertyId: reservation.propertyId,
      category,
      description,
      amount,
      status: 'posted',
      postedBy,
      createdAt: new Date().toISOString(),
    };

    db.folioCharges.insert(charge);
    broadcastEvent('FOLIO_UPDATED', {
      reservationId,
      propertyId: reservation.propertyId,
      newCharge: charge,
    });

    return charge;
  }

  public settlePayment(reservationId: string, amount: number, paymentMethod = 'Credit Card (Tokenized Square)', token = 'tok_sq_settle_4242') {
    const reservation = db.reservations.findById(reservationId);
    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }

    const paymentResult = processTokenizedCharge(token, amount);

    const paymentEntry: FolioCharge = {
      id: `fol_pay_${Date.now()}`,
      reservationId,
      propertyId: reservation.propertyId,
      category: 'payment',
      description: `Payment Settled — Card ending in ${paymentResult.last4}`,
      amount: -amount,
      status: 'paid',
      postedBy: 'Front Desk Settle',
      paymentMethod,
      paymentRef: `AUTH-${paymentResult.last4}`,
      createdAt: new Date().toISOString(),
    };

    db.folioCharges.insert(paymentEntry);
    db.reservations.update(reservationId, {
      paidAmount: reservation.paidAmount + amount,
      paymentStatus: 'paid',
    });

    broadcastEvent('FOLIO_UPDATED', {
      reservationId,
      propertyId: reservation.propertyId,
      payment: paymentEntry,
    });

    return {
      paymentEntry,
      paymentResult,
    };
  }
}

export const folioService = new FolioService();
