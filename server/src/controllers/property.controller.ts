import type { Request, Response } from 'express';
import { propertyService } from '../services/property.service.js';
import { sendSuccess } from '../utils/response.util.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';

export const getAllProperties = asyncHandler(async (req: Request, res: Response) => {
  const properties = await propertyService.getAllProperties();
  return sendSuccess(res, properties, 'Properties fetched successfully');
});

export const getPropertyById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const property = await propertyService.getPropertyByIdOrSlug(id);
  return sendSuccess(res, property, 'Property fetched successfully');
});

export const getPropertyBroadcast = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const broadcast = await propertyService.getActiveBroadcast(id);
  return sendSuccess(res, broadcast, 'Property broadcast fetched successfully');
});

export const setPropertyBroadcast = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { message, priority, author } = req.body;
  const broadcast = await propertyService.setBroadcast(id, message, priority, author);
  return sendSuccess(res, broadcast, 'Property broadcast published successfully', 201);
});

export const clearPropertyBroadcast = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await propertyService.clearBroadcast(id);
  return sendSuccess(res, { cleared: true }, 'Property broadcast cleared successfully');
});

export const getPropertyChecklists = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const checklists = await propertyService.getChecklists(id);
  return sendSuccess(res, checklists, 'Property shift checklists fetched successfully');
});

export const updatePropertyChecklists = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updates = req.body;
  const updated = await propertyService.updateChecklists(id, updates);
  return sendSuccess(res, updated, 'Property shift checklists updated successfully');
});
