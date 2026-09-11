import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin, isReferee,isAdminOrReferee, restrictTo } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createMatch,
  getTournamentMatches,
  getMyMatches,
  getRefereeMatches,
  getMatchById,
  updateMatchStatus,
  assignReferee,
  recordGameScores,
  getMatchResults,
  getMyMatchHistory,
  getPlayerPerformanceStats,
  swapPlayers,
} from '../controllers/match.controller';
import {
  createMatchSchema,
  updateMatchStatusSchema,
  assignRefereeSchema,
} from '../validations/match.validation';
import { getPlayerPerformanceStatsById } from '../controllers/match.controller';
import { updateMatch } from '../controllers/match.controller';
import { deleteKnockoutMatches } from '../controllers/match.controller';
import { updateMatchAndAdvance } from '../controllers/match.controller';






const router = Router();

// All routes require authentication
//router.use(authenticate);

// Player routes
router.get('/my-matches', authenticate, getMyMatches);

// Referee routes
router.get('/my-assigned-matches', authenticate, isAdminOrReferee, getRefereeMatches);

// Tournament matches (Admin, Referee, Players can view)
router.get('/tournaments/:tournamentId', getTournamentMatches);

// Match by ID
router.get('/:matchId', getMatchById);

// Admin only routes
router.post('/', authenticate, isAdmin, validate(createMatchSchema), createMatch);
router.patch('/:matchId/status', authenticate, restrictTo('ADMIN', 'REFEREE'), validate(updateMatchStatusSchema), updateMatchStatus);
router.post('/:matchId/assign-referee', authenticate, isAdmin, validate(assignRefereeSchema), assignReferee);
router.post('/swap-players', authenticate, isAdminOrReferee, swapPlayers);
// Add these to the existing routes

// Match results and scoring
router.get('/:matchId/results', getMatchResults);
router.post('/:matchId/scores', authenticate, restrictTo('ADMIN', 'REFEREE'), recordGameScores);
router.get('/my-match-history', authenticate, getMyMatchHistory);

router.get('/my-performance', authenticate, getPlayerPerformanceStats);

router.get('/player-performance/:userId', getPlayerPerformanceStatsById);

router.patch('/:matchId', authenticate, restrictTo('ADMIN', 'REFEREE'), updateMatch);

router.delete('/tournaments/:tournamentId/categories/:categoryId/knockout', 
  authenticate, 
  isAdmin, 
  deleteKnockoutMatches
);

router.post('/:matchId/complete', authenticate, restrictTo('ADMIN', 'REFEREE'), updateMatchAndAdvance);




export default router;