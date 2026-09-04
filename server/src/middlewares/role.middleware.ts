import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.middleware.js';
import { ApiError } from '../types/api.types.js';
import type { UserRole } from '../types/domain.types.js';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userRole = req.user.role as UserRole;

    // Owners have universal portfolio access
    if (userRole === 'owner') {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return next(
        new ApiError(
          403,
          `Access forbidden: Role '${userRole}' does not have permission for this resource.`
        )
      );
    }

    next();
  };
};
