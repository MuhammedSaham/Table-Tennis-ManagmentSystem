import { Request, Response } from 'express';
import prisma from '../config/database';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';

// Get user's notifications
export const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
    const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    sendResponse(res, 200, 'Notifications retrieved', notifications);
});

// Mark notification as read
export const markNotificationAsRead = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const notification = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
    });

    sendResponse(res, 200, 'Notification marked as read', notification);
});

// Mark all notifications as read
export const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    await prisma.notification.updateMany({
        where: { 
            userId: req.user!.id,
            isRead: false,
        },
        data: { isRead: true },
    });

    sendResponse(res, 200, 'All notifications marked as read');
});