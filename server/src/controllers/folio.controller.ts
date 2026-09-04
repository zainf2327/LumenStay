import type { Request, Response } from 'express';
import { folioService } from '../services/folio.service.js';
import { sendSuccess } from '../utils/response.util.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';

export const getFolio = asyncHandler(async (req: Request, res: Response) => {
  const reservationId = req.params.reservationId as string;
  const folio = folioService.getFolioByReservationId(reservationId);
  return sendSuccess(res, folio, 'Folio retrieved successfully');
});

export const addCharge = asyncHandler(async (req: Request, res: Response) => {
  const reservationId = req.params.reservationId as string;
  const { category, description, amount, postedBy } = req.body;
  const charge = folioService.addCharge(reservationId, category, description, amount, postedBy);
  return sendSuccess(res, charge, 'Incidental charge posted successfully', 201);
});

export const settlePayment = asyncHandler(async (req: Request, res: Response) => {
  const reservationId = req.params.reservationId as string;
  const { amount, paymentMethod, token } = req.body;
  const result = folioService.settlePayment(reservationId, amount, paymentMethod, token);
  return sendSuccess(res, result, 'Payment settled successfully');
});
