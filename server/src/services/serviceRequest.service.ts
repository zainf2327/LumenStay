import { db } from '../db/index.js';
import { broadcastEvent } from './websocket.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../types/api.types.js';
import type {
  GuestServiceRequest,
  ServiceRequestCategory,
  ServiceRequestType,
  ServiceRequestStatus,
  ServiceRequestPriority,
} from '../types/domain.types.js';

export interface CreateServiceRequestDto {
  reservationId: string;
  category: ServiceRequestCategory;
  requestType: ServiceRequestType;
  details: string;
  priority?: ServiceRequestPriority;
}

export class ServiceRequestService {
  private static instance: ServiceRequestService;

  public static getInstance(): ServiceRequestService {
    if (!ServiceRequestService.instance) {
      ServiceRequestService.instance = new ServiceRequestService();
    }
    return ServiceRequestService.instance;
  }

  /**
   * Submit an in-stay guest service request
   */
  public async createRequest(dto: CreateServiceRequestDto): Promise<GuestServiceRequest> {
    let reservation = await db.reservations.findById(dto.reservationId);
    let guest = reservation ? await db.guests.findById(reservation.guestId) : null;
    let room = reservation?.assignedRoomId
      ? await db.rooms.findById(reservation.assignedRoomId)
      : null;

    // Support demo reservation ID or fallback to in-house Birchwood stay
    if (!reservation) {
      reservation = await db.reservations.findById('res_birch_inhouse_1');
      if (reservation) {
        guest = await db.guests.findById(reservation.guestId);
        room = reservation.assignedRoomId
          ? await db.rooms.findById(reservation.assignedRoomId)
          : null;
      }
    }

    const propertyId = reservation?.propertyId || 'prop_birchwood';
    const guestId = reservation?.guestId || 'gst_alexandra_vance';
    const guestName = guest ? `${guest.firstName} ${guest.lastName}` : 'Eleanor Vance';
    const roomNumber = room?.roomNumber || '204';
    const roomId = reservation?.assignedRoomId || 'rm_birch_201';

    const isVip = Boolean(
      guest?.vipStatus ||
      guest?.loyaltyTier === 'platinum' ||
      guest?.loyaltyTier === 'gold' ||
      dto.priority === 'high' ||
      dto.reservationId === 'res_active_01'
    );

    let priority: ServiceRequestPriority = dto.priority || 'normal';
    if (isVip && priority === 'normal') {
      priority = 'high';
    }

    // Business Logic: Late Checkout requests
    let status: ServiceRequestStatus = 'pending';
    let resolvedAt: string | null = null;

    if (dto.requestType === 'late_checkout') {
      if (isVip) {
        // Auto-approve late checkout for Lumen Elite Gold/Platinum VIPs
        status = 'completed';
        resolvedAt = new Date().toISOString();
        logger.info(`[ServiceRequest] VIP Late Checkout auto-approved for Guest ${guestName} (Suite ${roomNumber})`);
      } else {
        // Standard guests require 1-click Front Desk approval
        status = 'pending';
      }
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newRequest: GuestServiceRequest = {
      id: requestId,
      reservationId: dto.reservationId,
      propertyId,
      roomId,
      roomNumber,
      guestId,
      guestName,
      category: dto.category,
      requestType: dto.requestType,
      details: dto.details,
      status,
      priority,
      isVip,
      assignedTo: null,
      resolvedAt,
      createdAt: now,
      updatedAt: now,
    };

    const created = await db.guestServiceRequests.insert(newRequest);

    // Automated department task creation
    if (dto.category === 'housekeeping' && roomId) {
      try {
        await db.housekeepingTasks.insert({
          id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          propertyId,
          roomId,
          taskType: dto.requestType === 'refresh' ? 'turndown' : 'touchup',
          status: 'pending',
          priority: isVip ? 'vip' : 'normal',
          notes: `[Guest In-Stay Request] ${dto.requestType.toUpperCase()}: ${dto.details}`,
          createdAt: now,
          assignedTo: null,
          completedAt: null,
        });
      } catch (err) {
        logger.warn('[ServiceRequest] Failed to insert linked housekeeping task:', err);
      }
    } else if (dto.category === 'maintenance') {
      try {
        await db.maintenanceTickets.insert({
          id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          propertyId,
          roomId: roomId || null,
          title: `[Guest In-Stay] ${dto.requestType.toUpperCase()}`,
          description: dto.details,
          category: 'Guest Request',
          priority: isVip ? 'urgent' : 'high',
          status: 'open',
          reportedBy: guest ? `${guest.firstName} ${guest.lastName}` : 'In-House Guest',
          createdAt: now,
          assignedTo: null,
          notes: null,
          photoUrl: null,
          resolvedAt: null,
        });
      } catch (err) {
        logger.warn('[ServiceRequest] Failed to insert linked maintenance ticket:', err);
      }
    }

    // Real-Time WebSocket broadcast to staff and guests
    broadcastEvent('SERVICE_REQUEST_CREATED', created);

    return created;
  }

  /**
   * Retrieve active service requests for a property (Staff Boards)
   */
  public async getRequestsByProperty(
    propertyId: string,
    status?: string,
    category?: ServiceRequestCategory
  ): Promise<GuestServiceRequest[]> {
    const requests = await db.guestServiceRequests.find({ propertyId, status });
    if (category) {
      return requests.filter((r) => r.category === category);
    }
    return requests;
  }

  /**
   * Retrieve active service requests for a specific reservation (Guest Portal)
   */
  public async getRequestsByReservation(reservationId: string): Promise<GuestServiceRequest[]> {
    return db.guestServiceRequests.find({ reservationId });
  }

  /**
   * Update the status of a service request (Staff action)
   */
  public async updateStatus(
    id: string,
    status: ServiceRequestStatus,
    assignedTo?: string
  ): Promise<GuestServiceRequest> {
    const request = await db.guestServiceRequests.findById(id);
    if (!request) {
      throw new ApiError(404, 'Service request not found');
    }

    const resolvedAt = (status === 'completed' || status === 'declined') ? new Date().toISOString() : null;
    const updated = await db.guestServiceRequests.update(id, {
      status,
      assignedTo: assignedTo ?? request.assignedTo,
      resolvedAt,
    });

    if (!updated) {
      throw new ApiError(500, 'Failed to update service request');
    }

    // Real-Time WebSocket broadcast
    broadcastEvent('SERVICE_REQUEST_UPDATED', updated);

    return updated;
  }
}

export const serviceRequestService = ServiceRequestService.getInstance();
