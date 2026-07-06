import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  downloadInvoicePDF,
} from '../controllers/invoiceController';

const router = Router();

router.use(protect);

router.get('/', getInvoices);
router.post('/', createInvoice);
router.get('/:id/pdf', downloadInvoicePDF);
router.get('/:id', getInvoiceById);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

export default router;
