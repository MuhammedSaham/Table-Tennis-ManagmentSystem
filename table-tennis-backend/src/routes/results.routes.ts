import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { hasPermission } from '../middleware/role.middleware';
import {
  getTournamentStandings,
  getCategoryWinners,
  releaseResults,
  getTournamentStatistics,
  getPlayerRanking,
  getGlobalCategoryStandings,
} from '../controllers/results.controller';

const router = Router();

// Public routes
router.get('/tournaments/:tournamentId/standings', getTournamentStandings);
router.get('/tournaments/:tournamentId/winners', getCategoryWinners);
router.get('/tournaments/:tournamentId/statistics', getTournamentStatistics);
router.get('/tournaments/:tournamentId/ranking', getPlayerRanking);
router.get('/global/:categoryName', getGlobalCategoryStandings);

// Admin release results route
router.post('/tournaments/:tournamentId/release', authenticate, hasPermission('MANAGE_RESULTS'), releaseResults);

export default router;