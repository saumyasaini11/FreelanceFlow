import { Response, NextFunction } from 'express';
import { Project } from '../models/Project';
import { Client } from '../models/Client';
import { createProjectSchema, updateProjectSchema } from '../validators/project';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = createProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: parseResult.error.issues[0]?.message || 'Invalid input' },
      });
    }

    const { clientId } = parseResult.data;

    const client = await Client.findOne({ _id: clientId, userId: req.user!._id });
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Referenced client not found or unauthorized.' },
      });
    }

    const project = new Project({
      ...parseResult.data,
      userId: req.user!._id,
    });

    await project.save();
    logger.info(`Project created: ${project._id} for client: ${clientId} by user: ${req.user!._id}`);

    res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const search = req.query.search ? String(req.query.search).trim() : '';
    const status = req.query.status ? String(req.query.status) : '';
    const clientId = req.query.clientId ? String(req.query.clientId) : '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = { userId };

    if (status) {
      query.status = status;
    }

    if (clientId) {
      query.clientId = clientId;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const [projects, total] = await Promise.all([
      Project.find(query).populate('clientId', 'name company').sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Project.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ _id: id, userId: req.user!._id }).populate('clientId', 'name company email');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found.' },
      });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const parseResult = updateProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: parseResult.error.issues[0]?.message || 'Invalid input' },
      });
    }

    const project = await Project.findOne({ _id: id, userId: req.user!._id });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found.' },
      });
    }

    if (parseResult.data.clientId && parseResult.data.clientId !== project.clientId.toString()) {
      const client = await Client.findOne({ _id: parseResult.data.clientId, userId: req.user!._id });
      if (!client) {
        return res.status(404).json({
          success: false,
          error: { message: 'Referenced client not found or unauthorized.' },
        });
      }
    }

    Object.assign(project, parseResult.data);
    await project.save();
    logger.info(`Project updated: ${project._id}`);

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ _id: id, userId: req.user!._id });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found.' },
      });
    }

    await Project.deleteOne({ _id: id });
    logger.info(`Project deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
