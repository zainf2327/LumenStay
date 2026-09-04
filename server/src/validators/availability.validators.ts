import { z } from 'zod';

export const getAvailabilityValidator = z.object({
  query: z.object({
    propertyId: z.string().min(1, 'propertyId is required'),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkIn must be YYYY-MM-DD'),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOut must be YYYY-MM-DD'),
    adults: z.coerce.number().int().min(1).default(2),
    children: z.coerce.number().int().min(0).default(0),
    promoCode: z.string().optional(),
  }),
});
