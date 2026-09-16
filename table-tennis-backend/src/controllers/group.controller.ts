import { Request, Response } from 'express';
import prisma from '../config/database';
import { GroupService } from '../services/group.service';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';

const groupService = new GroupService();

export const assignRefereeToGroupMatch = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { refereeUserId } = req.body;
  const match = await groupService.assignRefereeToGroupMatch(matchId, refereeUserId);
  sendResponse(res, 200, 'Referee assigned successfully', match);
});

export const createGroups = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId, categoryId } = req.params;
  const { numberOfGroups } = req.body;
  const groups = await groupService.createGroups(req.user!.id, tournamentId, categoryId, numberOfGroups);
  sendResponse(res, 201, 'Groups created successfully', groups);
});

export const generateGroupMatches = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId, categoryId } = req.params;
  const result = await groupService.generateGroupMatches(req.user!.id, tournamentId, categoryId);
  sendResponse(res, 200, 'Group matches generated', result);
});

export const recordGroupScore = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { games, bestOf } = req.body;
  // games: [{ p1: number|null, p2: number|null }, ...]
  const match = await groupService.recordGroupScore(
    matchId,
    games,
    req.user!.id,
    bestOf ?? 5,
    req.user?.role
  );
  sendResponse(res, 200, 'Score recorded successfully', match);
});

export const getGroupStandings = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId, categoryId } = req.params;
  const standings = await groupService.getGroupStandings(tournamentId, categoryId);
  sendResponse(res, 200, 'Group standings retrieved', standings);
});

export const generateKnockoutStage = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId, categoryId } = req.params;
  const { topFromEachGroup = 2 } = req.body;
  const result = await groupService.generateKnockoutStage(req.user!.id, tournamentId, categoryId, topFromEachGroup);
  sendResponse(res, 200, 'Knockout stage generated', result);
});
export const getGroupMatches = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId, categoryId } = req.params;
  
  // Get all groups for this tournament/category
  const groups = await prisma.group.findMany({
    where: { tournamentId, categoryId },
    include: {
      matches: {
        include: {
          player1: { select: { firstName: true, lastName: true, id: true } },
          player2: { select: { firstName: true, lastName: true, id: true } },
          team1: {
            include: {
              members: {
                include: { player: { select: { id: true, firstName: true, lastName: true } } },
              },
            },
          },
          team2: {
            include: {
              members: {
                include: { player: { select: { id: true, firstName: true, lastName: true } } },
              },
            },
          },
        },
      },
    },
  });
  
  // Flatten matches from all groups
  const allMatches = groups.flatMap(group => group.matches);
  
  sendResponse(res, 200, 'Group matches retrieved', allMatches);
});
export const updateGroupMembers = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId, categoryId } = req.params;
  const { groupAssignments } = req.body;
  // groupAssignments: [{ groupId: string, playerIds: string[] }]
  const result = await groupService.updateGroupMembers(
    req.user!.id,
    tournamentId,
    categoryId,
    groupAssignments
  );
  sendResponse(res, 200, 'Group members updated successfully', result);
});