import type { Request, Response } from 'express';
import { roomService } from '../services/room.service.js';
import { sendSuccess } from '../utils/response.util.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';

export const getRooms = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.query as { propertyId: string };
  const rooms = await roomService.getRoomsForProperty(propertyId);
  return sendSuccess(res, rooms, 'Rooms fetched successfully');
});

export const updateRoomStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, quirks } = req.body;
  const updatedRoom = await roomService.updateRoomStatus(id, status, quirks);
  return sendSuccess(res, updatedRoom, 'Room status updated successfully');
});

export const getDashboardMetrics = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.query as { propertyId: string };
  const metrics = await roomService.getDashboardMetrics(propertyId);
  return sendSuccess(res, metrics, 'PMS dashboard metrics fetched successfully');
});

export const getReservations = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId, filter } = req.query as { propertyId: string; filter?: string };
  const reservations = await roomService.getReservationsForQueue(propertyId, filter);
  return sendSuccess(res, reservations, 'PMS queue reservations fetched successfully');
});

export const checkInGuest = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { assignedRoomId, idDocumentType, idDocumentNumber, estimatedArrival, vehiclePlate } = req.body;
  const result = await roomService.checkInGuest(
    id,
    assignedRoomId,
    idDocumentType,
    idDocumentNumber,
    estimatedArrival,
    vehiclePlate
  );
  return sendSuccess(res, result, 'Guest checked in successfully');
});

export const checkOutGuest = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await roomService.checkOutGuest(id);
  return sendSuccess(res, result, 'Guest checked out successfully');
});
