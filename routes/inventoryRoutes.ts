import { Router } from 'express';
import { getInventory, createInventory, updateInventory, deleteInventory } from '../controllers/inventoryController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getInventory);
router.post('/', authenticateToken, requireRole(['superuser', 'admin', 'user']), createInventory);
router.put('/:id', authenticateToken, updateInventory);
router.delete('/:id', authenticateToken, requireRole(['superuser', 'admin', 'user']), deleteInventory);

export default router;
