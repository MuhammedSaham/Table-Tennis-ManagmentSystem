import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isPlayer } from '../middleware/role.middleware';
//import { isAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createTeam,
  getTeamById,
  getTournamentTeams,
  searchPartners,
  sendInvite,
  acceptInvite,
  declineInvite,
  cancelInvite,
  getMyInvites,
  getMySentInvites,
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

// ─── DOUBLES INVITE ROUTES (Player only) ─────────────────────────────────────
router.get('/invites/search', isPlayer, searchPartners);
router.get('/invites/my-invites', isPlayer, getMyInvites);
router.get('/invites/sent-invites', isPlayer, getMySentInvites);
router.post('/invites/send', isPlayer, sendInvite);
router.post('/invites/:inviteId/accept', isPlayer, acceptInvite);
router.post('/invites/:inviteId/decline', isPlayer, declineInvite);
router.delete('/invites/:inviteId/cancel', isPlayer, cancelInvite);

export default router;
