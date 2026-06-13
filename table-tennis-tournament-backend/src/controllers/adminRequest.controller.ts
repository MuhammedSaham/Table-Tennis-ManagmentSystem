import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';

// Get all pending admin requests
export const getPendingAdminRequests = catchAsync(async (req: Request, res: Response) => {
    const pendingRequests = await prisma.user.findMany({
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
    });

    sendResponse(res, 200, 'Pending admin requests retrieved', pendingRequests);
});

// Approve admin request
export const approveAdminRequest = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const adminId = req.user!.id;

    // Verify admin
    const admin = await prisma.adminProfile.findUnique({
        where: { userId: adminId },
    });

    if (!admin) {
        throw new AppError('Only admins can approve requests', 403);
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (user.adminRequestStatus !== 'PENDING') {
        throw new AppError('User has no pending admin request', 400);
    }

    // Update user to ADMIN
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            role: 'ADMIN',
            adminRequestStatus: 'APPROVED',
            adminApprovedBy: adminId,
            adminApprovedAt: new Date(),
        },
    });

    // Create admin profile
    await prisma.adminProfile.create({
        data: {
            userId: userId,
            department: 'Approved Admin',
        },
    });

    // Create notification
    await prisma.notification.create({
        data: {
            userId: userId,
            type: 'ADMIN_APPROVED',
            title: 'Admin Request Approved',
            message: 'Your request to become an administrator has been approved! You now have full admin access.',
        },
    });

    sendResponse(res, 200, 'Admin request approved successfully', updatedUser);
});

// Reject admin request
export const rejectAdminRequest = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    const admin = await prisma.adminProfile.findUnique({
        where: { userId: adminId },
    });

    if (!admin) {
        throw new AppError('Only admins can reject requests', 403);
    }

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
            adminApprovedBy: adminId,
            adminApprovedAt: new Date(),
            adminRejectionReason: reason || 'No reason provided',
        },
    });

    await prisma.notification.create({
        data: {
            userId: userId,
            type: 'ADMIN_REJECTED',
            title: 'Admin Request Rejected',
            message: `Your admin request was rejected. Reason: ${reason || 'Not specified'}`,
        },
    });

    sendResponse(res, 200, 'Admin request rejected', updatedUser);
});