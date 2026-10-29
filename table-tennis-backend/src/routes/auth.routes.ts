import { Router } from 'express';
import {
  forgotPassword,
  login,
  register,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  changePasswordSchema,
} from '../validations/auth.validation';
import { authenticate } from '../middleware/auth.middleware';


const router = Router();

// Public routes (no authentication required)
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/verify-email', verifyEmail);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), resendVerification);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

export default router;