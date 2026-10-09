import { Router } from 'express';
import {
  forgotPassword,
  login,
  register,
  resetPassword,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/auth.validation';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin,isSuperAdmin } from '../middleware/role.middleware';
import { getPendingAdminRequests,approveAdminRequest,rejectAdminRequest, } from '../controllers/adminRequest.controller';

const router = Router();

// Public routes (no authentication required)
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.patch('/admin-requests/:id/process', authenticate, isAdmin, isSuperAdmin, approveAdminRequest);
router.patch('/admin-requests/:id/process', authenticate, isAdmin, isSuperAdmin, rejectAdminRequest);

export default router;