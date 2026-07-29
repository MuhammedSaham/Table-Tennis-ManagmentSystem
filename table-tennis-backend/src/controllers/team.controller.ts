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

// ─── DOUBLES INVITE CONTROLLERS ──────────────────────────────────────────────

// Search partners by name or email
export const searchPartners = catchAsync(async (req: Request, res: Response) => {
  const { q } = req.query as { q: string };
  if (!q || q.trim().length < 2) {
    return sendResponse(res, 400, 'Search query must be at least 2 characters', []);
  }
  const partners = await teamService.searchPartners(q.trim(), req.user!.id);
  sendResponse(res, 200, 'Partners found', partners);
});

// Send a doubles partner invite
export const sendInvite = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId, categoryId, inviteeId } = req.body;
  const invite = await teamService.sendInvite(req.user!.id, tournamentId, categoryId, inviteeId);
  sendResponse(res, 201, 'Invite sent successfully', invite);
});

// Accept an invite
export const acceptInvite = catchAsync(async (req: Request, res: Response) => {
  const { inviteId } = req.params;
  const result = await teamService.respondToInvite(req.user!.id, inviteId, true);
  sendResponse(res, 200, 'Invite accepted', result);
});

// Decline an invite
export const declineInvite = catchAsync(async (req: Request, res: Response) => {
  const { inviteId } = req.params;
  const result = await teamService.respondToInvite(req.user!.id, inviteId, false);
  sendResponse(res, 200, 'Invite declined', result);
});

// Cancel a pending invite (inviter)
export const cancelInvite = catchAsync(async (req: Request, res: Response) => {
  const { inviteId } = req.params;
  const result = await teamService.cancelInvite(req.user!.id, inviteId);
  sendResponse(res, 200, 'Invite cancelled', result);
});

// Get pending invites received by this user
export const getMyInvites = catchAsync(async (req: Request, res: Response) => {
  const invites = await teamService.getMyInvites(req.user!.id);
  sendResponse(res, 200, 'Invites fetched', invites);
});