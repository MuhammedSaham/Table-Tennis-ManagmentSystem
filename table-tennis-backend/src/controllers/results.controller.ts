import { Request, Response } from 'express';
import { ResultsService } from '../services/results.service';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';

const resultsService = new ResultsService();

// Get tournament standings
export const getTournamentStandings = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId } = req.params;
  const { categoryId } = req.query;
  const standings = await resultsService.getTournamentStandings(tournamentId, categoryId as string);
  sendResponse(res, 200, 'Tournament standings retrieved successfully', standings);
});

// Get category winners
export const getCategoryWinners = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId } = req.params;
  const winners = await resultsService.getCategoryWinners(tournamentId);
  sendResponse(res, 200, 'Category winners retrieved successfully', winners);
});

// Release tournament results (Admin only)
export const releaseResults = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId } = req.params;
  const results = await resultsService.releaseResults(req.user!.id, tournamentId);
  sendResponse(res, 200, 'Tournament results released successfully', results);
});

// Get tournament statistics
export const getTournamentStatistics = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId } = req.params;
  const statistics = await resultsService.getTournamentStatistics(tournamentId);
  sendResponse(res, 200, 'Tournament statistics retrieved successfully', statistics);
});

// Get player ranking
export const getPlayerRanking = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const ranking = await resultsService.getPlayerRanking(tournamentId, limit);
  sendResponse(res, 200, 'Player ranking retrieved successfully', ranking);
});

export const getGlobalCategoryStandings = catchAsync(async (req: Request, res: Response) => {
  const { categoryName } = req.params;
  const { limit } = req.query;
  
  const standings = await resultsService.getGlobalCategoryStandings(
    categoryName, 
    limit ? parseInt(limit as string) : 50
  );
  
  sendResponse(res, 200, 'Global category standings retrieved', standings);
});