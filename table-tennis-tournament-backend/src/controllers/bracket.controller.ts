import { Request, Response } from 'express';
import { BracketService } from '../services/bracket.service';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';

const bracketService = new BracketService();

export const generateBracket = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId, categoryId } = req.params;
  const bracket = await bracketService.generateBracket(req.user!.id, tournamentId, categoryId);
  sendResponse(res, 201, 'Bracket generated successfully', bracket);
});

export const getBracket = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId, categoryId } = req.params;
  const bracket = await bracketService.getBracket(tournamentId, categoryId);
  sendResponse(res, 200, 'Bracket retrieved successfully', bracket);
});