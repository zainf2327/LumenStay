import type { Response } from 'express';
import type { ApiResponse } from '../types/api.types.js';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message = 'An error occurred',
  statusCode = 500,
  errors?: any[]
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    ...(errors ? { errors } : {}),
  };
  return res.status(statusCode).json(response);
}
