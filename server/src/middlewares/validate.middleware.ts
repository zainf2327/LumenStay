import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../types/api.types.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      const result = schema.safeParse(dataToValidate);
      if (!result.success) {
        const zodError = result.error as ZodError;
        const formattedErrors = zodError.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        throw new ApiError(400, 'Validation failed for request parameters', formattedErrors);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
