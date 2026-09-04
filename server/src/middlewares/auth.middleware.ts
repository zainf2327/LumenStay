import type { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../services/auth.service.js';
import { ApiError } from '../types/api.types.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = authService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
};
