import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import {
    getPendingAdminRequests,
    approveAdminRequest,
    rejectAdminRequest,
} from '../controllers/adminRequest.controller';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

router.get('/pending', getPendingAdminRequests);
router.post('/:userId/approve', approveAdminRequest);
router.post('/:userId/reject', rejectAdminRequest);

export default router;