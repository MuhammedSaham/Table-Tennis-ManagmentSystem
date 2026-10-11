import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { hasPermission } from '../middleware/role.middleware';
import { generateBracket, getBracket } from '../controllers/bracket.controller';

const router = Router();

router.use(authenticate);

router.post('/tournaments/:tournamentId/categories/:categoryId/generate', hasPermission('MANAGE_MATCHES'), generateBracket);
router.get('/tournaments/:tournamentId/categories/:categoryId/bracket', getBracket);

export default router;