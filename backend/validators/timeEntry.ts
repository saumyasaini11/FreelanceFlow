import { z } from 'zod';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid project ID');

export const createTimeEntrySchema = z.object({
  projectId: mongoIdSchema,
  description: z.string().max(500).optional(),
  startTime: z.string().datetime({ message: 'startTime must be a valid ISO datetime' }),
  endTime: z.string().datetime({ message: 'endTime must be a valid ISO datetime' }).optional(),
  hourlyRate: z.number().min(0).optional(),
});

export const updateTimeEntrySchema = z.object({
  description: z.string().max(500).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  hourlyRate: z.number().min(0).optional(),
  isBilled: z.boolean().optional(),
});

export const stopTimerSchema = z.object({
  endTime: z.string().datetime({ message: 'endTime must be a valid ISO datetime' }),
});
