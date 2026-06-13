import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
//import { isAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createTeam,
  getTeamById,
  getTournamentTeams,
} from '../controllers/team.controller';
import { createTeamSchema } from '../validations/team.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Public routes (authenticated)
router.get('/:id', getTeamById);
router.get('/tournaments/:tournamentId', getTournamentTeams);

// Admin only
router.post('/', validate(createTeamSchema), createTeam);

export default router;