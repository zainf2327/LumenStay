import { Router } from 'express';
import { db } from '../db.js';
import { processTokenizedCharge } from '../services/paymentSimulator.js';
import { broadcastEvent } from '../services/websocket.js';
import type { FolioCharge } from '../types/domain.types.js';

export const foliosRouter = Router();

// GET Folio for Reservation
foliosRouter.get('/:reservationId', (req, res) => {
  try {
    const { reservationId } = req.params;
    const reservation = db.reservations.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
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

    res.json({
      success: true,
      data: {
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
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Charge to Folio (Minibar, Dining, Parking, Spa, Late Checkout)
foliosRouter.post('/:reservationId/charge', (req, res) => {
  try {
    const { reservationId } = req.params;
    const { category, description, amount, postedBy = 'Front Desk' } = req.body;

    if (!category || !description || !amount) {
      return res.status(400).json({ success: false, error: 'category, description, and amount are required' });
    }

    const reservation = db.reservations.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    const charge: FolioCharge = {
      id: `fol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reservationId,
      propertyId: reservation.propertyId,
      category,
      description,
      amount: parseFloat(amount),
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

    res.json({ success: true, data: charge });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Payment to Folio (Tokenized Settle)
foliosRouter.post('/:reservationId/payment', (req, res) => {
  try {
    const { reservationId } = req.params;
    const { amount, paymentMethod = 'Credit Card (Tokenized Square)', token = 'tok_sq_settle_4242' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payment amount is required' });
    }

    const reservation = db.reservations.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    const paymentResult = processTokenizedCharge(token, parseFloat(amount));

    const paymentEntry: FolioCharge = {
      id: `fol_pay_${Date.now()}`,
      reservationId,
      propertyId: reservation.propertyId,
      category: 'payment',
      description: `Settlement Payment - ${paymentResult.brand} ending in ${paymentResult.last4}`,
      amount: -parseFloat(amount),
      status: 'paid',
      postedBy: 'Front Desk',
      paymentMethod,
      paymentRef: paymentResult.transactionId,
      createdAt: new Date().toISOString(),
    };

    db.folioCharges.insert(paymentEntry);

    // Update reservation paid amount
    db.reservations.update(reservationId, {
      paidAmount: reservation.paidAmount + parseFloat(amount),
      paymentStatus: 'paid',
    });

    broadcastEvent('FOLIO_UPDATED', {
      reservationId,
      propertyId: reservation.propertyId,
      payment: paymentEntry,
    });

    res.json({
      success: true,
      data: paymentEntry,
      paymentResult,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
