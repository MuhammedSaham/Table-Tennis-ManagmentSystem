import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import prisma from '../config/database';
import { Permission } from '@prisma/client';

// Restrict access to specific roles (SUPER_ADMIN always allowed)
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('You are not logged in', 401));
        }

        if (req.user.role === 'SUPER_ADMIN' || roles.includes(req.user.role)) {
            return next();
        }

        return next(new AppError('You do not have permission to perform this action', 403));
    };
};

// Check if user is Admin or Super Admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('You are not logged in', 401));
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
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

export const isAdminOrReferee = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('You are not logged in', 401));
    }
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'REFEREE') {
        return next(new AppError('This action requires admin or referee privileges', 403));
    }
    next();
};

// Check if user is Super Admin
export const isSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('You are not logged in', 401));
    }

    if (req.user.role === 'SUPER_ADMIN') {
        return next();
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true, isSuperAdmin: true },
    });

    if (user?.role !== 'SUPER_ADMIN' && !user?.isSuperAdmin) {
        return next(new AppError('Only the Super Admin can perform this action', 403));
    }

    next();
};

export const isSuperAdminForAdmins = async (req: Request, res: Response, next: NextFunction) => {
    const targetUserId = req.params.id || req.params.userId;

    const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { role: true, isSuperAdmin: true },
    });

    // If target is not an admin or super admin — any admin can proceed
    if (!targetUser || (targetUser.role !== 'ADMIN' && targetUser.role !== 'SUPER_ADMIN')) {
        return next();
    }

    // Target IS an admin or super admin — only super admin can modify them
    if (req.user?.role === 'SUPER_ADMIN') {
        return next();
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { role: true, isSuperAdmin: true },
    });

    if (currentUser?.role !== 'SUPER_ADMIN' && !currentUser?.isSuperAdmin) {
        return next(new AppError('Only the Super Admin can modify admin accounts', 403));
    }

    next();
};

// Enforce specific permission checks for ADMIN users (SUPER_ADMIN always has full access)
export const hasPermission = (...requiredPermissions: Permission[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('You are not logged in', 401));
        }

        // Requirement 1: SUPER_ADMIN must have permanent full access even without any records in AdminPermission
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }

        // If not SUPER_ADMIN and not ADMIN, block access
        if (req.user.role !== 'ADMIN') {
            return next(new AppError('This action requires administrative privileges', 403));
        }

        // Fetch assigned permissions for this ADMIN user
        const adminPerms = await prisma.adminPermission.findMany({
            where: { userId: req.user.id },
            select: { permission: true },
        });

        const assignedSet = new Set(adminPerms.map((p) => p.permission));

        // Check if user has at least one of the required permissions
        const hasAccess = requiredPermissions.some((perm) => assignedSet.has(perm));

        if (!hasAccess) {
            return next(
                new AppError(
                    `You do not have permission to perform this action. Required: ${requiredPermissions.join(', ')}`,
                    403
                )
            );
        }

        next();
    };
};