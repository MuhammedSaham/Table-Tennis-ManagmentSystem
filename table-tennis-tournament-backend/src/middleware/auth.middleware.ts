import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../utils/AppError';

const authService = new AuthService();

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                role: string;
            };
        }
    }
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Authentication required. Please provide a valid token.', 401);
        }

        const token = authHeader.split(' ')[1];

        // Verify token and get user
        const user = await authService.verifyToken(token);

        // Attach user to request
        req.user = user;

        next();
    } catch (error) {
        next(error);
    }
};