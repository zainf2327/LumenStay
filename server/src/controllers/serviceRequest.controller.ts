import type { Request, Response } from 'express';
import { serviceRequestService } from '../services/serviceRequest.service.js';
import { sendSuccess } from '../utils/response.util.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import type { ServiceRequestCategory, ServiceRequestStatus } from '../types/domain.types.js';

export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const { reservationId, category, requestType, details, priority } = req.body;
  const request = await serviceRequestService.createRequest({
    reservationId,
    category,
    requestType,
    details,
    priority,
  });
  return sendSuccess(res, request, 'Service request submitted successfully', 201);
});

export const getRequestsByProperty = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = req.params.propertyId as string;
  const status = req.query.status as string | undefined;
  const category = req.query.category as ServiceRequestCategory | undefined;
  const requests = await serviceRequestService.getRequestsByProperty(propertyId, status, category);
  return sendSuccess(res, requests, 'Property service requests retrieved successfully');
});

export const getRequestsByReservation = asyncHandler(async (req: Request, res: Response) => {
  const reservationId = req.params.reservationId as string;
  const requests = await serviceRequestService.getRequestsByReservation(reservationId);
  return sendSuccess(res, requests, 'Reservation service requests retrieved successfully');
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, assignedTo } = req.body;
  const updated = await serviceRequestService.updateStatus(id, status as ServiceRequestStatus, assignedTo);
  return sendSuccess(res, updated, 'Service request status updated successfully');
});
