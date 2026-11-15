import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';

const authService = new AuthService();

// Register new user
export const register = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    sendResponse(
        res,
        201,
        result.message,
        { user: result.user }
    );
});

// Login user
export const login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);

    sendResponse(res, 200, 'Login successful', {
        user,
        token,
    });
});

// Forgot password
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  sendResponse(res, 200, result.message);
});

// Reset password
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password);
  sendResponse(res, 200, result.message);
});

// Verify email
export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const token = (req.query.token as string) || req.body.token;
  const result = await authService.verifyEmail(token);
  sendResponse(res, 200, result.message, result.user);
});

// Resend verification email
export const resendVerification = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await authService.resendVerification(email);
  sendResponse(res, 200, result.message);
});

// Change password for logged-in user
export const changePassword = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.user?.id;

        if (!userId) {
            return sendResponse(res, 401, 'Unauthorized');
        }

        const { currentPassword, newPassword } = req.body;

        const result = await authService.changePassword(
            userId,
            currentPassword,
            newPassword
        );

        sendResponse(res, 200, result.message);
    }
);