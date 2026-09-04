import { z } from 'zod';

export const createMaintenanceTicketValidator = z.object({
  body: z.object({
    propertyId: z.string().min(1, 'Property ID is required'),
    roomId: z.string().optional(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    category: z.string().default('General'),
    reportedBy: z.string().default('Staff'),
    notes: z.string().optional(),
    takeOutOfOrder: z.boolean().optional(),
  }),
});

export const resolveMaintenanceTicketValidator = z.object({
  params: z.object({
    id: z.string().min(1, 'Ticket ID is required'),
  }),
  body: z.object({
    notes: z.string().optional(),
  }).optional(),
});
