import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateProposal, suggestRate, scoreProjectHealth, ProposalInput, RateAdvisorInput } from '../services/aiService';
import { Project } from '../models/Project';
import { TimeEntry } from '../models/TimeEntry';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { logger } from '../utils/logger';

// POST /api/ai/proposal
export const aiGenerateProposal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectName, clientType, scope, budget, deadline, skills } = req.body as ProposalInput;
    if (!projectName || !scope || !budget || !deadline) {
      return res.status(400).json({ success: false, error: { message: 'projectName, scope, budget, and deadline are required.' } });
    }

    logger.info(`Proposal generation requested by user: ${req.user!._id}`);
    const proposal = await generateProposal({ projectName, clientType: clientType || 'Business', scope, budget: Number(budget), deadline, skills });

    res.status(200).json({ success: true, proposal });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/rate-advisor
export const aiSuggestRate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skills, experienceYears, projectType, location } = req.body as RateAdvisorInput;
    if (!skills?.length || !projectType || !location) {
      return res.status(400).json({ success: false, error: { message: 'skills, projectType, and location are required.' } });
    }

    logger.info(`Rate advice requested by user: ${req.user!._id}`);
    const advice = await suggestRate({ skills, experienceYears: Number(experienceYears) || 1, projectType, location });

    res.status(200).json({ success: true, advice });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/project-health
export const aiProjectHealth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.body as { projectId: string };
    if (!projectId) {
      return res.status(400).json({ success: false, error: { message: 'projectId is required.' } });
    }

    const project = await Project.findOne({ _id: projectId, userId: req.user!._id });
    if (!project) {
      return res.status(404).json({ success: false, error: { message: 'Project not found or access denied.' } });
    }

    // Gather supporting data
    const [timeEntries, billedInvoices] = await Promise.all([
      TimeEntry.find({ projectId, userId: req.user!._id }),
      Invoice.find({
        userId: req.user!._id,
        status: { $in: [InvoiceStatus.PAID, InvoiceStatus.SENT] },
      }),
    ]);

    const totalLoggedHours = timeEntries.reduce((sum, e) => sum + e.duration / 60, 0);
    const totalBilledAmount = billedInvoices.reduce((sum, i) => sum + i.total, 0);
    const deliverablesDone = project.deliverables.filter(d => d.startsWith('[DONE]')).length;

    logger.info(`Project health scored for project: ${projectId}`);
    const health = await scoreProjectHealth({
      projectName: project.name,
      status: project.status,
      progress: project.progress,
      budget: project.budget,
      hourlyRate: project.hourlyRate,
      deadline: project.deadline.toISOString(),
      totalLoggedHours: Math.round(totalLoggedHours * 10) / 10,
      totalBilledAmount,
      deliverablesDone,
      deliverablesTotal: project.deliverables.length,
    });

    res.status(200).json({ success: true, health, project: { name: project.name, status: project.status, progress: project.progress } });
  } catch (error) {
    next(error);
  }
};
