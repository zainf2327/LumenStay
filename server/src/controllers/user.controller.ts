import type { Response } from 'express';
import { userService } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.util.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { ApiError } from '../types/api.types.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export const getStaff = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  const propertyId = req.query.propertyId as string | undefined;
  const staff = await userService.getStaff(req.user as any, propertyId);
  return sendSuccess(res, staff, 'Staff members retrieved successfully');
});

export const inviteStaff = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  const rawOrigin = req.headers.origin || req.headers.referer;
  const originStr = Array.isArray(rawOrigin) ? rawOrigin[0] : (rawOrigin || '');
  const originUrl = originStr.replace(/\/$/, '');
  const result = await userService.inviteStaff(req.user as any, req.body, originUrl);

  return sendSuccess(
    res,
    result,
    `Staff invitation dispatched to ${result.user.email}. An activation email has been sent.`,
    201
  );
});

export const resendInvite = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  const userId = String(req.params.id);
  const rawOrigin = req.headers.origin || req.headers.referer;
  const originStr = Array.isArray(rawOrigin) ? rawOrigin[0] : (rawOrigin || '');
  const originUrl = originStr.replace(/\/$/, '');
  const result = await userService.resendInvitation(req.user as any, userId, originUrl);

  return sendSuccess(
    res,
    result,
    `A fresh invitation link has been dispatched to ${result.user.email}.`
  );
});

export const deactivateStaff = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  const userId = String(req.params.id);
  await userService.deactivateStaff(req.user as any, userId);

  return sendSuccess(res, { id: userId }, 'Staff account updated / deactivated successfully');
});
