import { z } from 'zod';

export const getFolioValidator = z.object({
  params: z.object({
    reservationId: z.string().min(1, 'Reservation ID is required'),
  }),
});

export const addChargeValidator = z.object({
  params: z.object({
    reservationId: z.string().min(1, 'Reservation ID is required'),
  }),
  body: z.object({
    category: z.string().min(1, 'Category is required'),
    description: z.string().min(1, 'Description is required'),
    amount: z.coerce.number().positive('Amount must be positive'),
    postedBy: z.string().optional(),
  }),
});

export const settlePaymentValidator = z.object({
  params: z.object({
    reservationId: z.string().min(1, 'Reservation ID is required'),
  }),
  body: z.object({
    amount: z.coerce.number().positive('Payment amount must be positive'),
    paymentMethod: z.string().optional(),
    token: z.string().optional(),
  }),
});
