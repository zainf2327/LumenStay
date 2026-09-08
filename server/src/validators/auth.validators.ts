import { z } from 'zod';

export const loginValidator = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const registerValidator = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Full name is required'),
    phone: z.string().optional(),
    role: z.enum(['owner', 'gm', 'front_desk', 'housekeeping', 'housekeeping_supervisor', 'maintenance', 'revenue_manager', 'guest']).optional(),
    propertyId: z.string().optional().nullable(),
    preferredLanguage: z.enum(['en', 'es']).optional(),
  }),
});

export const forgotPasswordValidator = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required'),
  }),
});

export const verifyInvitationValidator = z.object({
  query: z.object({
    token: z.string().min(1, 'Invitation token is required'),
  }),
});

export const setPasswordValidator = z.object({
  body: z.object({
    token: z.string().min(1, 'Invitation token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});
