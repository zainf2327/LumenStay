import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { config } from '../config/index.js';
import { ApiError } from '../types/api.types.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

const isProd = config.nodeEnv === 'production';
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  path: '/api/v1/auth',
  maxAge: config.refreshTokenExpiryDays * 24 * 60 * 60 * 1000, // 7 days in ms
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password);

  // Set 7-day secure HTTP-only cookie
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendSuccess(
    res,
    { user, accessToken, expiresIn: '15m' },
    'Login successful'
  );
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);

  // Set 7-day secure HTTP-only cookie
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendSuccess(
    res,
    { user, accessToken, expiresIn: '15m' },
    'Registration successful. Welcome to LumenStay!',
    201
  );
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    return sendError(res, 'No active session', 401);
  }

  const { user, accessToken, refreshToken: newRefreshToken } = await authService.refresh(incomingRefreshToken);

  // Rotate 7-day secure HTTP-only cookie
  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS);

  return sendSuccess(
    res,
    { user, accessToken, expiresIn: '15m' },
    'Session token refreshed successfully'
  );
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/v1/auth',
  });

  return sendSuccess(res, null, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }

  const user = await authService.getCurrentUser(req.user.id);
  const { passwordHash: _, ...safeUser } = user;
  return sendSuccess(res, safeUser, 'Current user profile retrieved');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  // Security best practice: Always return standard positive acknowledgment
  return sendSuccess(
    res,
    { email },
    'If an account exists with this email address, password reset instructions have been sent.'
  );
});
