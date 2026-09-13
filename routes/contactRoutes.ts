import { Router } from 'express';
import { getContacts, createContact, updateContact, deleteContact } from '../controllers/contactController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getContacts);
// Contact records may only be edited by superuser accounts
router.post('/', authenticateToken, requireRole(['superuser']), createContact);
router.put('/:id', authenticateToken, requireRole(['superuser']), updateContact);
router.delete('/:id', authenticateToken, requireRole(['superuser']), deleteContact);

export default router;
