import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { hasPermission } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
  addCategory,
  getTournamentCategories,
  updateCategory,
  deleteCategory,
} from '../controllers/tournament.controller';
import {
  createTournamentSchema,
  updateTournamentSchema,
  addCategorySchema,
} from '../validations/tournament.validation';

const router = Router();

// Public routes
router.get('/', getAllTournaments);
router.get('/:id', getTournamentById);
router.get('/:tournamentId/categories', getTournamentCategories);

// Protected admin management routes
router.post('/', authenticate, hasPermission('MANAGE_TOURNAMENTS'), validate(createTournamentSchema), createTournament);
router.patch('/:id', authenticate, hasPermission('MANAGE_TOURNAMENTS'), validate(updateTournamentSchema), updateTournament);
router.delete('/:id', authenticate, hasPermission('MANAGE_TOURNAMENTS'), deleteTournament);
router.post('/:tournamentId/categories', authenticate, hasPermission('MANAGE_TOURNAMENTS'), validate(addCategorySchema), addCategory);
router.patch('/categories/:categoryId', authenticate, hasPermission('MANAGE_TOURNAMENTS'), updateCategory);
router.delete('/categories/:categoryId', authenticate, hasPermission('MANAGE_TOURNAMENTS'), deleteCategory);

export default router;