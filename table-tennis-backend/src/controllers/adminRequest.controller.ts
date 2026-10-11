import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';
import { AdminRequestService } from '../services/adminRequest.service';
import { AppError } from '../utils/AppError';

// Get all pending admin requests
export const getPendingAdminRequests = catchAsync(async (req: Request, res: Response) => {
    const pendingRequests = await AdminRequestService.getPendingRequests();
    sendResponse(res, 200, 'Pending admin requests retrieved', pendingRequests);
});

// Approve admin request
export const approveAdminRequest = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const adminId = req.user!.id;
    const rawPermissions = req.body?.permissions ?? req.body?.permissionIds ?? [];

    if (req.user!.role !== 'SUPER_ADMIN') {
        throw new AppError('Only the Super Admin can approve requests', 403);
    }

    const result = await AdminRequestService.approveRequest(userId, adminId, rawPermissions);
    sendResponse(res, 200, 'Admin request approved successfully', result);
});

// Reject admin request
export const rejectAdminRequest = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    if (req.user!.role !== 'SUPER_ADMIN') {
        throw new AppError('Only the Super Admin can reject requests', 403);
    }

    const result = await AdminRequestService.rejectRequest(userId, adminId, reason);
    sendResponse(res, 200, 'Admin request rejected', result);
});