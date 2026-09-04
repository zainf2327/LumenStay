import { z } from 'zod';

export const getPropertyValidator = z.object({
  params: z.object({
    id: z.string().min(1, 'Property ID or slug is required'),
  }),
});
