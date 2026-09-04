import { Router } from 'express';
import { db } from '../db.js';
import { broadcastEvent } from '../services/websocket.js';
import { format } from 'date-fns';
import type { RoomStatus } from '../types/domain.types.js';

export const pmsRouter = Router();

// GET all rooms for a property with current occupancy & active reservation details
pmsRouter.get('/rooms', (req, res) => {
  try {
    const { propertyId } = req.query as { propertyId?: string };
    if (!propertyId) {
      return res.status(400).json({ success: false, error: 'propertyId query param is required' });
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const roomList = db.rooms.find(r => r.propertyId === propertyId);

    // Active reservations in these rooms
    const activeRes = db.reservations.find(res =>
      res.propertyId === propertyId &&
      ['confirmed', 'checked_in'].includes(res.status) &&
      res.checkInDate <= today &&
      res.checkOutDate >= today &&
      Boolean(res.assignedRoomId)
    );

    const resMap = new Map();
    for (const r of activeRes) {
      const g = db.guests.findById(r.guestId);
      resMap.set(r.assignedRoomId, {
        reservationId: r.id,
        confirmationCode: r.confirmationCode,
        guestName: g ? `${g.firstName} ${g.lastName}` : 'Guest',
        loyaltyTier: g?.loyaltyTier || 'member',
        vipStatus: g?.vipStatus || false,
        status: r.status,
        checkInDate: r.checkInDate,
        checkOutDate: r.checkOutDate,
      });
    }

    const formattedRooms = roomList.map((rm) => {
      const roomType = db.roomTypes.findById(rm.roomTypeId);
      const activeBooking = resMap.get(rm.id);
      return {
        ...rm,
        roomTypeName: roomType?.name || 'Room',
        roomTypeCode: roomType?.code || 'RM',
        basePrice: roomType?.basePrice || 0,
        isOccupied: Boolean(rm.isOccupied) || Boolean(activeBooking && activeBooking.status === 'checked_in'),
        currentReservation: activeBooking || null,
      };
    });

    res.json({ success: true, data: formattedRooms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Room Housekeeping/Operational Status
pmsRouter.patch('/rooms/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, quirks } = req.body as { status: RoomStatus; quirks?: string };

    if (!['clean', 'dirty', 'inspected', 'out_of_order'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid room status' });
    }

    const updates: any = { status };
    if (quirks !== undefined) {
      updates.quirks = quirks;
    }

    const updatedRoom = db.rooms.update(id, updates);
    if (!updatedRoom) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    broadcastEvent('ROOM_STATUS_CHANGED', {
      roomId: id,
      propertyId: updatedRoom.propertyId,
      roomNumber: updatedRoom.roomNumber,
      status,
      quirks: updatedRoom.quirks,
    });

    res.json({ success: true, data: updatedRoom });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Front Desk Property Dashboard Metrics
pmsRouter.get('/dashboard', (req, res) => {
  try {
    const { propertyId } = req.query as { propertyId?: string };
    if (!propertyId) {
      return res.status(400).json({ success: false, error: 'propertyId query param is required' });
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const propertyRooms = db.rooms.find(r => r.propertyId === propertyId);
    const totalRooms = propertyRooms.length;
    const cleanRooms = propertyRooms.filter(r => r.status === 'clean').length;
    const dirtyRooms = propertyRooms.filter(r => r.status === 'dirty').length;
    const inspectedRooms = propertyRooms.filter(r => r.status === 'inspected').length;
    const oooRooms = propertyRooms.filter(r => r.status === 'out_of_order').length;

    const arrivalsToday = db.reservations.count(r => r.propertyId === propertyId && r.checkInDate === today && r.status === 'confirmed');
    const inHouse = db.reservations.count(r => r.propertyId === propertyId && r.status === 'checked_in');
    const departuresToday = db.reservations.count(r => r.propertyId === propertyId && r.checkOutDate === today && r.status === 'checked_in');

    const occupancyRate = totalRooms > 0 ? Math.round((inHouse / totalRooms) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalRooms,
        occupancyRate,
        cleanRooms,
        dirtyRooms,
        inspectedRooms,
        oooRooms,
        arrivalsToday,
        inHouse,
        departuresToday,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Front Desk Reservation Queues
pmsRouter.get('/reservations', (req, res) => {
  try {
    const { propertyId, filter = 'all' } = req.query as { propertyId?: string; filter?: string };
    if (!propertyId) {
      return res.status(400).json({ success: false, error: 'propertyId query param is required' });
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    let reservations = db.reservations.find(r => r.propertyId === propertyId);

    if (filter === 'today_arrivals') {
      reservations = reservations.filter(r => r.checkInDate === today && r.status === 'confirmed');
    } else if (filter === 'in_house') {
      reservations = reservations.filter(r => r.status === 'checked_in');
    } else if (filter === 'today_departures') {
      reservations = reservations.filter(r => r.checkOutDate === today && r.status === 'checked_in');
    }

    const fullReservations = reservations.map(r => {
      const guest = db.guests.findById(r.guestId);
      const roomType = db.roomTypes.findById(r.roomTypeId);
      const assignedRoom = r.assignedRoomId ? db.rooms.findById(r.assignedRoomId) : null;
      return {
        ...r,
        guest,
        roomType,
        assignedRoom,
      };
    });

    res.json({ success: true, data: fullReservations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Check-In Guest
pmsRouter.post('/reservations/:id/check-in', (req, res) => {
  try {
    const { id } = req.params;
    const { assignedRoomId, idDocumentType, idDocumentNumber } = req.body;

    const reservation = db.reservations.findById(id);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    const finalRoomId = assignedRoomId || reservation.assignedRoomId;
    if (!finalRoomId) {
      return res.status(400).json({ success: false, error: 'A room must be assigned prior to check-in' });
    }

    const now = new Date().toISOString();

    // Update reservation
    db.reservations.update(id, {
      status: 'checked_in',
      assignedRoomId: finalRoomId,
      checkedInAt: now,
      digitalKeyIssued: true,
      updatedAt: now,
    });

    // Mark room as occupied
    db.rooms.update(finalRoomId, { isOccupied: true });

    // Update guest ID info if provided
    if (idDocumentType && idDocumentNumber) {
      db.guests.update(reservation.guestId, {
        idDocumentType,
        idDocumentNumber,
      });
    }

    broadcastEvent('GUEST_CHECKED_IN', {
      reservationId: id,
      propertyId: reservation.propertyId,
      roomId: finalRoomId,
    });

    res.json({ success: true, message: 'Guest checked in successfully', checkInTime: now });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Check-Out Guest
pmsRouter.post('/reservations/:id/check-out', (req, res) => {
  try {
    const { id } = req.params;
    const reservation = db.reservations.findById(id);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    const now = new Date().toISOString();

    // Update reservation status
    db.reservations.update(id, {
      status: 'checked_out',
      checkedOutAt: now,
      updatedAt: now,
    });

    // Free room and mark as dirty for housekeeping
    if (reservation.assignedRoomId) {
      db.rooms.update(reservation.assignedRoomId, {
        isOccupied: false,
        status: 'dirty',
      });

      // Create housekeeping turnover task
      db.housekeepingTasks.insert({
        id: `tsk_${Date.now()}`,
        propertyId: reservation.propertyId,
        roomId: reservation.assignedRoomId,
        taskType: 'checkout_clean',
        status: 'pending',
        priority: 'normal',
        notes: 'Guest checkout turnover clean',
        createdAt: now,
      });
    }

    broadcastEvent('GUEST_CHECKED_OUT', {
      reservationId: id,
      propertyId: reservation.propertyId,
      roomId: reservation.assignedRoomId,
    });

    res.json({ success: true, message: 'Guest checked out successfully and room marked dirty for turnover' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reassign Room
pmsRouter.patch('/reservations/:id/assign-room', (req, res) => {
  try {
    const { id } = req.params;
    const { roomId } = req.body;

    const reservation = db.reservations.findById(id);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    // Unoccupy previous room if checked in
    if (reservation.assignedRoomId && reservation.status === 'checked_in') {
      db.rooms.update(reservation.assignedRoomId, { isOccupied: false });
    }

    // Assign new room
    db.reservations.update(id, {
      assignedRoomId: roomId,
      updatedAt: new Date().toISOString(),
    });

    if (roomId && reservation.status === 'checked_in') {
      db.rooms.update(roomId, { isOccupied: true });
    }

    broadcastEvent('ROOM_REASSIGNED', { reservationId: id, newRoomId: roomId });

    res.json({ success: true, message: 'Room reassigned successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
