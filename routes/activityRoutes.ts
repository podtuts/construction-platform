import { Router } from 'express';
import { getActivities, createActivity } from '../controllers/activityController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getActivities);
router.post('/', authenticateToken, createActivity);

export default router;
