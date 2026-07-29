import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import {
  createGroups,
  generateGroupMatches,
  recordGroupScore,
  getGroupStandings,
  generateKnockoutStage,
  assignRefereeToGroupMatch,
} from '../controllers/group.controller';
import { getGroupMatches } from '../controllers/group.controller';
import { updateGroupMembers } from '../controllers/group.controller';
import { isAdminOrReferee } from '../middleware/role.middleware';

const router = Router();

//router.use(authenticate);

// Admin only routes
router.post('/tournaments/:tournamentId/categories/:categoryId/groups', authenticate, isAdmin, createGroups);
router.post('/tournaments/:tournamentId/categories/:categoryId/group-matches', authenticate, isAdmin, generateGroupMatches);
router.post('/tournaments/:tournamentId/categories/:categoryId/knockout', authenticate, isAdmin, generateKnockoutStage);

// Match recording
router.patch('/group-matches/:matchId', authenticate, isAdminOrReferee, recordGroupScore);
router.post('/group-matches/:matchId/assign-referee', authenticate, isAdmin, assignRefereeToGroupMatch);

// View standings
router.get('/tournaments/:tournamentId/categories/:categoryId/standings', getGroupStandings);

router.get('/tournaments/:tournamentId/categories/:categoryId/matches', getGroupMatches);

router.put(
  '/tournaments/:tournamentId/categories/:categoryId/group-members',
  authenticate,
  isAdminOrReferee,
  updateGroupMembers
);

export default router;