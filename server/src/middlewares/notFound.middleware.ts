import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util.js';

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  return sendError(res, `Resource not found at ${req.method} ${req.originalUrl}`, 404);
};
