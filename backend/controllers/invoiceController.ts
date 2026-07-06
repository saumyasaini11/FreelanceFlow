import { Response, NextFunction } from 'express';
import { Invoice, InvoiceStatus, IInvoice } from '../models/Invoice';
import { Client } from '../models/Client';
import { createInvoiceSchema, updateInvoiceSchema } from '../validators/invoice';
import { AuthRequest } from '../middleware/auth';
import { generateInvoicePDF } from '../services/pdfService';
import { sendInvoiceCreatedEmail } from '../services/mailService';
import { logger } from '../utils/logger';

// Generate unique invoice number: INV-YYYYMM-NNN
const generateInvoiceNumber = async (userId: string): Promise<string> => {
  const now = new Date();
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const count = await Invoice.countDocuments({ userId, invoiceNumber: new RegExp(`^${prefix}`) });
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
};

// POST /api/invoices
export const createInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = createInvoiceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
      });
    }

    const { clientId, lineItems, taxRate, dueDate, notes } = parseResult.data;

    // Verify client belongs to user
    const client = await Client.findOne({ _id: clientId, userId: req.user!._id });
    if (!client) {
      return res.status(404).json({ success: false, error: { message: 'Client not found or access denied.' } });
    }

    const invoiceNumber = await generateInvoiceNumber(String(req.user!._id));

    const invoice = new Invoice({
      userId: req.user!._id,
      clientId,
      invoiceNumber,
      lineItems,
      taxRate: taxRate ?? 0,
      dueDate: new Date(dueDate),
      notes: notes || '',
    });

    await invoice.save();
    logger.info(`Invoice created: ${invoice.invoiceNumber} for client: ${clientId}`);

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices
export const getInvoices = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const clientId = req.query.clientId as string;

    const filter: Record<string, unknown> = { userId: req.user!._id };
    if (status) filter.status = status;
    if (clientId) filter.clientId = clientId;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('clientId', 'name company email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices/:id
export const getInvoiceById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user!._id })
      .populate('clientId', 'name company email address');

    if (!invoice) {
      return res.status(404).json({ success: false, error: { message: 'Invoice not found.' } });
    }

    res.status(200).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

// PUT /api/invoices/:id
export const updateInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = updateInvoiceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
      });
    }

    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!invoice) {
      return res.status(404).json({ success: false, error: { message: 'Invoice not found.' } });
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return res.status(400).json({ success: false, error: { message: 'Paid invoices cannot be modified.' } });
    }

    const oldStatus = invoice.status;
    const { lineItems, taxRate, dueDate, notes, status } = parseResult.data;
    if (lineItems !== undefined) invoice.lineItems = lineItems;
    if (taxRate !== undefined) invoice.taxRate = taxRate;
    if (dueDate !== undefined) invoice.dueDate = new Date(dueDate);
    if (notes !== undefined) invoice.notes = notes;
    if (status !== undefined) {
      invoice.status = status as InvoiceStatus;
      if (status === InvoiceStatus.PAID) invoice.paidAt = new Date();
    }

    await invoice.save();

    // Trigger email if status changed to SENT
    if (oldStatus !== InvoiceStatus.SENT && invoice.status === InvoiceStatus.SENT) {
      const client = await Client.findById(invoice.clientId);
      if (client) {
        await sendInvoiceCreatedEmail(
          client.email,
          client.company || client.name,
          invoice.invoiceNumber,
          invoice.total,
          invoice.dueDate.toISOString()
        );
      }
    }

    logger.info(`Invoice updated: ${invoice.invoiceNumber}`);

    res.status(200).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/invoices/:id
export const deleteInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!invoice) {
      return res.status(404).json({ success: false, error: { message: 'Invoice not found.' } });
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return res.status(400).json({ success: false, error: { message: 'Paid invoices cannot be deleted.' } });
    }

    await Invoice.deleteOne({ _id: invoice._id });
    logger.info(`Invoice deleted: ${invoice.invoiceNumber}`);

    res.status(200).json({ success: true, message: 'Invoice deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices/:id/pdf  — stream PDF to browser
export const downloadInvoicePDF = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user!._id })
      .populate<{ clientId: { name: string; company: string; email: string } }>('clientId', 'name company email');

    if (!invoice) {
      return res.status(404).json({ success: false, error: { message: 'Invoice not found.' } });
    }

    const buffer = await generateInvoicePDF(invoice as unknown as IInvoice & { clientId: { name: string; company: string; email: string } });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

    logger.info(`PDF generated: ${invoice.invoiceNumber}`);
  } catch (error) {
    next(error);
  }
};
