import { db } from '../db/index.js';
import { broadcastEvent } from './websocket.js';
import { format } from 'date-fns';
import { ApiError } from '../types/api.types.js';
import type { RoomStatus } from '../types/domain.types.js';

export class RoomService {
  public async getRoomsForProperty(propertyId: string) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const roomList = await db.rooms.findByPropertyId(propertyId);
    const activeRes = (await db.reservations.findActiveByPropertyId(propertyId, today)).filter(r => Boolean(r.assignedRoomId));
    const roomTypes = await db.roomTypes.findByPropertyId(propertyId);
    const roomTypeMap = new Map(roomTypes.map(rt => [rt.id, rt]));

    const resMap = new Map();
    for (const r of activeRes) {
      if (!r.assignedRoomId) continue;
      const g = await db.guests.findById(r.guestId);
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
      const roomType = roomTypeMap.get(rm.roomTypeId);
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

  public async updateRoomStatus(roomId: string, status: RoomStatus, quirks?: string) {
    const updates: any = { status };
    if (quirks !== undefined) updates.quirks = quirks;

    const updatedRoom = await db.rooms.update(roomId, updates);
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

  public async getDashboardMetrics(propertyId: string) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const propertyRooms = await db.rooms.findByPropertyId(propertyId);
    const totalRooms = propertyRooms.length;
    const cleanRooms = propertyRooms.filter(r => r.status === 'clean').length;
    const dirtyRooms = propertyRooms.filter(r => r.status === 'dirty').length;
    const inspectedRooms = propertyRooms.filter(r => r.status === 'inspected').length;
    const oooRooms = propertyRooms.filter(r => r.status === 'out_of_order').length;

    const resList = await db.reservations.findByPropertyId(propertyId);

    const arrivalsToday = resList.filter(r => r.checkInDate === today && r.status === 'confirmed').length;
    const inHouse = resList.filter(r => r.status === 'checked_in').length;
    const departuresToday = resList.filter(r => r.checkOutDate === today && r.status === 'checked_in').length;

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

  public async getReservationsForQueue(propertyId: string, filter?: string) {
    const today = format(new Date(), 'yyyy-MM-dd');
    let resList = await db.reservations.findByPropertyId(propertyId);

    if (filter === 'arrivals') {
      resList = resList.filter(r => r.checkInDate === today && r.status === 'confirmed');
    } else if (filter === 'in_house') {
      resList = resList.filter(r => r.status === 'checked_in');
    } else if (filter === 'departures') {
      resList = resList.filter(r => r.checkOutDate === today && r.status === 'checked_in');
    }

    const roomTypes = await db.roomTypes.findByPropertyId(propertyId);
    const roomTypeMap = new Map(roomTypes.map(rt => [rt.id, rt]));
    const rooms = await db.rooms.findByPropertyId(propertyId);
    const roomMap = new Map(rooms.map(r => [r.id, r]));

    const enriched = await Promise.all(
      resList.map(async (r) => {
        const guest = await db.guests.findById(r.guestId);
        const roomType = roomTypeMap.get(r.roomTypeId);
        const room = r.assignedRoomId ? roomMap.get(r.assignedRoomId) : null;
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
      })
    );

    return enriched;
  }

  public async checkInGuest(reservationId: string, assignedRoomId?: string, idType?: string, idNumber?: string) {
    const reservation = await db.reservations.findById(reservationId);
    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }

    const finalRoomId = assignedRoomId || reservation.assignedRoomId;
    if (!finalRoomId) {
      throw new ApiError(400, 'A physical room must be assigned before check-in');
    }

    const now = new Date().toISOString();
    await db.reservations.update(reservationId, {
      status: 'checked_in',
      assignedRoomId: finalRoomId,
      checkedInAt: now,
    });

    await db.rooms.update(finalRoomId, { isOccupied: true });

    if (idType && idNumber) {
      await db.guests.update(reservation.guestId, {
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

  public async checkOutGuest(reservationId: string) {
    const reservation = await db.reservations.findById(reservationId);
    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }

    const now = new Date().toISOString();
    await db.reservations.update(reservationId, {
      status: 'checked_out',
      checkedOutAt: now,
    });

    if (reservation.assignedRoomId) {
      await db.rooms.update(reservation.assignedRoomId, {
        isOccupied: false,
        status: 'dirty',
      });

      await db.housekeepingTasks.insert({
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

