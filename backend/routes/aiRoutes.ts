import { Router } from 'express';
import { protect } from '../middleware/auth';
import { aiGenerateProposal, aiSuggestRate, aiProjectHealth } from '../controllers/aiController';

const router = Router();
router.use(protect);
router.post('/proposal', aiGenerateProposal);
router.post('/rate-advisor', aiSuggestRate);
router.post('/project-health', aiProjectHealth);

export default router;
