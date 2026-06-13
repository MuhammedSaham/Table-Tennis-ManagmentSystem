import { Request, Response } from 'express';
import { TeamService } from '../services/team.service';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';

const teamService = new TeamService();

// Create team (Admin only)
export const createTeam = catchAsync(async (req: Request, res: Response) => {
  const team = await teamService.createTeam(req.user!.id, req.body);
  sendResponse(res, 201, 'Team created successfully', team);
});

// Get team by ID
export const getTeamById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const team = await teamService.getTeamById(id);
  sendResponse(res, 200, 'Team retrieved successfully', team);
});

// Get tournament teams
export const getTournamentTeams = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId } = req.params;
  const teams = await teamService.getTournamentTeams(tournamentId);
  sendResponse(res, 200, 'Teams retrieved successfully', teams);
});