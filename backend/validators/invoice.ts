import { z } from 'zod';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID');

const lineItemSchema = z.object({
  description: z.string().min(1, 'Line item description is required'),
  quantity: z.number().min(0, 'Quantity must be 0 or greater'),
  rate: z.number().min(0, 'Rate must be 0 or greater'),
  amount: z.number().min(0, 'Amount must be 0 or greater'),
});

export const createInvoiceSchema = z.object({
  clientId: mongoIdSchema,
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  taxRate: z.number().min(0).max(100).optional(),
  dueDate: z.string().datetime({ message: 'dueDate must be a valid ISO datetime' }),
  notes: z.string().max(1000).optional(),
});

export const updateInvoiceSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Overdue']).optional(),
});
