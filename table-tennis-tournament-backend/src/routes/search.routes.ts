import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { searchTournaments, searchPlayers, searchMatches } from '../controllers/search.controller';

const router = Router();

router.use(authenticate);

router.get('/tournaments', searchTournaments);
router.get('/players', searchPlayers);
router.get('/matches', searchMatches);

export default router;