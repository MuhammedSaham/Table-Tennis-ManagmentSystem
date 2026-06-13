import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import {
  getTournamentStandings,
  getCategoryWinners,
  releaseResults,
  getTournamentStatistics,
  getPlayerRanking,
} from '../controllers/results.controller';
import { getGlobalCategoryStandings } from '../controllers/results.controller';

const router = Router();

// Public routes (authenticated users can view)
router.get('/tournaments/:tournamentId/standings', getTournamentStandings);
router.get('/tournaments/:tournamentId/winners', getCategoryWinners);
router.get('/tournaments/:tournamentId/statistics', getTournamentStatistics);
router.get('/tournaments/:tournamentId/ranking', getPlayerRanking);
router.get('/global/:categoryName', getGlobalCategoryStandings);

// Admin only routes
router.post('/tournaments/:tournamentId/release', authenticate, isAdmin, releaseResults);

export default router;