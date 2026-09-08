import { z } from 'zod';

export const inviteStaffValidator = z.object({
  body: z.object({
    email: z.string().email('Valid work email address is required'),
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    role: z.enum([
      'owner',
      'gm',
      'front_desk',
      'housekeeping',
      'housekeeping_supervisor',
      'maintenance',
      'revenue_manager',
    ], {
      errorMap: () => ({ message: 'Invalid staff role specified' }),
    }),
    propertyId: z.string().optional().nullable(),
    personalNote: z.string().max(500, 'Personal note cannot exceed 500 characters').optional().nullable(),
  }),
});

export const resendInviteValidator = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});
