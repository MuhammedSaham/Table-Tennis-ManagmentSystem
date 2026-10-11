import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isSuperAdmin } from '../middleware/role.middleware';
import {
    getPendingAdminRequests,
    approveAdminRequest,
    rejectAdminRequest,
} from '../controllers/adminRequest.controller';

const router = Router();

// All admin request management routes require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(isSuperAdmin);

router.get('/', getPendingAdminRequests);
router.get('/pending', getPendingAdminRequests);
router.post('/:userId/approve', approveAdminRequest);
router.post('/:userId/reject', rejectAdminRequest);

export default router;