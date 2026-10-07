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
import { isPlayer, isAdmin } from '../middleware/role.middleware';

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
    isAdmin,
    getPendingClubMembershipRequests
);

// Admin approves a membership request
router.patch(
    '/requests/:requestId/approve',
    authenticate,
    isAdmin,
    approveClubMembershipRequest
);

// Admin rejects a membership request
router.patch(
    '/requests/:requestId/reject',
    authenticate,
    isAdmin,
    rejectClubMembershipRequest
);


// Admin removes a player's club membership
router.patch(
    '/players/:playerId/remove',
    authenticate,
    isAdmin,
    removeClubMembership
);

export default router;