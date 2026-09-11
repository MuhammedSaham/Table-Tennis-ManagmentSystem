import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';

const dashboardService = new DashboardService();

export const getAdminDashboard = catchAsync(async (req: Request, res: Response) => {
  const dashboard = await dashboardService.getAdminDashboard();
  sendResponse(res, 200, 'Admin dashboard retrieved successfully', dashboard);
});

export const getPlayerDashboard = catchAsync(async (req: Request, res: Response) => {
  const dashboard = await dashboardService.getPlayerDashboard(req.user!.id);
  sendResponse(res, 200, 'Player dashboard retrieved successfully', dashboard);
});

export const getRefereeDashboard = catchAsync(async (req: Request, res: Response) => {
  const dashboard = await dashboardService.getRefereeDashboard(req.user!.id);
  sendResponse(res, 200, 'Referee dashboard retrieved successfully', dashboard);
});