import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { isAdmin, isSuperAdmin, isSuperAdminForAdmins, hasPermission } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
    getMyProfile,
    updateMyProfile,
    getAllUsers,
    createUser,
    getUserById,
    updateUserRole,
    getPublicProfile,
    getPublicPlayers,
    deleteUser,
    togglePlayerFavorite,
    uploadProfileImage,
    recordProfileView,
    updatePlayerRanking,
    getUserPermissions,
    updateUserPermissions,
} from '../controllers/user.controller';
import { updateProfileSchema, createUserSchema } from '../validations/user.validation';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/public/players', getPublicPlayers);
router.get('/public/:id', optionalAuthenticate, getPublicProfile);

// All routes require authentication
router.use(authenticate);

router.post(
  '/upload-profile-image',
  upload.single('profileImage'),
  uploadProfileImage
);

// Profile routes (authenticated users)
router.get('/profile', getMyProfile);
router.patch('/profile', validate(updateProfileSchema), updateMyProfile);

// User management & permission routes
router.get('/', hasPermission('MANAGE_USERS'), getAllUsers);
router.post('/', isSuperAdmin, validate(createUserSchema), createUser);
router.get('/:id/permissions', isSuperAdmin, getUserPermissions);
router.put('/:id/permissions', isSuperAdmin, updateUserPermissions);
router.get('/:id', hasPermission('MANAGE_USERS'), getUserById);
router.patch('/:id/role', isSuperAdmin, updateUserRole);
router.delete('/:id', isSuperAdmin, deleteUser);
router.patch('/:id/ranking', hasPermission('MANAGE_RANKINGS', 'MANAGE_PLAYERS'), updatePlayerRanking);
router.post('/:userId/profile-view', recordProfileView);
router.post('/:id/favorite', togglePlayerFavorite);

export default router;