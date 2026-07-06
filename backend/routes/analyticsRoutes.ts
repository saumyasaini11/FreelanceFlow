import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getAnalyticsOverview } from '../controllers/analyticsController';

const router = Router();
router.use(protect);
router.get('/overview', getAnalyticsOverview);

export default router;
