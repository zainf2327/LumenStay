import { z } from 'zod';

export const getPropertyValidator = z.object({
  params: z.object({
    id: z.string().min(1, 'Property ID or slug is required'),
  }),
});

export const setBroadcastValidator = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    message: z.string().min(1, 'Broadcast message cannot be empty'),
    priority: z.enum(['info', 'warning', 'urgent']).optional(),
    author: z.string().optional(),
  }),
});

