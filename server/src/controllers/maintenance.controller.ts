import type { Request, Response } from 'express';
import { maintenanceService } from '../services/maintenance.service.js';
import { sendSuccess } from '../utils/response.util.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';

export const getTickets = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.query as { propertyId?: string };
  const tickets = await maintenanceService.getTicketsForProperty(propertyId);
  return sendSuccess(res, tickets, 'Maintenance tickets fetched successfully');
});

export const createTicket = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId, roomId, title, description, priority, category, reportedBy, notes, takeOutOfOrder } = req.body;
  const ticket = await maintenanceService.createTicket({
    propertyId,
    roomId,
    title,
    description,
    priority,
    category,
    reportedBy,
    notes,
    takeOutOfOrder,
  });
  return sendSuccess(res, ticket, 'Maintenance ticket created successfully', 201);
});

export const resolveTicket = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { notes } = req.body || {};
  const ticket = await maintenanceService.resolveTicket(id, notes);
  return sendSuccess(res, ticket, 'Maintenance ticket resolved successfully');
});
