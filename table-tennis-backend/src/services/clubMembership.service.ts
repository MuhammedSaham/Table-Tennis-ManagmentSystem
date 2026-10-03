import prisma from '../config/database';
import { AppError } from '../utils/AppError';

export class ClubMembershipService {
    private readonly MAX_MEMBERSHIP_REJECTIONS = 3;
    // Player requests to become a club member
    async requestMembership(userId: string) {
        // Find the player's profile
        const playerProfile = await prisma.playerProfile.findUnique({
            where: {
                userId,
            },
        });

        if (!playerProfile) {
            throw new AppError('Player profile not found', 404);
        }

        // Already a club member
        if (playerProfile.isClubMember) {
            throw new AppError('You are already a club member', 400);
        }

        // Check whether a request already exists
        const existingRequest = await prisma.clubMembershipRequest.findUnique({
            where: {
                playerProfileId: playerProfile.id,
            },
        });

        // If there is already a pending request
        if (existingRequest?.status === 'PENDING') {
    throw new AppError(
        'You already have a pending club membership request',
        400
    );
}

if (
    existingRequest?.status === 'REJECTED' &&
    existingRequest.rejectionCount >= this.MAX_MEMBERSHIP_REJECTIONS
) {
    throw new AppError(
        'Your club membership request has been permanently rejected. Please contact the club administrator.',
        400
    );
}

if (existingRequest) {
    const request = await prisma.clubMembershipRequest.update({
        where: { id: existingRequest.id },
        data: {
            status: 'PENDING',
            requestedAt: new Date(),
            reviewedAt: null,
            reviewedBy: null,
            rejectionReason: null,
        },
    });

    return request;
}

        // First membership request
        const request = await prisma.clubMembershipRequest.create({
            data: {
                playerProfileId: playerProfile.id,
                status: 'PENDING',
            },
        });

        return request;
    }
        // Player gets their own club membership status
    async getMyMembershipStatus(userId: string) {
        const playerProfile = await prisma.playerProfile.findUnique({
            where: {
                userId,
            },
            select: {
                isClubMember: true,
                clubMembershipRequest: {
                    select: {
                        id: true,
                        status: true,
                        requestedAt: true,
                        reviewedAt: true,
                        rejectionReason: true,
                        rejectionCount: true,
                    },
                },
            },
        });

        if (!playerProfile) {
            throw new AppError('Player profile not found', 404);
        }

        return {
            isClubMember: playerProfile.isClubMember,
            request: playerProfile.clubMembershipRequest,
        };
    }
        // Admin gets all pending club membership requests
    async getPendingRequests() {
        const requests = await prisma.clubMembershipRequest.findMany({
            where: {
                status: 'PENDING',
            },
            include: {
                playerProfile: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                requestedAt: 'asc',
            },
        });

        return requests;
    }
        // Admin approves a club membership request
    async approveRequest(requestId: string, adminId: string) {
        const request = await prisma.clubMembershipRequest.findUnique({
            where: {
                id: requestId,
            },
            include: {
                playerProfile: true,
            },
        });

        if (!request) {
            throw new AppError('Club membership request not found', 404);
        }

        if (request.status !== 'PENDING') {
            throw new AppError(
                'This club membership request has already been processed',
                400
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            // Make the player a club member
            const playerProfile = await tx.playerProfile.update({
                where: {
                    id: request.playerProfileId,
                },
                data: {
                    isClubMember: true,
                },
            });

            // Mark the request as approved
            const membershipRequest = await tx.clubMembershipRequest.update({
                where: {
                    id: requestId,
                },
                data: {
                    status: 'APPROVED',
                    reviewedAt: new Date(),
                    reviewedBy: adminId,
                },
            });

            return {
                playerProfile,
                membershipRequest,
            };
        });

        return result;
    }
        // Admin rejects a club membership request
    async rejectRequest(
        requestId: string,
        adminId: string,
        reason?: string
    ) {
        const request = await prisma.clubMembershipRequest.findUnique({
            where: {
                id: requestId,
            },
        });

        if (!request) {
            throw new AppError('Club membership request not found', 404);
        }

        if (request.status !== 'PENDING') {
            throw new AppError(
                'This club membership request has already been processed',
                400
            );
        }

        const updatedRequest = await prisma.clubMembershipRequest.update({
            where: {
                id: requestId,
            },
            data: {
                status: 'REJECTED',
                reviewedAt: new Date(),
                reviewedBy: adminId,
                rejectionReason: reason || 'No reason provided',
                rejectionCount: {
                    increment: 1,
                }
            },
        });

        return updatedRequest;
    }
}