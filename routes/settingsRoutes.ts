import { Router } from 'express';
import { getSettings, updateSettings, getDashboardSummary, globalSearch } from '../controllers/settingsController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/settings', getSettings);
router.put('/settings', authenticateToken, requireRole(['superuser']), updateSettings);
router.get('/dashboard/summary', getDashboardSummary);
router.get('/search', globalSearch);

export default router;
