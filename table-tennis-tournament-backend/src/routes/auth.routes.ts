import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import {
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from '../controllers/auth.controller';
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
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.patch('/admin-requests/:id/process', authenticate, isAdmin, isSuperAdmin, approveAdminRequest);
router.patch('/admin-requests/:id/process', authenticate, isAdmin, isSuperAdmin, rejectAdminRequest);

export default router;