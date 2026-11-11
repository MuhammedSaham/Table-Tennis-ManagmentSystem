import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin, isAdminOrReferee, hasPermission } from '../middleware/role.middleware';
import {
  createGroups,
  generateGroupMatches,
  recordGroupScore,
  getGroupStandings,
  generateKnockoutStage,
  assignRefereeToGroupMatch,
  getGroupMatches,
  updateGroupMembers,
} from '../controllers/group.controller';

const router = Router();

// Admin match management routes
router.post('/tournaments/:tournamentId/categories/:categoryId/groups', authenticate, hasPermission('MANAGE_MATCHES'), createGroups);
router.post('/tournaments/:tournamentId/categories/:categoryId/group-matches', authenticate, hasPermission('MANAGE_MATCHES'), generateGroupMatches);
router.post('/tournaments/:tournamentId/categories/:categoryId/knockout', authenticate, hasPermission('MANAGE_MATCHES'), generateKnockoutStage);

// Match recording & referee assignment
router.patch('/group-matches/:matchId', authenticate, isAdminOrReferee, recordGroupScore);
router.post('/group-matches/:matchId/assign-referee', authenticate, hasPermission('MANAGE_MATCHES', 'MANAGE_REFEREES'), assignRefereeToGroupMatch);

// View standings & matches
router.get('/tournaments/:tournamentId/categories/:categoryId/standings', getGroupStandings);
router.get('/tournaments/:tournamentId/categories/:categoryId/matches', getGroupMatches);

router.put(
  '/tournaments/:tournamentId/categories/:categoryId/group-members',
  authenticate,
  hasPermission('MANAGE_MATCHES'),
  updateGroupMembers
);

export default router;