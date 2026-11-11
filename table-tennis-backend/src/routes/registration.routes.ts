import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isPlayer, restrictTo, hasPermission } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  registerForTournament,
  getMyRegistrations,
  getTournamentRegistrations,
  processRegistration,
  cancelRegistration,
  removeRegistrationByAdmin,
} from '../controllers/registration.controller';
import {
  registerTournamentSchema,
  processRegistrationSchema,
} from '../validations/registration.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Player only routes
router.post('/', isPlayer, validate(registerTournamentSchema), registerForTournament);
router.get('/my-registrations', isPlayer, getMyRegistrations);
router.delete('/:registrationId/cancel', isPlayer, cancelRegistration);

// Admin/Referee routes
router.get('/tournaments/:tournamentId', restrictTo('ADMIN', 'SUPER_ADMIN', 'REFEREE'), getTournamentRegistrations);
router.patch('/:registrationId/process', hasPermission('MANAGE_REGISTRATIONS'), validate(processRegistrationSchema), processRegistration);

router.delete(
  '/:registrationId/admin-remove',
  restrictTo('ADMIN', 'SUPER_ADMIN'),
  hasPermission('MANAGE_REGISTRATIONS'),
  removeRegistrationByAdmin
);

export default router;