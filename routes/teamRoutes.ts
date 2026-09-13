import { Router } from 'express';
import { getTeam, createTeamMember, updateTeamMember, deleteTeamMember } from '../controllers/teamController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getTeam);
router.post('/', authenticateToken, requireRole(['superuser', 'admin', 'user']), createTeamMember);
router.put('/:id', authenticateToken, updateTeamMember);
router.delete('/:id', authenticateToken, requireRole(['superuser', 'admin', 'user']), deleteTeamMember);

export default router;
