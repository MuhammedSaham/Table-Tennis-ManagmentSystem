import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin, isReferee } from '../middleware/role.middleware';
import { getAdminDashboard, getPlayerDashboard, getRefereeDashboard } from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticate);

router.get('/admin', isAdmin, getAdminDashboard);
router.get('/player', getPlayerDashboard);
router.get('/referee', isReferee, getRefereeDashboard);

export default router;