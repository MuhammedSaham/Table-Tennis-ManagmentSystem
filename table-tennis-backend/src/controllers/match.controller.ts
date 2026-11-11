import { Request, Response } from 'express';
import { MatchService } from '../services/match.service';
import { GroupService } from '../services/group.service';
import { BracketService } from '../services/bracket.service';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';

const matchService = new MatchService();
const groupService = new GroupService();
const bracketService = new BracketService();

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
  const { score, winnerId,winnerTeamId, status, player1Id, player2Id,team1Id,team2Id, resultDetails,startTime,endTime, } = req.body;
  
  if (req.user?.role === 'REFEREE') {
  const existingMatch = await prisma.match.findUnique({
    where: { id: matchId },
    include: { referee: true },
  });

  if (!existingMatch) {
    throw new AppError('Match not found', 404);
  }

  // Referee can update only their assigned matches
  if (existingMatch.referee?.userId !== req.user.id) {
    throw new AppError(
      'You can only record scores for matches assigned to you',
      403
    );
  }

  // Referee cannot edit completed match results
  if (
    existingMatch.status === 'COMPLETED' ||
    existingMatch.status === 'WALKOVER'
  ) {
    throw new AppError(
      'Completed match results can only be edited by an admin',
      403
    );
  }
}

  const updateData: any = {};
  if (score !== undefined) updateData.score = score;
  if (winnerId !== undefined) updateData.winnerId = winnerId;
  if (winnerTeamId !== undefined) updateData.winnerTeamId = winnerTeamId;
  if (status !== undefined) updateData.status = status;
  if (player1Id !== undefined) updateData.player1Id = player1Id;
  if (player2Id !== undefined) updateData.player2Id = player2Id;
  if (team1Id !== undefined) updateData.team1Id = team1Id;
  if (team2Id !== undefined) updateData.team2Id = team2Id;
  if (resultDetails !== undefined) updateData.resultDetails = resultDetails;

  
if (startTime !== undefined) {
  const parsedStartTime = new Date(startTime);

  if (!startTime || Number.isNaN(parsedStartTime.getTime())) {
    throw new AppError('Invalid match start time', 400);
  }

  updateData.startTime = parsedStartTime;
}

if (endTime !== undefined) {
  const parsedEndTime = new Date(endTime);

  if (!endTime || Number.isNaN(parsedEndTime.getTime())) {
    throw new AppError('Invalid match end time', 400);
  }

  updateData.endTime = parsedEndTime;
}




  
const isMatchFinished =
  (status === 'COMPLETED' || status === 'WALKOVER') &&
  Boolean(winnerId || winnerTeamId);

// Keep the existing automatic end time when no manual time is provided.
if (isMatchFinished && endTime === undefined) {
  updateData.endTime = new Date();
}


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

  if (isMatchFinished) {
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

    let nextRound = nextRoundMap[match.round];
    if (!nextRound) {
      const norm = match.round.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm === 'roundof128') nextRound = 'Round of 64';
      else if (norm === 'roundof64') nextRound = 'Round of 32';
      else if (norm === 'roundof32') nextRound = 'Round of 16';
      else if (norm === 'roundof16') nextRound = 'Quarter-Finals';
      else if (norm === 'quarterfinals' || norm === 'quarterfinal') nextRound = 'Semi-Finals';
      else if (norm === 'semifinals' || norm === 'semifinal') nextRound = 'Final';
    }

    if (nextRound) {
      const currentRoundMatches = await prisma.match.findMany({
        where: {
          tournamentId: match.tournamentId,
          categoryId: match.categoryId,
          round: { in: [match.round, match.round.replace('-Finals', '-final'), match.round.replace('-final', '-Finals')] }
        },
        orderBy: { matchNumber: 'asc' }
      });
      const matchIndex = currentRoundMatches.findIndex(m => m.id === matchId);
      
      if (matchIndex !== -1) {
        const nextRoundMatches = await prisma.match.findMany({
          where: {
            tournamentId: match.tournamentId,
            categoryId: match.categoryId,
            round: { in: [nextRound, nextRound.replace('-Finals', '-final'), nextRound.replace('-final', '-Finals')] }
          },
          orderBy: { matchNumber: 'asc' }
        });

        const nextMatchIndex = Math.floor(matchIndex / 2);
        const nextMatch = nextRoundMatches[nextMatchIndex];

        if (nextMatch) {
          const isSlot1 = matchIndex % 2 === 0;
          const isDoubles = match.matchType === 'DOUBLES' || Boolean(match.team1Id || match.team2Id);

          // Advance winner into the correct slot of the next match
          if (isDoubles) {
            const finalTeamWinnerId = winnerTeamId || winnerId;
            await prisma.match.update({
              where: { id: nextMatch.id },
              data: isSlot1 ? { team1Id: finalTeamWinnerId } : { team2Id: finalTeamWinnerId }
            });
          } else {
            await prisma.match.update({
              where: { id: nextMatch.id },
              data: isSlot1 ? { player1Id: winnerId } : { player2Id: winnerId }
            });
          }
          

        }
      }
    }
  }

  console.log("Updated match:", matchId, "| data:", updateData);
  
  sendResponse(res, 200, 'Match updated successfully', match);
});

// Reset knockout matches while preserving the original draw
export const deleteKnockoutMatches = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId, categoryId } = req.params;

  const category = await prisma.category.findFirst({
    where: { id: categoryId, tournamentId },
  });

  if (!category) {
    throw new AppError('Category not found in this tournament', 404);
  }

  const knockoutRounds = [
    'Round of 128',
    'Round of 64',
    'Round of 32',
    'Round of 16',
    'Quarter-Finals',
    'Quarter-final',
    'Semi-Finals',
    'Semi-final',
    'Final',
    'Finals',
  ];

  const knockoutMatches = await prisma.match.findMany({
    where: {
      tournamentId,
      categoryId,
      round: { in: knockoutRounds },
    },
    orderBy: { matchNumber: 'asc' },
  });

  if (knockoutMatches.length === 0) {
    throw new AppError('No knockout bracket found to reset', 400);
  }

  // The reset should not silently leave an incomplete bracket.
  const finals = knockoutMatches.filter(
    m => m.round === 'Final' || m.round === 'Finals'
  );

  if (finals.length !== 1) {
    throw new AppError(
      'Knockout bracket is incomplete: expected exactly one Final. Regenerate or repair the bracket before resetting.',
      400
    );
  }

  const roundOrder = (round: string): number => {
    if (round === 'Final' || round === 'Finals') return 1000;
    if (round === 'Semi-Finals' || round === 'Semi-final') return 999;
    if (round === 'Quarter-Finals' || round === 'Quarter-final') return 998;

    const match = round.match(/^Round of (\d+)$/);
    if (match) {
      return 1000 - Number(match[1]);
    }

    return -1;
  };

  const firstRoundRank = Math.min(
    ...knockoutMatches.map(m => roundOrder(m.round))
  );

  const firstRoundMatches = knockoutMatches.filter(
    m => roundOrder(m.round) === firstRoundRank
  );

  const isDoubles =
    category.type === 'DOUBLES' ||
    category.type === 'MIXED_DOUBLES';

  // Capture initial participants and BYE winners before clearing results.
  const byeMatches = firstRoundMatches.filter(m =>
    m.score === 'BYE' ||
    (
      m.status === 'COMPLETED' &&
      (isDoubles
        ? Boolean(m.team1Id) !== Boolean(m.team2Id)
        : Boolean(m.player1Id) !== Boolean(m.player2Id))
    )
  );

  const byeIds = new Set(byeMatches.map(m => m.id));

  const rounds = [...new Set(knockoutMatches.map(m => m.round))]
    .sort((a, b) => roundOrder(a) - roundOrder(b));

  await prisma.$transaction(async tx => {
    // Only delete games belonging to knockout matches.
    await tx.game.deleteMany({
      where: {
        matchId: { in: knockoutMatches.map(m => m.id) },
      },
    });

    // Remove old third-place playoff matches and their games.
    const playoffs = await tx.match.findMany({
      where: {
        tournamentId,
        categoryId,
        round: '3rd Place Playoff',
      },
      select: { id: true },
    });

    if (playoffs.length > 0) {
      await tx.game.deleteMany({
        where: { matchId: { in: playoffs.map(m => m.id) } },
      });

      await tx.match.deleteMany({
        where: { id: { in: playoffs.map(m => m.id) } },
      });
    }

    // Reset every knockout match.
    for (const match of knockoutMatches) {
      const isFirstRound =
        roundOrder(match.round) === firstRoundRank;
      const isBye = byeIds.has(match.id);

      const byeWinnerId = isBye
        ? (match.player1Id ?? match.player2Id)
        : null;

      const byeWinnerTeamId = isBye
        ? (match.team1Id ?? match.team2Id)
        : null;

      await tx.match.update({
        where: { id: match.id },
        data: {
          status: isBye ? 'COMPLETED' : 'SCHEDULED',
          score: isBye ? 'BYE' : null,
          winnerId: isBye ? byeWinnerId : null,
          winnerTeamId: isBye ? byeWinnerTeamId : null,
          startTime: null,
          endTime: null,
          resultDetails: Prisma.DbNull,
          ...(isFirstRound
            ? {}
            : {
                player1Id: null,
                player2Id: null,
                team1Id: null,
                team2Id: null,
              }),
        },
      });
    }

    // Restore BYE winners into the next round.
    if (rounds.length > 1 && byeMatches.length > 0) {
      const firstRound = rounds[0];
      const nextRound = rounds[1];

      const orderedFirstRound = knockoutMatches
        .filter(m => m.round === firstRound)
        .sort((a, b) => a.matchNumber - b.matchNumber);

      const orderedNextRound = knockoutMatches
        .filter(m => m.round === nextRound)
        .sort((a, b) => a.matchNumber - b.matchNumber);

      for (const bye of byeMatches) {
        const matchIndex = orderedFirstRound.findIndex(
          m => m.id === bye.id
        );

        if (matchIndex === -1) continue;

        const nextMatch = orderedNextRound[Math.floor(matchIndex / 2)];
        if (!nextMatch) continue;

        const firstSlot = matchIndex % 2 === 0;

        if (isDoubles) {
          const winnerTeamId = bye.team1Id ?? bye.team2Id;

          await tx.match.update({
            where: { id: nextMatch.id },
            data: firstSlot
              ? { team1Id: winnerTeamId }
              : { team2Id: winnerTeamId },
          });
        } else {
          const winnerId = bye.player1Id ?? bye.player2Id;

          await tx.match.update({
            where: { id: nextMatch.id },
            data: firstSlot
              ? { player1Id: winnerId }
              : { player2Id: winnerId },
          });
        }
      }
    }
  });

  sendResponse(res, 200, 'Knockout stage reset successfully');
});

// Update match and automatically advance winner to next round
export const updateMatchAndAdvance = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { player1Score, player2Score } = req.body;
  
  if (req.user?.role === 'REFEREE') {
  const existingMatch = await prisma.match.findUnique({
    where: { id: matchId },
    include: { referee: true },
  });

  if (!existingMatch) {
    throw new AppError('Match not found', 404);
  }

  if (existingMatch.referee?.userId !== req.user.id) {
    throw new AppError(
      'You can only record scores for matches assigned to you',
      403
    );
  }

  if (
    existingMatch.status === 'COMPLETED' ||
    existingMatch.status === 'WALKOVER'
  ) {
    throw new AppError(
      'Completed match results can only be edited by an admin',
      403
    );
  }
}

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
// Correct a completed knockout match (Admin only)
export const correctCompletedMatch = catchAsync(
  async (req: Request, res: Response) => {
    const { matchId } = req.params;
    const { games, bestOf, reason } = req.body;

    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Only admins can correct completed matches', 403);
    }

    const correctedMatch = await matchService.correctCompletedMatch(
      req.user.id,
      matchId,
      games,
      bestOf,
      reason
    );

    sendResponse(
      res,
      200,
      'Completed match score corrected successfully',
      correctedMatch
    );
  }
);

