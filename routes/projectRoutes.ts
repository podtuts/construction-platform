import { Router } from 'express';
import { 
  getProjects, 
  getProjectById, 
  getUnits, 
  createUnit, 
  updateUnit, 
  deleteUnit,
  createProject,
  updateProject,
  deleteProject 
} from '../controllers/projectController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/projects', getProjects);
router.get('/projects/:id', getProjectById);
router.post('/projects', authenticateToken, requireRole(['superuser']), createProject);
router.put('/projects/:id', authenticateToken, requireRole(['superuser']), updateProject);
router.delete('/projects/:id', authenticateToken, requireRole(['superuser']), deleteProject);
router.get('/units', getUnits);
router.post('/units', authenticateToken, requireRole(['superuser', 'admin', 'user']), createUnit);
router.put('/units/:id', authenticateToken, updateUnit);
router.delete('/units/:id', authenticateToken, requireRole(['superuser', 'admin', 'user']), deleteUnit);

export default router;
