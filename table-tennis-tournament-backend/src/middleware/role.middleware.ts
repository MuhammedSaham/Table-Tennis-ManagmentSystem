import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import prisma from '../config/database';

// Restrict access to specific roles
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('You are not logged in', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }

        next();
    };
};

// Check if user is Admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('You are not logged in', 401));
    }

    if (req.user.role !== 'ADMIN') {
        return next(new AppError('This action requires admin privileges', 403));
    }

    next();
};

// Check if user is Referee
export const isReferee = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('You are not logged in', 401));
    }

    if (req.user.role !== 'REFEREE') {
        return next(new AppError('This action requires referee privileges', 403));
    }

    next();
};

// Check if user is Player
export const isPlayer = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('You are not logged in', 401));
    }

    if (req.user.role !== 'PLAYER') {
        return next(new AppError('This action requires a player account', 403));
    }

    next();
};
// Add this after the isReferee export:
export const isAdminOrReferee = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('You are not logged in', 401));
    }
    if (req.user.role !== 'ADMIN' && req.user.role !== 'REFEREE') {
        return next(new AppError('This action requires admin or referee privileges', 403));
    }
    next();
};
export const isSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('You are not logged in', 401));
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { isSuperAdmin: true },
    });

    if (!user?.isSuperAdmin) {
        return next(new AppError('Only the main admin can perform this action', 403));
    }

    next();
};
// role.middleware.ts — add this:
export const isSuperAdminForAdmins = async (req: Request, res: Response, next: NextFunction) => {
    const targetUserId = req.params.id;

    // Check if target user is an admin
    const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { role: true, isSuperAdmin: true },
    });

    // If target is not an admin — any admin can proceed
    if (!targetUser || targetUser.role !== 'ADMIN') {
        return next();
    }

    // Target IS an admin — only super admin can modify them
    const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { isSuperAdmin: true },
    });

    if (!currentUser?.isSuperAdmin) {
        return next(new AppError('Only the main admin can modify other admin accounts', 403));
    }

    next();
};