import { Router } from 'express';
import {
    requestClubMembership,
    getMyMembershipStatus,
    getPendingClubMembershipRequests,
    approveClubMembershipRequest,
    rejectClubMembershipRequest,
    removeClubMembership
} from '../controllers/clubMembership.controller';

import { authenticate } from '../middleware/auth.middleware';
import { isPlayer, hasPermission } from '../middleware/role.middleware';

const router = Router();

// Player requests club membership
router.post(
    '/request',
    authenticate,
    isPlayer,
    requestClubMembership
);

// Player gets their own club membership status
router.get(
    '/status',
    authenticate,
    isPlayer,
    getMyMembershipStatus
);

// Admin gets pending membership requests
router.get(
    '/requests',
    authenticate,
    hasPermission('MANAGE_PLAYERS', 'MANAGE_CLUB_MEMBERSHIPS'),
    getPendingClubMembershipRequests
);

// Admin approves a membership request
router.patch(
    '/requests/:requestId/approve',
    authenticate,
    hasPermission('MANAGE_PLAYERS', 'MANAGE_CLUB_MEMBERSHIPS'),
    approveClubMembershipRequest
);

// Admin rejects a membership request
router.patch(
    '/requests/:requestId/reject',
    authenticate,
    hasPermission('MANAGE_PLAYERS', 'MANAGE_CLUB_MEMBERSHIPS'),
    rejectClubMembershipRequest
);

// Admin removes a player's club membership
router.patch(
    '/players/:playerId/remove',
    authenticate,
    hasPermission('MANAGE_PLAYERS', 'MANAGE_CLUB_MEMBERSHIPS'),
    removeClubMembership
);

export default router;