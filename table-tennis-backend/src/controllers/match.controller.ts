import { Request, Response } from 'express';
import { MatchService } from '../services/match.service';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';

const matchService = new MatchService();

// Create match (Admin only)
export const createMatch = catchAsync(async (req: Request, res: Response) => {
  const match = await matchService.createMatch(req.user!.id, req.body);
  sendResponse(res, 201, 'Match created successfully', match);
});

// Get tournament matches
export const getTournamentMatches = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId } = req.params;
  const { status, categoryId } = req.query;
  const matches = await matchService.getTournamentMatches(tournamentId, status as string, categoryId as string);
  sendResponse(res, 200, 'Matches retrieved successfully', matches);
});

// Get my matches (for players)
export const getMyMatches = catchAsync(async (req: Request, res: Response) => {
  const matches = await matchService.getPlayerMatches(req.user!.id);
  sendResponse(res, 200, 'Your matches retrieved successfully', matches);
});

// Get referee matches
export const getRefereeMatches = catchAsync(async (req: Request, res: Response) => {
  const matches = await matchService.getRefereeMatches(req.user!.id);
  sendResponse(res, 200, 'Your assigned matches retrieved successfully', matches);
});

// Get match by ID
export const getMatchById = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const match = await matchService.getMatchById(matchId);
  sendResponse(res, 200, 'Match retrieved successfully', match);
});

// Update match status (Admin/Referee)
export const updateMatchStatus = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { status, player2Id, winnerId } = req.body;
  
  const updateData: any = { status };
  if (player2Id !== undefined) updateData.player2Id = player2Id;
  if (winnerId !== undefined) updateData.winnerId = winnerId;
  
  const match = await matchService.updateMatchStatus(req.user!.id, req.user!.role, matchId, status);
  
  // If we need to update player2Id as well
  if (player2Id !== undefined) {
    await prisma.match.update({
      where: { id: matchId },
      data: { player2Id }
    });
  }
  
  sendResponse(res, 200, 'Match status updated successfully', match);
});

// Assign referee to match (Admin only)
export const assignReferee = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { refereeUserId } = req.body;
  const match = await matchService.assignReferee(req.user!.id, matchId, refereeUserId);
  sendResponse(res, 200, 'Referee assigned successfully', match);
});

// Add these to the existing MatchController

// Record game scores (Referee only)
export const recordGameScores = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { games } = req.body;
  const match = await matchService.recordGameScores(req.user!.id, req.user!.role, matchId, games);
  sendResponse(res, 200, 'Game scores recorded successfully', match);
});

// Get match results
export const getMatchResults = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const results = await matchService.getMatchResults(matchId, req.user!.id, req.user!.role);
  sendResponse(res, 200, 'Match results retrieved successfully', results);
});

// Get player match history
export const getMyMatchHistory = catchAsync(async (req: Request, res: Response) => {
  const history = await matchService.getPlayerMatchHistory(req.user!.id);
  sendResponse(res, 200, 'Match history retrieved successfully', history);
});

// Get player performance statistics
export const getPlayerPerformanceStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await matchService.getPlayerPerformanceStats(req.user!.id);
  sendResponse(res, 200, 'Player statistics retrieved successfully', stats);
});
// Get player performance stats for public profile
export const getPlayerPerformanceStatsById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const stats = await matchService.getPlayerPerformanceStats(userId);
  sendResponse(res, 200, 'Player statistics retrieved successfully', stats);
});

// Update match details (score, winner, etc.)
export const updateMatch = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { score, winnerId,winnerTeamId, status, player1Id, player2Id,team1Id,team2Id } = req.body;
  
  const updateData: any = {};
  if (score !== undefined) updateData.score = score;
  if (winnerId !== undefined) updateData.winnerId = winnerId;
  if (winnerTeamId !== undefined) updateData.winnerTeamId = winnerTeamId;
  if (status !== undefined) updateData.status = status;
  if (player1Id !== undefined) updateData.player1Id = player1Id;
  if (player2Id !== undefined) updateData.player2Id = player2Id;
  if (team1Id !== undefined) updateData.team1Id = team1Id;
  if (team2Id !== undefined) updateData.team2Id = team2Id;
  if (status === 'COMPLETED' && (winnerId || winnerTeamId)) updateData.endTime = new Date();

  const match = await prisma.match.update({
    where: { id: matchId },
    data: updateData,
    include: {
      player1: { select: { id: true, firstName: true, lastName: true } },
      player2: { select: { id: true, firstName: true, lastName: true } },
      team1: true,
      team2: true,
      referee: { include: { user: true }},
    },
  });

  if (status === 'COMPLETED' && (winnerId || winnerTeamId)) {
    const nextRoundMap: Record<string, string> = {
      'Round of 128': 'Round of 64',
      'Round of 64': 'Round of 32',
      'Round of 32': 'Round of 16',
      'Round of 16': 'Quarter-Finals',
      'Quarter-Finals': 'Semi-Finals',
      'Quarter-final': 'Semi-final',
      'Semi-Finals': 'Final',
      'Semi-final': 'Final'
    };

    const nextRound = nextRoundMap[match.round];
    if (nextRound) {
      const currentRoundMatches = await prisma.match.findMany({
        where: { tournamentId: match.tournamentId, categoryId: match.categoryId, round: match.round },
        orderBy: { matchNumber: 'asc' }
      });
      const matchIndex = currentRoundMatches.findIndex(m => m.id === matchId);
      
      if (matchIndex !== -1) {
        const nextRoundMatches = await prisma.match.findMany({
          where: { tournamentId: match.tournamentId, categoryId: match.categoryId, round: nextRound },
          orderBy: { matchNumber: 'asc' }
        });

        const nextMatchIndex = Math.floor(matchIndex / 2);
        const nextMatch = nextRoundMatches[nextMatchIndex];

        if (nextMatch) {
          const isSlot1 = matchIndex % 2 === 0;
          const isDoubles = match.matchType === 'DOUBLES';

          // Advance winner into the correct slot of the next match
          if (isDoubles) {
            // winnerId is the winning team's ID
            await prisma.match.update({
              where: { id: nextMatch.id },
              data: isSlot1 ? { team1Id: winnerTeamId } : { team2Id: winnerTeamId }
            });
          } else {
            await prisma.match.update({
              where: { id: nextMatch.id },
              data: isSlot1 ? { player1Id: winnerId } : { player2Id: winnerId }
            });
          }
          
          // Fill 3rd Place Playoff with the loser
          if (nextRound === 'Final') {
            const thirdPlaceMatch = await prisma.match.findFirst({
              where: { tournamentId: match.tournamentId, categoryId: match.categoryId, round: '3rd Place Playoff' }
            });
            if (thirdPlaceMatch) {
              if (isDoubles) {
                // loserId = the team that is NOT the winner
                const loserTeamId = match.team1Id === winnerTeamId ? match.team2Id : match.team1Id;
                await prisma.match.update({
                  where: { id: thirdPlaceMatch.id },
                  data: isSlot1 ? { team1Id: loserTeamId } : { team2Id: loserTeamId }
                });
              } else {
                const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
                await prisma.match.update({
                  where: { id: thirdPlaceMatch.id },
                  data: isSlot1 ? { player1Id: loserId } : { player2Id: loserId }
                });
              }
            }
          }
        }
      }
    }
  }

  console.log("Updated match:", matchId, "| data:", updateData);
  
  sendResponse(res, 200, 'Match updated successfully', match);
});
// Delete all knockout matches for a category
export const deleteKnockoutMatches = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId, categoryId } = req.params;

  console.log(`Deleting knockout matches for tournament ${tournamentId}, category ${categoryId}`);
  
  // Delete games first (due to foreign key constraints)
  const knockoutMatches = await prisma.match.findMany({
    where: {
      tournamentId,
      categoryId,
      round: { in: ['Quarter-final', 'Semi-final', 'Final'] },
    },
    select: { id: true },
  });

  let deletedCount = 0;
  
  if (knockoutMatches.length > 0) {
    const matchIds = knockoutMatches.map(m => m.id);
    
    // Delete games
    const deletedGames = await prisma.game.deleteMany({
      where: { matchId: { in: matchIds } },
    });
    console.log(`Deleted ${deletedGames.count} games`);

    
    // Delete matches
    const deletedMatches = await prisma.match.deleteMany({
      where: {
        tournamentId,
        categoryId,
        round: { in: ['Quarter-final', 'Semi-final', 'Final'] },
      },
    });
    deletedCount =  deletedMatches.count;

    console.log(`Deleted ${deletedCount} knockout matches for category ${categoryId}`);
  } else {
    console.log(`No knockout matches found for category ${categoryId}`);
  }

  sendResponse(res, 200, `Deleted ${knockoutMatches.length} knockout matches`);
});
// Update match and automatically advance winner to next round
export const updateMatchAndAdvance = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { player1Score, player2Score } = req.body;
  
  // Update the current match
  const winnerId = player1Score > player2Score ? 
    (await prisma.match.findUnique({ where: { id: matchId } }))?.player1Id : 
    (await prisma.match.findUnique({ where: { id: matchId } }))?.player2Id;
  
  const updatedMatch = await prisma.match.update({
    where: { id: matchId },
    data: {
      score: `${player1Score} - ${player2Score}`,
      winnerId,
      status: 'COMPLETED',
      endTime: new Date(),
    },
  });
  
  // Get the current match to find its bracket position
  const currentMatch = updatedMatch;
  const tournamentId = currentMatch.tournamentId;
  const categoryId = currentMatch.categoryId;
  
  // Find the next round match
  let nextRoundMatch;
  
  if (currentMatch.round === 'Quarter-final') {
    // Find the corresponding Semi-final match
    // QF1 (matchNumber 1) → SF1 (matchNumber 3) as player2
    // QF2 (matchNumber 2) → SF2 (matchNumber 4) as player2
    const sfMatchNumber = currentMatch.matchNumber === 1 ? 3 : 4;
    nextRoundMatch = await prisma.match.findFirst({
      where: {
        tournamentId,
        categoryId,
        round: 'Semi-final',
        matchNumber: sfMatchNumber,
      },
    });
    
    if (nextRoundMatch) {
      await prisma.match.update({
        where: { id: nextRoundMatch.id },
        data: { player2Id: winnerId },
      });
    }
  } else if (currentMatch.round === 'Semi-final') {
    // Find the Final match
    // SF1 (matchNumber 3) → Final as player1
    // SF2 (matchNumber 4) → Final as player2
    const finalMatch = await prisma.match.findFirst({
      where: {
        tournamentId,
        categoryId,
        round: 'Final',
      },
    });
    
    if (finalMatch) {
      const updateData = currentMatch.matchNumber === 3 
        ? { player1Id: winnerId }
        : { player2Id: winnerId };
      
      await prisma.match.update({
        where: { id: finalMatch.id },
        data: updateData,
      });
    }
  }
  
  sendResponse(res, 200, 'Match updated and winner advanced', updatedMatch);
});
export const swapPlayers = catchAsync(async (req: Request, res: Response) => {
  const { match1Id, match2Id, slot1, slot2 } = req.body;

  const m1 = await prisma.match.findUnique({
    where: { id: match1Id },
  });

  const m2 = await prisma.match.findUnique({
    where: { id: match2Id },
  });

  if (!m1 || !m2) {
    throw new AppError('Match not found', 404);
  }

  // Both matches must belong to the same tournament and category
  if (
    m1.tournamentId !== m2.tournamentId ||
    m1.categoryId !== m2.categoryId
  ) {
    throw new AppError(
      'Matches are not in the same tournament or category',
      400
    );
  }

  // Both matches must have the same match type
  if (m1.matchType !== m2.matchType) {
    throw new AppError(
      'Cannot swap participants between different match types',
      400
    );
  }

  // ==========================================
  // SINGLES
  // ==========================================
  if (m1.matchType === 'SINGLES') {

    if (
      !['player1', 'player2'].includes(slot1) ||
      !['player1', 'player2'].includes(slot2)
    ) {
      throw new AppError(
        'Invalid slots for singles match',
        400
      );
    }

    const p1 =
      slot1 === 'player1'
        ? m1.player1Id
        : m1.player2Id;

    const p2 =
      slot2 === 'player1'
        ? m2.player1Id
        : m2.player2Id;

    await prisma.match.update({
      where: { id: match1Id },
      data: {
        [slot1 === 'player1' ? 'player1Id' : 'player2Id']: p2,
      },
    });

    await prisma.match.update({
      where: { id: match2Id },
      data: {
        [slot2 === 'player1' ? 'player1Id' : 'player2Id']: p1,
      },
    });
  }

  // ==========================================
  // DOUBLES / MIXED DOUBLES
  // ==========================================
  else if (m1.matchType === 'DOUBLES') {

    if (
      !['team1', 'team2'].includes(slot1) ||
      !['team1', 'team2'].includes(slot2)
    ) {
      throw new AppError(
        'Invalid slots for doubles match',
        400
      );
    }

    const t1 =
      slot1 === 'team1'
        ? m1.team1Id
        : m1.team2Id;

    const t2 =
      slot2 === 'team1'
        ? m2.team1Id
        : m2.team2Id;

    await prisma.match.update({
      where: { id: match1Id },
      data: {
        [slot1 === 'team1' ? 'team1Id' : 'team2Id']: t2,
      },
    });

    await prisma.match.update({
      where: { id: match2Id },
      data: {
        [slot2 === 'team1' ? 'team1Id' : 'team2Id']: t1,
      },
    });
  }

  else {
    throw new AppError(
      'Unsupported match type',
      400
    );
  }

  sendResponse(
    res,
    200,
    'Participants swapped successfully',
    {
      match1Id,
      match2Id,
      matchType: m1.matchType,
    }
  );
});

