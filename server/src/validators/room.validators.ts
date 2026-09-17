import { z } from 'zod';

export const updateRoomStatusValidator = z.object({
  params: z.object({
    id: z.string().min(1, 'Room ID is required'),
  }),
  body: z.object({
    status: z.enum(['clean', 'dirty', 'inspected', 'out_of_order']),
    quirks: z.string().optional(),
  }),
});

export const checkInValidator = z.object({
  params: z.object({
    id: z.string().min(1, 'Reservation ID is required'),
  }),
  body: z.object({
    assignedRoomId: z.string().optional(),
    idDocumentType: z.string().optional(),
    idDocumentNumber: z.string().optional(),
    estimatedArrival: z.string().optional(),
    vehiclePlate: z.string().optional(),
    termsAccepted: z.boolean().optional(),
  }),
});

export const checkOutValidator = z.object({
  params: z.object({
    id: z.string().min(1, 'Reservation ID is required'),
  }),
});
