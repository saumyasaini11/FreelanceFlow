import { Invoice, InvoiceStatus } from '../models/Invoice';
import { Client } from '../models/Client';
import { sendInvoiceOverdueEmail } from './mailService';
import { logger } from '../utils/logger';

/**
 * Checks for overdue invoices, marks them as Overdue, and sends email notifications.
 */
export const checkOverdueInvoices = async () => {
  logger.info('Running cron: checkOverdueInvoices');
  try {
    const now = new Date();
    // Find invoices that are SENT and past their due date
    const overdueInvoices = await Invoice.find({
      status: InvoiceStatus.SENT,
      dueDate: { $lt: now },
    }).populate('clientId');

    if (overdueInvoices.length === 0) {
      logger.info('No new overdue invoices found.');
      return;
    }

    for (const invoice of overdueInvoices) {
      const client = invoice.clientId as unknown as { _id: string; name: string; company: string; email: string };
      
      invoice.status = InvoiceStatus.OVERDUE;
      await invoice.save();

      const daysOverdue = Math.floor((now.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 3600 * 24));
      
      // Send email
      await sendInvoiceOverdueEmail(
        client.email,
        client.company || client.name,
        invoice.invoiceNumber,
        invoice.total,
        daysOverdue
      );
      
      logger.info(`Marked invoice ${invoice.invoiceNumber} as OVERDUE (${daysOverdue} days late).`);
    }

    logger.info(`Processed ${overdueInvoices.length} overdue invoices.`);
  } catch (error) {
    logger.error(`Error in checkOverdueInvoices cron: ${(error as Error).message}`);
  }
};

/**
 * Starts background cron jobs.
 */
export const startCronJobs = () => {
  logger.info('Starting background cron jobs...');
  
  // Run immediately on boot, then every 24 hours
  checkOverdueInvoices();
  
  const HOURS_24 = 24 * 60 * 60 * 1000;
  setInterval(checkOverdueInvoices, HOURS_24);
};
