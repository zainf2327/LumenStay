import { z } from 'zod';

export const createBookingValidator = z.object({
  body: z.object({
    propertyId: z.string().min(1, 'Property ID is required'),
    roomTypeId: z.string().optional(),
    ratePlanId: z.string().optional(),
    checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in must be YYYY-MM-DD'),
    checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out must be YYYY-MM-DD'),
    adultCount: z.number().int().min(1).default(2),
    childCount: z.number().int().min(0).default(0),
    guest: z.object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      email: z.string().email('Valid email is required'),
      phone: z.string().min(6, 'Valid phone is required'),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    }),
    specialRequests: z.string().optional(),
    estimatedArrival: z.string().optional(),
    paymentDetails: z.object({
      paymentMethodId: z.string().optional(),
      paymentIntentId: z.string().optional(),
    }).optional(),
  }),
});

export const getBookingValidator = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking identifier is required'),
  }),
});

export const cancelBookingValidator = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking identifier is required'),
  }),
});
