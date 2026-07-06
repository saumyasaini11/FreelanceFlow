import { Request, Response, NextFunction } from 'express';
import { TimeEntry } from '../models/TimeEntry';
import { Project } from '../models/Project';
import { createTimeEntrySchema, updateTimeEntrySchema } from '../validators/timeEntry';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

// POST /api/time-entries
export const createTimeEntry = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = createTimeEntrySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
      });
    }

    const { projectId, description, startTime, endTime, hourlyRate } = parseResult.data;

    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, userId: req.user!._id });
    if (!project) {
      return res.status(404).json({ success: false, error: { message: 'Project not found or access denied.' } });
    }

    const entry = new TimeEntry({
      userId: req.user!._id,
      projectId,
      description: description || '',
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      hourlyRate: hourlyRate ?? project.hourlyRate ?? 0,
    });

    await entry.save();
    logger.info(`Time entry created: ${entry._id} for project: ${projectId} by user: ${req.user!._id}`);

    res.status(201).json({ success: true, timeEntry: entry });
  } catch (error) {
    next(error);
  }
};

// GET /api/time-entries
export const getTimeEntries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const projectId = req.query.projectId as string;

    const filter: Record<string, unknown> = { userId: req.user!._id };
    if (projectId) filter.projectId = projectId;

    const [entries, total] = await Promise.all([
      TimeEntry.find(filter)
        .populate('projectId', 'name clientId')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit),
      TimeEntry.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      timeEntries: entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/time-entries/:id
export const getTimeEntryById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await TimeEntry.findOne({ _id: req.params.id, userId: req.user!._id })
      .populate('projectId', 'name clientId hourlyRate');

    if (!entry) {
      return res.status(404).json({ success: false, error: { message: 'Time entry not found.' } });
    }

    res.status(200).json({ success: true, timeEntry: entry });
  } catch (error) {
    next(error);
  }
};

// PUT /api/time-entries/:id
export const updateTimeEntry = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = updateTimeEntrySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
      });
    }

    const entry = await TimeEntry.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!entry) {
      return res.status(404).json({ success: false, error: { message: 'Time entry not found.' } });
    }

    const { description, startTime, endTime, hourlyRate, isBilled } = parseResult.data;
    if (description !== undefined) entry.description = description;
    if (startTime !== undefined) entry.startTime = new Date(startTime);
    if (endTime !== undefined) entry.endTime = new Date(endTime);
    if (hourlyRate !== undefined) entry.hourlyRate = hourlyRate;
    if (isBilled !== undefined) entry.isBilled = isBilled;

    await entry.save();
    logger.info(`Time entry updated: ${entry._id}`);

    res.status(200).json({ success: true, timeEntry: entry });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/time-entries/:id
export const deleteTimeEntry = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await TimeEntry.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!entry) {
      return res.status(404).json({ success: false, error: { message: 'Time entry not found.' } });
    }

    await TimeEntry.deleteOne({ _id: entry._id });
    logger.info(`Time entry deleted: ${entry._id}`);

    res.status(200).json({ success: true, message: 'Time entry deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/time-entries/summary
export const getTimeSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [weekEntries, monthEntries, totalEntries] = await Promise.all([
      TimeEntry.find({ userId: req.user!._id, startTime: { $gte: startOfWeek } }),
      TimeEntry.find({ userId: req.user!._id, startTime: { $gte: startOfMonth } }),
      TimeEntry.find({ userId: req.user!._id }),
    ]);

    const calcEarnings = (entries: typeof weekEntries) =>
      entries.reduce((sum, e) => sum + (e.duration / 60) * e.hourlyRate, 0);

    const calcHours = (entries: typeof weekEntries) =>
      entries.reduce((sum, e) => sum + e.duration, 0) / 60;

    res.status(200).json({
      success: true,
      summary: {
        thisWeek: { hours: Math.round(calcHours(weekEntries) * 10) / 10, earnings: Math.round(calcEarnings(weekEntries) * 100) / 100 },
        thisMonth: { hours: Math.round(calcHours(monthEntries) * 10) / 10, earnings: Math.round(calcEarnings(monthEntries) * 100) / 100 },
        allTime: { hours: Math.round(calcHours(totalEntries) * 10) / 10, earnings: Math.round(calcEarnings(totalEntries) * 100) / 100 },
      },
    });
  } catch (error) {
    next(error);
  }
};
