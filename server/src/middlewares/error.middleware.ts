import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/api.types.js';
import { sendError } from '../utils/response.util.js';
import { logger } from '../utils/logger.js';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Unhandled error at ${req.method} ${req.originalUrl}:`, err);

  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  const message = err.message || 'Internal Server Error';
  const statusCode = err.statusCode || 500;
  return sendError(res, message, statusCode);
};
