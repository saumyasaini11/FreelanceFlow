import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  company: z.string().min(1, 'Company name is required').max(100),
  email: z.string().email('Invalid email address').max(100),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(250).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const updateClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  company: z.string().min(1, 'Company name is required').max(100).optional(),
  email: z.string().email('Invalid email address').max(100).optional(),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(250).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});
