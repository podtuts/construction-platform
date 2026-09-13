import { Router } from 'express';
import { getContractors, createContractor, updateContractor, deleteContractor } from '../controllers/contractorController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getContractors);
// Contractor records may only be edited by superuser accounts
router.post('/', authenticateToken, requireRole(['superuser']), createContractor);
router.put('/:id', authenticateToken, requireRole(['superuser']), updateContractor);
router.delete('/:id', authenticateToken, requireRole(['superuser']), deleteContractor);

export default router;
