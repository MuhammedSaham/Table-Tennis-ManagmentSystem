import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import {
  createGroups,
  generateGroupMatches,
  recordGroupScore,
  getGroupStandings,
  generateKnockoutStage,
} from '../controllers/group.controller';
import { getGroupMatches } from '../controllers/group.controller';
import { updateGroupMembers } from '../controllers/group.controller';
import { isAdminOrReferee } from '../middleware/role.middleware';

const router = Router();

//router.use(authenticate);

// Admin only routes
router.post('/tournaments/:tournamentId/categories/:categoryId/groups', isAdmin, createGroups);
router.post('/tournaments/:tournamentId/categories/:categoryId/group-matches', isAdmin, generateGroupMatches);
router.post('/tournaments/:tournamentId/categories/:categoryId/knockout', isAdmin, generateKnockoutStage);

// Match recording
router.patch('/group-matches/:matchId', isAdmin, recordGroupScore);

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