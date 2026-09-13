import { Router } from 'express';
import { getDrawings, createDrawing, updateDrawing, deleteDrawing } from '../controllers/drawingController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getDrawings);
router.post('/', authenticateToken, requireRole(['superuser', 'admin', 'user']), createDrawing);
router.put('/:id', authenticateToken, updateDrawing);
router.delete('/:id', authenticateToken, requireRole(['superuser', 'admin', 'user']), deleteDrawing);

export default router;
