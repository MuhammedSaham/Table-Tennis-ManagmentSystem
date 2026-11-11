import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { Permission } from '@prisma/client';

export const VALID_PERMISSIONS: Permission[] = [
    'MANAGE_USERS',
    'MANAGE_PLAYERS',
    'MANAGE_REFEREES',
    'MANAGE_TOURNAMENTS',
    'MANAGE_REGISTRATIONS',
    'MANAGE_MATCHES',
    'MANAGE_RESULTS',
    'MANAGE_RANKINGS',
    'MANAGE_CLUB_MEMBERSHIPS',
];

export class AdminRequestService {
    static async getPendingRequests() {
        return prisma.user.findMany({
            where: {
                adminRequestStatus: 'PENDING',
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                adminRequestedAt: true,
            },
            orderBy: {
                adminRequestedAt: 'desc',
            },
        });
    }

    static async approveRequest(userId: string, approverId: string, requestedPermissions: string[]) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { adminPermissions: true },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (user.adminRequestStatus !== 'PENDING') {
            throw new AppError('User has no pending admin request', 400);
        }

        // Validate and filter permissions against valid enum values
        let permissionsToAssign: Permission[] = [];
        if (Array.isArray(requestedPermissions)) {
            permissionsToAssign = Array.from(new Set(requestedPermissions)).filter((p): p is Permission =>
                VALID_PERMISSIONS.includes(p as Permission)
            );
        }

        return prisma.$transaction(async (tx) => {
            // Update user role to ADMIN and status to APPROVED
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    role: 'ADMIN',
                    adminRequestStatus: 'APPROVED',
                    adminApprovedBy: approverId,
                    adminApprovedAt: new Date(),
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isSuperAdmin: true,
                    adminRequestStatus: true,
                    adminApprovedAt: true,
                    adminApprovedBy: true,
                },
            });

            // Ensure AdminProfile exists
            await tx.adminProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    department: 'Approved Admin',
                },
                update: {},
            });

            // Clean up existing permissions
            await tx.adminPermission.deleteMany({
                where: { userId },
            });

            // Batch insert the selected permissions into AdminPermission table
            if (permissionsToAssign.length > 0) {
                await tx.adminPermission.createMany({
                    data: permissionsToAssign.map((permission) => ({
                        userId,
                        permission,
                    })),
                });
            }

            // Create notification for approved admin
            await tx.notification.create({
                data: {
                    userId,
                    type: 'ADMIN_APPROVED',
                    title: 'Admin Request Approved',
                    message: `Your request to become an administrator has been approved! You have been granted ${permissionsToAssign.length} permission(s).`,
                },
            });

            return {
                ...updatedUser,
                permissions: permissionsToAssign,
            };
        });
    }

    static async rejectRequest(userId: string, rejectorId: string, reason?: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (user.adminRequestStatus !== 'PENDING') {
            throw new AppError('User has no pending admin request', 400);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                adminRequestStatus: 'REJECTED',
                adminApprovedBy: rejectorId,
                adminApprovedAt: new Date(),
                adminRejectionReason: reason || 'No reason provided',
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                adminRequestStatus: true,
                adminRejectionReason: true,
            },
        });

        await prisma.notification.create({
            data: {
                userId,
                type: 'ADMIN_REJECTED',
                title: 'Admin Request Rejected',
                message: `Your admin request was rejected. Reason: ${reason || 'Not specified'}`,
            },
        });

        return updatedUser;
    }
}
