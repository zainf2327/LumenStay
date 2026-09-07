import { db } from '../db/index.js';
import { broadcastEvent } from './websocket.js';
import { ApiError } from '../types/api.types.js';
import type { MaintenanceTicket } from '../types/domain.types.js';

export class MaintenanceService {
  public async getTicketsForProperty(propertyId?: string) {
    const tickets = await db.maintenanceTickets.find(propertyId);

    const enriched = await Promise.all(
      tickets.map(async (tkt) => {
        const room = tkt.roomId ? await db.rooms.findById(tkt.roomId) : null;
        return {
          ...tkt,
          roomNumber: room?.roomNumber || (tkt.roomId ? tkt.roomId.replace(/^rm_[^_]+_/, '') : 'General'),
          building: room?.building || 'Main',
          floor: room?.floor || 1,
        };
      })
    );

    return enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async createTicket(data: {
    propertyId: string;
    roomId?: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    reportedBy: string;
    notes?: string;
    takeOutOfOrder?: boolean;
  }) {
    const property = await db.properties.findById(data.propertyId);
    if (!property) {
      throw new ApiError(404, 'Property not found');
    }

    let room = data.roomId ? await db.rooms.findById(data.roomId) : undefined;

    const id = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTicket: MaintenanceTicket = {
      id,
      propertyId: data.propertyId,
      roomId: data.roomId || null,
      title: data.title,
      description: data.description,
      priority: data.priority || 'medium',
      status: 'open',
      category: data.category || 'General',
      reportedBy: data.reportedBy || 'Staff',
      notes: data.notes || null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
    };

    await db.maintenanceTickets.insert(newTicket);

    // If requested, take room out of order
    if (data.takeOutOfOrder && room) {
      await db.rooms.update(room.id, {
        status: 'out_of_order',
        quirks: data.description ? `${data.category}: ${data.description}` : room.quirks,
      });

      broadcastEvent('ROOM_STATUS_CHANGED', {
        roomId: room.id,
        propertyId: data.propertyId,
        roomNumber: room.roomNumber,
        status: 'out_of_order',
      });
    }

    const payload = {
      ...newTicket,
      roomNumber: room?.roomNumber || 'General',
    };

    broadcastEvent('MAINTENANCE_TICKET_CREATED', payload);

    return payload;
  }

  public async resolveTicket(id: string, notes?: string) {
    const ticket = await db.maintenanceTickets.findById(id);
    if (!ticket) {
      throw new ApiError(404, 'Maintenance ticket not found');
    }

    const updated = await db.maintenanceTickets.update(id, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      notes: notes ? (ticket.notes ? `${ticket.notes} | Resolution: ${notes}` : notes) : ticket.notes,
    });

    broadcastEvent('MAINTENANCE_TICKET_UPDATED', updated);

    return updated;
  }
}

export const maintenanceService = new MaintenanceService();
