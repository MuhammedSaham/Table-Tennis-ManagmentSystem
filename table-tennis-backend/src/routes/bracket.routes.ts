import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { generateBracket, getBracket } from '../controllers/bracket.controller';

const router = Router();

router.use(authenticate);

router.post('/tournaments/:tournamentId/categories/:categoryId/generate', isAdmin, generateBracket);
router.get('/tournaments/:tournamentId/categories/:categoryId/bracket', getBracket);

export default router;