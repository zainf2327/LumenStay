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
