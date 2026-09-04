import type { Request, Response } from 'express';
import { availabilityService } from '../services/availability.service.js';
import { sendSuccess } from '../utils/response.util.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';

export const getAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId, checkIn, checkOut, promoCode } = req.query as {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    promoCode?: string;
  };

  const availability = availabilityService.getAvailability(
    propertyId,
    checkIn,
    checkOut,
    promoCode
  );

  return sendSuccess(res, availability, 'Availability fetched successfully');
});
