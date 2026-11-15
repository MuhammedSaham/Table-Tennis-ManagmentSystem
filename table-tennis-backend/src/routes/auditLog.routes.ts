import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isSuperAdmin } from '../middleware/role.middleware';
import { getAuditLogs } from '../controllers/auditLog.controller';

const router = Router();

router.use(authenticate, isSuperAdmin);

router.get('/', getAuditLogs);

export default router;

