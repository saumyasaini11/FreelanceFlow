import { Router } from 'express';
import { protect } from '../middleware/auth';
import { updateProfile, changePassword, deleteAccount } from '../controllers/settingsController';

const router = Router();
router.use(protect);

router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.delete('/account', deleteAccount);

export default router;
