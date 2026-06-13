import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';

const searchService = new SearchService();

export const searchTournaments = catchAsync(async (req: Request, res: Response) => {
  const { q, status } = req.query;
  const results = await searchService.searchTournaments(q as string, status as string);
  sendResponse(res, 200, 'Search results', results);
});

export const searchPlayers = catchAsync(async (req: Request, res: Response) => {
  const { q } = req.query;
  const results = await searchService.searchPlayers(q as string);
  sendResponse(res, 200, 'Search results', results);
});

export const searchMatches = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId, playerId, status } = req.query;
  const results = await searchService.searchMatches(
    tournamentId as string,
    playerId as string,
    status as string
  );
  sendResponse(res, 200, 'Search results', results);
});