import { Router } from 'express';
import { getDocuments, createDocument, updateDocument, deleteDocument } from '../controllers/documentController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getDocuments);
router.post('/', authenticateToken, requireRole(['superuser', 'admin', 'user']), createDocument);
router.put('/:id', authenticateToken, updateDocument);
router.delete('/:id', authenticateToken, requireRole(['superuser', 'admin', 'user']), deleteDocument);

export default router;
