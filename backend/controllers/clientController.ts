import { Response, NextFunction } from 'express';
import { Client } from '../models/Client';
import { Project } from '../models/Project';
import { createClientSchema, updateClientSchema } from '../validators/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export const createClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = createClientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: parseResult.error.issues[0]?.message || 'Invalid input' },
      });
    }

    const { email } = parseResult.data;

    const existingClient = await Client.findOne({ userId: req.user!._id, email });
    if (existingClient) {
      return res.status(409).json({
        success: false,
        error: { message: 'A client with this email already exists.' },
      });
    }

    const client = new Client({
      ...parseResult.data,
      userId: req.user!._id,
    });

    await client.save();
    logger.info(`Client created: ${client._id} by user: ${req.user!._id}`);

    res.status(201).json({
      success: true,
      client,
    });
  } catch (error) {
    next(error);
  }
};

export const getClients = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const search = req.query.search ? String(req.query.search).trim() : '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = { userId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [clients, total] = await Promise.all([
      Client.find(query).sort({ name: 1 }).skip(skip).limit(limit),
      Client.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      clients,
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

export const getClientById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const client = await Client.findOne({ _id: id, userId: req.user!._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client not found.' },
      });
    }

    res.status(200).json({
      success: true,
      client,
    });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const parseResult = updateClientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: parseResult.error.issues[0]?.message || 'Invalid input' },
      });
    }

    const client = await Client.findOne({ _id: id, userId: req.user!._id });
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client not found.' },
      });
    }

    if (parseResult.data.email && parseResult.data.email !== client.email) {
      const existingClient = await Client.findOne({ userId: req.user!._id, email: parseResult.data.email });
      if (existingClient) {
        return res.status(409).json({
          success: false,
          error: { message: 'A client with this email already exists.' },
        });
      }
    }

    Object.assign(client, parseResult.data);
    await client.save();
    logger.info(`Client updated: ${client._id}`);

    res.status(200).json({
      success: true,
      client,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const client = await Client.findOne({ _id: id, userId: req.user!._id });
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client not found.' },
      });
    }

    const activeProjects = await Project.countDocuments({ clientId: id, userId: req.user!._id });
    if (activeProjects > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot delete client. This client has active projects associated with them.' },
      });
    }

    await Client.deleteOne({ _id: id });
    logger.info(`Client deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
