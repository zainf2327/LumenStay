import type { Request, Response } from 'express';
import { guestService } from '../services/guest.service.js';
import { sendSuccess } from '../utils/response.util.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';

export const getAllGuests = asyncHandler(async (req: Request, res: Response) => {
  const guests = guestService.getAllGuests();
  return sendSuccess(res, guests, 'Guests retrieved successfully');
});

export const getGuestById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const guest = guestService.getGuestById(id);
  return sendSuccess(res, guest, 'Guest retrieved successfully');
});

export const updateGuest = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updated = guestService.updateGuest(id, req.body);
  return sendSuccess(res, updated, 'Guest updated successfully');
});
