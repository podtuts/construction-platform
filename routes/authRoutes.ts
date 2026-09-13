import { Router } from 'express';
import { login, getMe, getUsers, updateUser, createUser, deleteUser } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.get('/users', authenticateToken, requireRole(['superuser', 'admin', 'user']), getUsers);
router.post('/users', authenticateToken, requireRole(['superuser', 'admin', 'user']), createUser);
router.put('/users/:id', authenticateToken, updateUser);
router.delete('/users/:id', authenticateToken, requireRole(['superuser', 'admin', 'user']), deleteUser);

export default router;
