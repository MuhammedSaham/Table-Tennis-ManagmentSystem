import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';
import { ClubMembershipService } from '../services/clubMembership.service';

const clubMembershipService = new ClubMembershipService();

// Player requests club membership
export const requestClubMembership = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.user!.id;

        const request = await clubMembershipService.requestMembership(userId);

        sendResponse(
            res,
            201,
            'Club membership request submitted successfully',
            request
        );
    }
);
// Admin gets all pending club membership requests
export const getPendingClubMembershipRequests = catchAsync(
    async (req: Request, res: Response) => {
        const requests = await clubMembershipService.getPendingRequests();

        sendResponse(
            res,
            200,
            'Pending club membership requests retrieved successfully',
            requests
        );
    }
);

// Admin approves a club membership request
export const approveClubMembershipRequest = catchAsync(
    async (req: Request, res: Response) => {
        const { requestId } = req.params;
        const adminId = req.user!.id;

        const result = await clubMembershipService.approveRequest(
            requestId,
            adminId
        );

        sendResponse(
            res,
            200,
            'Club membership request approved successfully',
            result
        );
    }
);
// Admin rejects a club membership request
export const rejectClubMembershipRequest = catchAsync(
    async (req: Request, res: Response) => {
        const { requestId } = req.params;
        const { reason } = req.body;
        const adminId = req.user!.id;

        const request = await clubMembershipService.rejectRequest(
            requestId,
            adminId,
            reason
        );

        sendResponse(
            res,
            200,
            'Club membership request rejected successfully',
            request
        );
    }
);
// Player gets their own club membership status
export const getMyMembershipStatus = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.user!.id;

        const status = await clubMembershipService.getMyMembershipStatus(
            userId
        );

        sendResponse(
            res,
            200,
            'Club membership status retrieved successfully',
            status
        );
    }
);