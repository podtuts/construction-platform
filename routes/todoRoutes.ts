import { Router } from 'express';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../controllers/todoController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getTodos);
router.post('/', authenticateToken, createTodo);
router.put('/:id', authenticateToken, updateTodo);
router.delete('/:id', authenticateToken, requireRole(['superuser', 'admin', 'user']), deleteTodo);

export default router;
