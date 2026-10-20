import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin, isReferee, isAdminOrReferee, restrictTo, hasPermission } from '../middleware/role.middleware';
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
import { correctCompletedMatch } from '../controllers/match.controller';







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

// Admin / Referee routes
router.post('/', authenticate, hasPermission('MANAGE_MATCHES'), validate(createMatchSchema), createMatch);
router.patch('/:matchId/status', authenticate, isAdminOrReferee, validate(updateMatchStatusSchema), updateMatchStatus);
router.post('/:matchId/assign-referee', authenticate, hasPermission('MANAGE_MATCHES', 'MANAGE_REFEREES'), validate(assignRefereeSchema), assignReferee);
router.post('/swap-players', authenticate, isAdminOrReferee, swapPlayers);

// Match results and scoring
router.get('/:matchId/results', getMatchResults);
router.post('/:matchId/scores', authenticate, isAdminOrReferee, recordGameScores);
router.get('/my-match-history', authenticate, getMyMatchHistory);

router.get('/my-performance', authenticate, getPlayerPerformanceStats);

router.get('/player-performance/:userId', getPlayerPerformanceStatsById);

router.patch('/:matchId', authenticate, isAdminOrReferee, updateMatch);

router.delete('/tournaments/:tournamentId/categories/:categoryId/knockout', 
  authenticate, 
  hasPermission('MANAGE_MATCHES'), 
  deleteKnockoutMatches
);

router.post('/:matchId/complete', authenticate, isAdminOrReferee, updateMatchAndAdvance);

// Admin-only correction of completed knockout match scores
router.patch(
  '/:matchId/correct-score',
  authenticate,
  hasPermission('MANAGE_MATCHES'),
  correctCompletedMatch
);


export default router;