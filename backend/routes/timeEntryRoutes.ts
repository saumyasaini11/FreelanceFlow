import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  createTimeEntry,
  getTimeEntries,
  getTimeEntryById,
  updateTimeEntry,
  deleteTimeEntry,
  getTimeSummary,
} from '../controllers/timeEntryController';

const router = Router();

router.use(protect);

router.get('/summary', getTimeSummary);
router.get('/', getTimeEntries);
router.post('/', createTimeEntry);
router.get('/:id', getTimeEntryById);
router.put('/:id', updateTimeEntry);
router.delete('/:id', deleteTimeEntry);

export default router;
