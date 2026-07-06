import { z } from 'zod';
import { ProjectStatus } from '../models/Project';

const dateSchema = z.preprocess((arg) => {
  if (typeof arg === 'string' || arg instanceof Date) {
    const d = new Date(arg);
    if (!isNaN(d.getTime())) return d;
  }
  return arg;
}, z.date({ message: 'Invalid date format' }));

export const createProjectSchema = z.object({
  clientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Client ID format'),
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(1000).optional().or(z.literal('')),
  budget: z.number().min(0, 'Budget must be 0 or greater'),
  hourlyRate: z.number().min(0, 'Hourly rate must be 0 or greater'),
  deadline: dateSchema,
  status: z.nativeEnum(ProjectStatus).optional(),
  progress: z.number().min(0).max(100).optional(),
  deliverables: z.array(z.string()).optional(),
});

export const updateProjectSchema = z.object({
  clientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Client ID format').optional(),
  name: z.string().min(1, 'Project name is required').max(100).optional(),
  description: z.string().max(1000).optional().or(z.literal('')),
  budget: z.number().min(0, 'Budget must be 0 or greater').optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be 0 or greater').optional(),
  deadline: dateSchema.optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  progress: z.number().min(0).max(100).optional(),
  deliverables: z.array(z.string()).optional(),
});
