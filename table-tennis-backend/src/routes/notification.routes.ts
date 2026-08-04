import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    getMyNotifications,
    markNotificationAsRead,
    markAllAsRead,
} from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/read-all', markAllAsRead);

export default router;