import { Router } from 'express';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../controllers/scheduleController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getSchedules);
router.post('/', authenticateToken, createSchedule);
router.put('/:id', authenticateToken, updateSchedule);
router.delete('/:id', authenticateToken, requireRole(['superuser', 'admin', 'user']), deleteSchedule);

export default router;
