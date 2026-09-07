import type { Request, Response } from 'express';
import { bookingService } from '../services/booking.service.js';
import { sendSuccess } from '../utils/response.util.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const result = await bookingService.createBooking(req.body);
  return sendSuccess(res, result, 'Reservation created successfully', 201);
});

export const getBookingByIdentifier = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const booking = await bookingService.getBookingByIdentifier(id);
  return sendSuccess(res, booking, 'Reservation retrieved successfully');
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await bookingService.cancelBooking(id);
  return sendSuccess(res, result, 'Reservation cancelled successfully');
});
