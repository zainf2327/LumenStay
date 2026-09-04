import { db } from '../db/index.js';
import { broadcastEvent } from './websocket.js';
import { format } from 'date-fns';
import { ApiError } from '../types/api.types.js';
import type { RoomStatus } from '../types/domain.types.js';

export class RoomService {
  public getRoomsForProperty(propertyId: string) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const roomList = db.rooms.find(r => r.propertyId === propertyId);

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

    return roomList.map((rm) => {
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
  }

  public updateRoomStatus(roomId: string, status: RoomStatus, quirks?: string) {
    const updates: any = { status };
    if (quirks !== undefined) updates.quirks = quirks;

    const updatedRoom = db.rooms.update(roomId, updates);
    if (!updatedRoom) {
      throw new ApiError(404, 'Room not found');
    }

    broadcastEvent('ROOM_STATUS_CHANGED', {
      roomId,
      propertyId: updatedRoom.propertyId,
      roomNumber: updatedRoom.roomNumber,
      status,
      quirks: updatedRoom.quirks,
    });

    return updatedRoom;
  }

  public getDashboardMetrics(propertyId: string) {
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

    return {
      totalRooms,
      occupancyRate,
      cleanRooms,
      dirtyRooms,
      inspectedRooms,
      oooRooms,
      arrivalsToday,
      inHouse,
      departuresToday,
    };
  }

  public getReservationsForQueue(propertyId: string, filter?: string) {
    const today = format(new Date(), 'yyyy-MM-dd');
    let resList = db.reservations.find(r => r.propertyId === propertyId);

    if (filter === 'arrivals') {
      resList = resList.filter(r => r.checkInDate === today && r.status === 'confirmed');
    } else if (filter === 'in_house') {
      resList = resList.filter(r => r.status === 'checked_in');
    } else if (filter === 'departures') {
      resList = resList.filter(r => r.checkOutDate === today && r.status === 'checked_in');
    }

    return resList.map((r) => {
      const guest = db.guests.findById(r.guestId);
      const roomType = db.roomTypes.findById(r.roomTypeId);
      const room = r.assignedRoomId ? db.rooms.findById(r.assignedRoomId) : null;
      return {
        ...r,
        guestName: guest ? `${guest.firstName} ${guest.lastName}` : 'Guest',
        guestEmail: guest?.email,
        guestPhone: guest?.phone,
        loyaltyTier: guest?.loyaltyTier || 'member',
        vipStatus: guest?.vipStatus || false,
        roomTypeName: roomType?.name || 'Suite',
        roomTypeCode: roomType?.code || 'RM',
        assignedRoomNumber: room?.roomNumber || null,
      };
    });
  }

  public checkInGuest(reservationId: string, assignedRoomId?: string, idType?: string, idNumber?: string) {
    const reservation = db.reservations.findById(reservationId);
    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }

    const finalRoomId = assignedRoomId || reservation.assignedRoomId;
    if (!finalRoomId) {
      throw new ApiError(400, 'A physical room must be assigned before check-in');
    }

    const now = new Date().toISOString();
    db.reservations.update(reservationId, {
      status: 'checked_in',
      assignedRoomId: finalRoomId,
      checkedInAt: now,
      digitalKeyIssued: true,
      updatedAt: now,
    });

    db.rooms.update(finalRoomId, { isOccupied: true });

    if (idType && idNumber) {
      db.guests.update(reservation.guestId, {
        idDocumentType: idType,
        idDocumentNumber: idNumber,
      });
    }

    broadcastEvent('GUEST_CHECKED_IN', {
      reservationId,
      propertyId: reservation.propertyId,
      roomId: finalRoomId,
    });

    return { checkInTime: now, assignedRoomId: finalRoomId };
  }

  public checkOutGuest(reservationId: string) {
    const reservation = db.reservations.findById(reservationId);
    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }

    const now = new Date().toISOString();
    db.reservations.update(reservationId, {
      status: 'checked_out',
      checkedOutAt: now,
      updatedAt: now,
    });

    if (reservation.assignedRoomId) {
      db.rooms.update(reservation.assignedRoomId, {
        isOccupied: false,
        status: 'dirty',
      });

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
      reservationId,
      propertyId: reservation.propertyId,
      roomId: reservation.assignedRoomId,
    });

    return { checkOutTime: now };
  }
}

export const roomService = new RoomService();
