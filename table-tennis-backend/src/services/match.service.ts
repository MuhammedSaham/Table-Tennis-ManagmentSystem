import { any } from 'zod';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';

// ── Shared type so knockout + group matches can live in the same array ─────────
interface NormalizedMatch {
  id: string;
  round: string;
  matchNumber: number;
  scheduledTime: Date;
  startTime?: Date | null;
  endTime?: Date | null;
  status: string;
  score: string | null;
  winnerId: string | null;
  player1: { id: string; firstName: string; lastName: string } | null;
  player2: { id: string; firstName: string; lastName: string } | null;
  tournament: { id: string; name: string; venue: string };
  category: { name: string; type: string };
  isGroupMatch?: boolean;
  bestOf?: number;
  game1player1?: number | null;
  game1player2?: number | null;
  game2player1?: number | null;
  game2player2?: number | null;
  game3player1?: number | null;
  game3player2?: number | null;
  game4player1?: number | null;
  game4player2?: number | null;
  game5player1?: number | null;
  game5player2?: number | null;
}

export class MatchService {
  // Create match (Admin only)
  async createMatch(adminId: string, data: {
    tournamentId: string;
    categoryId: string;
    matchType: 'SINGLES' | 'DOUBLES' | 'TEAM';
    player1Id?: string;
    player2Id?: string;
    team1Id?: string;
    team2Id?: string;
    refereeId?: string;
    round: string;
    matchNumber: number;
    scheduledTime: Date;
  }) {
    const admin = await prisma.adminProfile.findUnique({ where: { userId: adminId } });
    if (!admin) throw new AppError('Only admins can create matches', 403);

    const tournament = await prisma.tournament.findUnique({ where: { id: data.tournamentId } });
    if (!tournament) throw new AppError('Tournament not found', 404);

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new AppError('Category not found', 404);

    if (data.matchType !== 'TEAM') {
      if (data.player1Id) {
        const player1 = await prisma.user.findFirst({ where: { id: data.player1Id, role: 'PLAYER' } });
        if (!player1) throw new AppError('Player 1 not found', 404);
      }
      if (data.player2Id) {
        const player2 = await prisma.user.findFirst({ where: { id: data.player2Id, role: 'PLAYER' } });
        if (!player2) throw new AppError('Player 2 not found', 404);
      }
    }

    if (data.matchType === 'TEAM') {
      if (data.team1Id) {
        const team1 = await prisma.team.findUnique({ where: { id: data.team1Id } });
        if (!team1) throw new AppError('Team 1 not found', 404);
      }
      if (data.team2Id) {
        const team2 = await prisma.team.findUnique({ where: { id: data.team2Id } });
        if (!team2) throw new AppError('Team 2 not found', 404);
      }
    }

    if (data.refereeId) {
      const referee = await prisma.refereeProfile.findUnique({ where: { id: data.refereeId } });
      if (!referee) throw new AppError('Referee not found', 404);
    }

    const match = await prisma.match.create({
      data,
      include: {
        player1: { select: { firstName: true, lastName: true } },
        player2: { select: { firstName: true, lastName: true } },
        team1: { select: { name: true } },
        team2: { select: { name: true } },
        referee: { include: { user: { select: { firstName: true, lastName: true } } } },
        tournament: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    return match;
  }

  // Get player performance stats
  async getPlayerPerformanceStats(playerId: string) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
        status: 'COMPLETED',
      },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true } },
        player2: { select: { id: true, firstName: true, lastName: true } },
        tournament: { select: { id: true, name: true } },
        category: { select: { name: true } },
        games: true,
      },
      orderBy: { endTime: 'desc' },
    });

    const groupMatches = await prisma.groupMatch.findMany({
    where: {
      OR: [{ player1Id: playerId }, { player2Id: playerId }],
      status: 'COMPLETED',
    },
  }) as any[];

    let wins = 0;
    let losses = 0;
    let totalGamesWon = 0;
    let totalGamesLost = 0;
    let totalPointsScored = 0;
    let totalPointsConceded = 0;

    for (const match of matches) {
      if (match.winnerId === playerId) {
        wins++;
      } else {
        losses++;
      }

      for (const game of match.games) {
        const isPlayer1 = match.player1Id === playerId;
        const playerScore = isPlayer1 ? game.player1Score : game.player2Score;
        const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;

        totalPointsScored += playerScore;
        totalPointsConceded += opponentScore;

        if (playerScore > opponentScore) {
          totalGamesWon++;
        } else {
          totalGamesLost++;
        }
      }
    }
    for (const gm of groupMatches){
      if(gm.winnerId === playerId){
        wins++;
      }
      else{
        losses++;
      }
      const isPlayer1 = gm.player1Id === playerId;
      for (let i = 1; i<= 5; i++){
        const Player1Score = gm[`game${i}player1`];
        const Player2Score = gm[`game${i}player2`];
        if(Player1Score === null || Player2Score === null) continue;
        const playerScore = isPlayer1 ? Player1Score : Player2Score;
        const opponentScore = isPlayer1 ? Player2Score : Player1Score;
        totalPointsScored += playerScore;
        totalPointsConceded += opponentScore;
        if(playerScore > opponentScore){
          totalGamesWon++;
        }
        else{
          totalGamesLost++;
        }
      }
    }

    const totalMatches = matches.length + groupMatches.length;
    const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0';
    const averagePointsPerGame =
      totalGamesWon + totalGamesLost > 0
        ? (totalPointsScored / (totalGamesWon + totalGamesLost)).toFixed(1)
        : '0';

    const recentMatches = matches.slice(0, 5).map(match => ({
      id: match.id,
      tournamentName: match.tournament.name,
      categoryName: match.category.name,
      opponent:
        match.player1Id === playerId
          ? `${match.player2?.firstName ?? ''} ${match.player2?.lastName ?? ''}`
          : `${match.player1?.firstName ?? ''} ${match.player1?.lastName ?? ''}`,
      result: match.winnerId === playerId ? 'Win' : 'Loss',
      score: match.score ?? null,
      date: match.endTime,
    }));

    return {
      totalMatches,
      wins,
      losses,
      winRate: `${winRate}%`,
      gamesStats: {
        won: totalGamesWon,
        lost: totalGamesLost,
        total: totalGamesWon + totalGamesLost,
      },
      pointsStats: {
        scored: totalPointsScored,
        conceded: totalPointsConceded,
        averagePerGame: averagePointsPerGame,
      },
      recentMatches,
      allMatches: matches,
    };
  }

  // Get all matches for a tournament
  async getTournamentMatches(tournamentId: string, status?: string, categoryId?: string) {
    const whereClause: any = { tournamentId };
    if (status) whereClause.status = status;
    if (categoryId) whereClause.categoryId = categoryId;

    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        player1: { select: { id: true, firstName: true, lastName: true } },
        player2: { select: { id: true, firstName: true, lastName: true } },
        team1: {
          select: {
            id: true,
            name: true,
            members: {
              include: {
                player: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
        team2: {
          select: {
            id: true,
            name: true,
            members: {
              include: {
                player: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
        referee: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        category: { select: { name: true, type: true } },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    return matches;
  }


  // Get matches for a specific player (knockout + group stage combined)
  async getPlayerMatches(playerId: string): Promise<NormalizedMatch[]> {
    // ── Knockout matches ────────────────────────────────────────────────────────
    const knockoutMatches = await prisma.match.findMany({
      where: {
        OR: [{ player1Id: playerId }, { player2Id: playerId }, { team1: { members: { some: { playerId, isActive: true } } } }, { team2: { members: { some: { playerId, isActive: true } } } }],
      },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true } },
        player2: { select: { id: true, firstName: true, lastName: true } },
        team1: {
          include:{
            members:{
              include:{player:{select:{id:true,firstName:true,lastName:true}}}
            }
          },
        },
        team2: {
          include:{
            members:{
              include:{player:{select:{id:true,firstName:true,lastName:true}}}
            }
          },
        },
        tournament: { select: { id: true, name: true, venue: true } },
        category: { select: { name: true, type: true } },
        referee: { include: { user: { select: { firstName: true, lastName: true } } } },

      },
      orderBy: { scheduledTime: 'asc' },
    });

    // ── Group stage matches ─────────────────────────────────────────────────────
    const groupMatches = await prisma.groupMatch.findMany({
  where: {
    OR: [{ player1Id: playerId }, { player2Id: playerId }, { team1: { members: { some: { playerId, isActive: true } } } }, { team2: { members: { some: { playerId, isActive: true } } } }],
  },
  include: {                                          // ← use include not select
    player1: { select: { id: true, firstName: true, lastName: true } },
    player2: { select: { id: true, firstName: true, lastName: true } },
    group: {
      include: {                                      // ← include inside group too
        tournament: { select: { id: true, name: true, venue: true } },
        category: { select: { name: true, type: true } },
      },
    },
  },

});

    // Show approved registrations before brackets or groups have been generated.
    const registrations = await prisma.tournamentRegistration.findMany({
      where: { playerId, status: { in: ['PENDING', 'APPROVED'] } },
      include: {
        tournament: { select: { id: true, name: true, venue: true, startDate: true } },
        category: { select: { id: true, name: true, type: true } },
        player: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const generatedFixtureKeys = new Set([
      ...knockoutMatches.map(match => `${match.tournamentId}:${match.categoryId ?? ''}`),
      ...groupMatches.map((match: any) => `${match.group?.tournamentId ?? ''}:${match.group?.categoryId ?? ''}`),
    ]);

    const pendingRegistrations: NormalizedMatch[] = registrations
      .filter(registration => !generatedFixtureKeys.has(`${registration.tournamentId}:${registration.categoryId ?? ''}`))
      .map(registration => ({
        id: `registration-${registration.id}`,
        round: 'Awaiting Fixture',
        matchNumber: 0,
        scheduledTime: registration.tournament.startDate,
        status: 'SCHEDULED',
        score: null,
        winnerId: null,
        player1: registration.player,
        player2: null,
        tournament: {
          id: registration.tournament.id,
          name: registration.tournament.name,
          venue: registration.tournament.venue,
        },
        category: registration.category ?? { name: 'Tournament Entry', type: '' },
      }));

    // ── Normalize knockout matches ───────────────────────────────────────────────
    const normalizedKnockout: NormalizedMatch[] = knockoutMatches.map(match => ({
      id: match.id,
      round: match.round,
      matchNumber: match.matchNumber,
      scheduledTime: match.scheduledTime,
      status: match.status,
      score: match.score ?? null,
      winnerId: match.winnerId ?? null,
      player1: match.player1
        ? { id: match.player1.id, firstName: match.player1.firstName, lastName: match.player1.lastName }
        : null,
      player2: match.player2
        ? { id: match.player2.id, firstName: match.player2.firstName, lastName: match.player2.lastName }
        : null,
      team1: match.team1,
      team2: match.team2,
      tournament: match.tournament ?? { id: '', name: '', venue: '' },
      category: match.category ?? { name: '', type: '' },
    }));

    // ── Normalize group matches ─────────────────────────────────────────────────
   const normalizedGroup: NormalizedMatch[] = groupMatches.map((match: any) => ({
  id: match.id,
  round: `Group Stage - ${match.group?.name ?? ''}`,
  matchNumber: match.round ?? 1,
  scheduledTime: match.scheduledTime,
  status: match.status,
  score:
    match.player1Score !== null && match.player2Score !== null
      ? `${match.player1Score} - ${match.player2Score}`
      : null,
  winnerId: match.winnerId ?? null,
  player1: match.player1
    ? { id: match.player1.id, firstName: match.player1.firstName, lastName: match.player1.lastName }
    : null,
  player2: match.player2
    ? { id: match.player2.id, firstName: match.player2.firstName, lastName: match.player2.lastName }
    : null,
  tournament: match.group?.tournament ?? { id: '', name: '', venue: '' },
  category: match.group?.category ?? { name: '', type: '' },
  }));
    // ── Combine and sort descending by date ─────────────────────────────────────
    const allMatches: NormalizedMatch[] = [
      ...normalizedKnockout,
      ...normalizedGroup,
      ...pendingRegistrations,
    ];
    allMatches.sort(
      (a, b) =>
        new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime(),
    );

    return allMatches;
  }

  // Get matches for a specific referee
  async getRefereeMatches(refereeUserId: string) {
    const referee = await prisma.refereeProfile.findUnique({
      where: { userId: refereeUserId },
    });
    if (!referee) throw new AppError('Referee profile not found', 404);

    const matches = await prisma.match.findMany({
      where: { refereeId: referee.id },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true } },
        player2: { select: { id: true, firstName: true, lastName: true } },
        team1: { select: { id: true, name: true } },
        team2: { select: { id: true, name: true } },
        tournament: { select: { id: true, name: true, venue: true } },
        category: { select: { name: true, type: true } },
      },
    });

    const groupMatches = await prisma.groupMatch.findMany({
  where: { refereeId: referee.id },
  include: {
    player1: {
      select: { id: true, firstName: true, lastName: true },
    },
    player2: {
      select: { id: true, firstName: true, lastName: true },
    },
    team1: {
      select: {
        id: true,
        name: true,
        members: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    },
    team2: {
      select: {
        id: true,
        name: true,
        members: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    },
    group: {
      include: {
        tournament: {
          select: { id: true, name: true, venue: true },
        },
        category: {
          select: { name: true, type: true },
        },
      },
    },
  },
});

    const normalizedKnockout: NormalizedMatch[] = matches.map((match) => ({
      id: match.id,
      round: match.round,
      matchNumber: match.matchNumber,
      scheduledTime: match.scheduledTime,

      startTime: match.startTime,
      endTime: match.endTime,

      status: match.status,
      score: match.score ?? null,
      winnerId: match.winnerId ?? null,
      player1: match.player1
        ? { id: match.player1.id, firstName: match.player1.firstName, lastName: match.player1.lastName }
        : null,
      player2: match.player2
        ? { id: match.player2.id, firstName: match.player2.firstName, lastName: match.player2.lastName }
        : null,
      team1: match.team1,
      team2: match.team2,
      tournament: match.tournament ?? { id: '', name: '', venue: '' },
      category: match.category ?? { name: '', type: '' },
      isGroupMatch: false,
    }));

   const groupMatchNumbers = new Map<string, number>();
const matchNumbersById = new Map<string, number>();

for (const match of groupMatches) {
  const number = (groupMatchNumbers.get(match.groupId) ?? 0) + 1;
  groupMatchNumbers.set(match.groupId, number);
  matchNumbersById.set(match.id, number);
}

    const normalizedGroup: NormalizedMatch[] = groupMatches.map((match: any) => ({
      id: match.id,
      round: `Group Stage - ${match.group?.name ?? ''}`,
      matchNumber: matchNumbersById.get(match.id) ?? 1,
      scheduledTime: match.scheduledTime,
      status: match.status,
      score: match.player1Score !== null && match.player2Score !== null
        ? `${match.player1Score} - ${match.player2Score}`
        : null,
      winnerId: match.winnerId ?? null,
      player1: match.player1
        ? { id: match.player1.id, firstName: match.player1.firstName, lastName: match.player1.lastName }
        : null,
      player2: match.player2
        ? { id: match.player2.id, firstName: match.player2.firstName, lastName: match.player2.lastName }
        : null,

      team1: match.team1,
      team2: match.team2,
      startTime: match.startTime,
      endTime: match.endTime,
      tournament: match.group?.tournament ?? { id: '', name: '', venue: '' },
      category: match.group?.category ?? { name: '', type: '' },
      isGroupMatch: true,
      bestOf: match.bestOf,
      game1player1: match.game1player1,
      game1player2: match.game1player2,
      game2player1: match.game2player1,
      game2player2: match.game2player2,
      game3player1: match.game3player1,
      game3player2: match.game3player2,
      game4player1: match.game4player1,
      game4player2: match.game4player2,
      game5player1: match.game5player1,
      game5player2: match.game5player2,
    }));

    const allMatches: NormalizedMatch[] = [...normalizedKnockout, ...normalizedGroup];
    allMatches.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

    return allMatches;
  }

  // Get match by ID
  async getMatchById(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true, email: true } },
        player2: { select: { id: true, firstName: true, lastName: true, email: true } },
        team1: {
          include: {
            members: { include: { player: { select: { firstName: true, lastName: true } } } },
          },
        },
        team2: {
          include: {
            members: { include: { player: { select: { firstName: true, lastName: true } } } },
          },
        },
        referee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        tournament: true,
        category: true,
        games: { orderBy: { gameNumber: 'asc' } },
      },
    });

    if (!match) throw new AppError('Match not found', 404);
    return match;
  }

  // Update match status (Admin/Referee)
  async updateMatchStatus(
    userId: string,
    userRole: string,
    matchId: string,
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'WALKOVER',
  ) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { referee: true },
    });
    if (!match) throw new AppError('Match not found', 404);

    if (userRole === 'REFEREE' && match.referee?.userId !== userId) {
      throw new AppError('You can only update matches assigned to you', 403);
    } else if (userRole !== 'ADMIN' && userRole !== 'REFEREE') {
      throw new AppError('Only admins and referees can update match status', 403);
    }
    // Referees cannot change the status of a finished match
if (
  userRole === 'REFEREE' &&
  (match.status === 'COMPLETED' || match.status === 'WALKOVER')
) {
  throw new AppError(
    'Only admins can change the status of completed matches',
    403
  );
}

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status,
        startTime: status === 'ONGOING' ? new Date() : undefined,
        endTime: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    return updatedMatch;
  }

  // Assign referee to match (Admin only)
  async assignReferee(adminId: string, matchId: string, refereeUserId: string) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      throw new AppError('Only admins can assign referees', 403);
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new AppError('Match not found', 404);

    const referee = await prisma.refereeProfile.findUnique({ where: { userId: refereeUserId } });
    if (!referee) throw new AppError('Referee not found', 404);

    return await prisma.match.update({
      where: { id: matchId },
      data: { refereeId: referee.id },
    });
  }

  // Record game scores (Admin/Referee)
  async recordGameScores(
    userId: string,
    userRole: string,
    matchId: string,
    games: { gameNumber: number; player1Score: number; player2Score: number }[],
  ) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { referee: true },
    });
    if (!match) throw new AppError('Match not found', 404);

    if (userRole === 'REFEREE' && match.referee?.userId !== userId) {
      throw new AppError('You can only record scores for matches assigned to you', 403);
    } else if (userRole !== 'ADMIN' && userRole !== 'REFEREE') {
      throw new AppError('Only admins and referees can record match scores', 403);
    }

    // Only admins can correct completed or walkover match results
if (
  (match.status === 'COMPLETED' || match.status === 'WALKOVER') &&
  userRole !== 'ADMIN'
) {
  throw new AppError(
    'Completed match results can only be edited by an admin',
    403
  );
}

// Other match statuses cannot be scored
if (
  !['SCHEDULED', 'ONGOING', 'COMPLETED', 'WALKOVER'].includes(match.status)
) {
  throw new AppError('This match cannot be scored', 400);
}

    let player1Id: string | null = null;
    let player2Id: string | null = null;
    let team1Id: string | null = null;
    let team2Id: string | null = null;

    // Null-guard player IDs — required for game winner assignment
    if (match.matchType === 'SINGLES') {
    if (!match.player1Id || !match.player2Id) {
      throw new AppError('Match is missing player assignments', 400);
    }

    player1Id = match.player1Id;
    player2Id = match.player2Id;
  }
  if (match.matchType !== 'SINGLES') {
    if (!match.team1Id || !match.team2Id) {
      throw new AppError('Match is missing team assignments', 400);
    }

    team1Id = match.team1Id;
    team2Id = match.team2Id;
  }

    // Replace existing games
    await prisma.game.deleteMany({ where: { matchId } });

    await prisma.game.createMany({
      data: games.map(game => ({
        matchId,
        gameNumber: game.gameNumber,
        player1Score: game.player1Score,
        player2Score: game.player2Score,
        winnerId:match.matchType === 'SINGLES'? (game.player1Score > game.player2Score ? player1Id : player2Id) : null,
      })),
    });

    // Determine match winner
    let player1Wins = 0;
    let player2Wins = 0;
    for (const game of games) {
      if (game.player1Score > game.player2Score) player1Wins++;
      else player2Wins++;
    }

    let winnerId: string | null = null;
    let winnerTeamId: string | null = null;
    if (match.matchType === 'SINGLES') {
      winnerId = player1Wins > player2Wins ? player1Id : player2Id;
    } 
    if (match.matchType !== 'SINGLES') {
      winnerTeamId = team1Id && team2Id ? (player1Wins > player2Wins ? team1Id : team2Id) : null;
      winnerId = winnerTeamId;
    }

    const scoreString = games.map(g => `${g.player1Score}-${g.player2Score}`).join(', ');

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        winnerTeamId,
        score: scoreString,
        status: 'COMPLETED',
        endTime: new Date(),
        resultDetails: { games, player1Wins, player2Wins, totalGames: games.length },
      },
      include: {
        player1: { select: { firstName: true, lastName: true } },
        player2: { select: { firstName: true, lastName: true } },
      },
    });

    // Notify both players
    if(match.matchType === 'SINGLES'){
      await prisma.notification.createMany({
      data: [
        {
          userId: player1Id!,
          type: 'MATCH_RESULT',
          title: 'Match Result Available',
          message: `Your match against ${updatedMatch.player2?.firstName ?? ''} ${updatedMatch.player2?.lastName ?? ''} has been completed. Result: ${scoreString}`,
        },
        {
          userId: player2Id!,
          type: 'MATCH_RESULT',
          title: 'Match Result Available',
          message: `Your match against ${updatedMatch.player1?.firstName ?? ''} ${updatedMatch.player1?.lastName ?? ''} has been completed. Result: ${scoreString}`,
        },
      ],
    });
    }
    
    return updatedMatch;
  }

  // Get match results
  async getMatchResults(matchId: string, userId: string, userRole: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true, email: true } },
        player2: { select: { id: true, firstName: true, lastName: true, email: true } },
        team1: {include: {members:{select:{playerId:true,isActive:true}}}},
        team2: {include: {members:{select:{playerId:true,isActive:true}}}},
        referee: { include: { user: { select: { firstName: true, lastName: true } } } },
        tournament: { select: { name: true } },
        category: { select: { name: true } },
        games: { orderBy: { gameNumber: 'asc' } },
      },
    });

    if (!match) throw new AppError('Match not found', 404);

    const isParticipant = match.player1Id === userId || match.player2Id === userId || match.team1?.members?.some(member => member.playerId === userId && member.isActive) || match.team2?.members.some(member => member.playerId === userId && member.isActive);
    const isReferee = match.referee?.userId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isParticipant && !isReferee && !isAdmin) {
      throw new AppError('You do not have permission to view this match', 403);
    }

    if (match.status !== 'COMPLETED') {
      // Return without game details if not yet completed
      const { games: _games, ...basicInfo } = match;
      return {
        ...basicInfo,
        message: 'Match is not yet completed. Results will be available after the match.',
      };
    }

    return match;
  }

  // Get player match history
  async getPlayerMatchHistory(playerId: string) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
        status: 'COMPLETED',
      },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true } },
        player2: { select: { id: true, firstName: true, lastName: true } },
        tournament: { select: { name: true } },
        category: { select: { name: true } },
        games: true,
      },
      orderBy: { endTime: 'desc' },
    });

    let wins = 0;
    let losses = 0;
    let totalGamesWon = 0;
    let totalGamesLost = 0;

    for (const match of matches) {
      if (match.winnerId === playerId) {
        wins++;
      } else {
        losses++;
      }

      for (const game of match.games) {
        const isPlayer1 = match.player1Id === playerId;
        const playerScore = isPlayer1 ? game.player1Score : game.player2Score;
        const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;

        if (playerScore > opponentScore) totalGamesWon++;
        else totalGamesLost++;
      }
    }

    return {
      matches,
      statistics: {
        totalMatches: matches.length,
        wins,
        losses,
        winRate: matches.length > 0 ? ((wins / matches.length) * 100).toFixed(2) : '0',
        totalGamesWon,
        totalGamesLost,
      },
    };
  }
  
  async correctCompletedMatch(
  adminId: string,
  matchId: string,
  games: {
    gameNumber: number;
    player1Score: number;
    player2Score: number;
  }[],
  bestOf: number,
  reason: string
) {
  // 1. Confirm admin permission
  const admin = await prisma.adminProfile.findUnique({
    where: { userId: adminId },
  });

  if (!admin) {
    throw new AppError('Only admins can correct match scores', 403);
  }

  // 2. Find the existing match
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    throw new AppError('Match not found', 404);
  }

  // 3. Only completed matches can be corrected
  if (match.status !== 'COMPLETED') {
    throw new AppError(
      'Only completed matches can be corrected',
      400
    );
  }

  // 4. Require a correction reason
  if (typeof reason !== 'string' || reason.trim().length < 5) {
    throw new AppError(
      'Please provide a correction reason (at least 5 characters)',
      400
    );
  }

  // 5. Validate match format
  if (bestOf !== 3 && bestOf !== 5) {
    throw new AppError('Best of must be 3 or 5', 400);
  }

  // 6. Validate games
  if (!Array.isArray(games) || games.length === 0 || games.length > bestOf) {
    throw new AppError('Invalid number of games', 400);
  }

  let player1Wins = 0;
  let player2Wins = 0;
  const winsNeeded = Math.ceil(bestOf / 2);

  for (const [index, game] of games.entries()) {
    if (
      game.gameNumber !== index + 1 ||
      !Number.isInteger(game.player1Score) ||
      !Number.isInteger(game.player2Score) ||
      game.player1Score < 0 ||
      game.player2Score < 0
    ) {
      throw new AppError(`Invalid score for game ${index + 1}`, 400);
    }

    const high = Math.max(game.player1Score, game.player2Score);
    const low = Math.min(game.player1Score, game.player2Score);

    if (
      high < 11 ||
      (high === 11 && low > 9) ||
      (high > 11 && high - low !== 2)
    ) {
      throw new AppError(
        `Game ${index + 1} must be won by at least 2 points`,
        400
      );
    }

    if (player1Wins >= winsNeeded || player2Wins >= winsNeeded) {
      throw new AppError(
        'Extra games cannot be recorded after a match winner is decided',
        400
      );
    }

    if (game.player1Score > game.player2Score) {
      player1Wins++;
    } else {
      player2Wins++;
    }
  }

  if (Math.max(player1Wins, player2Wins) !== winsNeeded) {
    throw new AppError(
      `The winning player or team must win ${winsNeeded} games`,
      400
    );
  }

  // Determine the winner from corrected game scores
const player1Won = player1Wins > player2Wins;

const correctedWinnerId =
  match.matchType === 'SINGLES'
    ? (player1Won ? match.player1Id : match.player2Id)
    : (player1Won ? match.team1Id : match.team2Id);

// For now, prevent changing the winner.
// Winner-changing corrections need additional bracket protection.
const existingWinnerId =
  match.matchType === 'SINGLES'
    ? match.winnerId
    : match.winnerTeamId ?? match.winnerId;

if (!correctedWinnerId || !existingWinnerId) {
  throw new AppError(
    'Unable to identify the match winner',
    400
  );
}

const winnerChanged = correctedWinnerId !== existingWinnerId;

// Save the corrected scores and match result together
const correctedMatch = await prisma.$transaction(async (tx) => {
  // Recheck the match inside the transaction
  const currentMatch = await tx.match.findUnique({
    where: { id: matchId },
  });

  if (!currentMatch || currentMatch.status !== 'COMPLETED') {
    throw new AppError(
      'Match is no longer available for correction',
      400
    );
  }

  const currentWinnerId =
    currentMatch.matchType === 'SINGLES'
      ? currentMatch.winnerId
      : currentMatch.winnerTeamId ?? currentMatch.winnerId;

  if (currentWinnerId !== existingWinnerId) {
  throw new AppError(
    'The match winner was changed by another request. Please reload and try again.',
    409
  );
}

// Identify the next knockout round
const nextRoundMap: Record<string, string> = {
  'Round of 128': 'Round of 64',
  'Round of 64': 'Round of 32',
  'Round of 32': 'Round of 16',
  'Round of 16': 'Quarter-Finals',
  'Quarter-Finals': 'Semi-Finals',
  'Quarter-final': 'Semi-final',
  'Semi-Finals': 'Final',
  'Semi-final': 'Final',
};

const nextRound = nextRoundMap[currentMatch.round];

let nextMatch: typeof currentMatch | null = null;
let thirdPlaceMatch: typeof currentMatch | null = null;
let isSlot1 = false;

if (winnerChanged && nextRound) {
  const currentRoundMatches = await tx.match.findMany({
    where: {
      tournamentId: currentMatch.tournamentId,
      categoryId: currentMatch.categoryId,
      round: currentMatch.round,
    },
    orderBy: { matchNumber: 'asc' },
  });

  const matchIndex = currentRoundMatches.findIndex(
    (m) => m.id === currentMatch.id
  );

  if (matchIndex === -1) {
    throw new AppError('Cannot determine bracket position', 400);
  }

  isSlot1 = matchIndex % 2 === 0;

  const nextRoundMatches = await tx.match.findMany({
    where: {
      tournamentId: currentMatch.tournamentId,
      categoryId: currentMatch.categoryId,
      round: nextRound,
    },
    orderBy: { matchNumber: 'asc' },
  });

  nextMatch = nextRoundMatches[Math.floor(matchIndex / 2)] ?? null;

  if (!nextMatch) {
    throw new AppError(
      'Next-round match not found. Winner correction was not saved.',
      400
    );
  }

  if (
    nextMatch.status !== 'SCHEDULED' ||
    nextMatch.startTime !== null ||
    nextMatch.endTime !== null ||
    nextMatch.score !== null ||
    nextMatch.winnerId !== null ||
    nextMatch.winnerTeamId !== null
  ) {
    throw new AppError(
      'Cannot change the winner because the next-round match has already started or contains a result.',
      400
    );
  }

  if (nextRound === 'Final') {
    thirdPlaceMatch = await tx.match.findFirst({
      where: {
        tournamentId: currentMatch.tournamentId,
        categoryId: currentMatch.categoryId,
        round: '3rd Place Playoff',
      },
    });

    if (
      thirdPlaceMatch &&
      (
        thirdPlaceMatch.status !== 'SCHEDULED' ||
        thirdPlaceMatch.startTime !== null ||
        thirdPlaceMatch.endTime !== null ||
        thirdPlaceMatch.score !== null ||
        thirdPlaceMatch.winnerId !== null ||
        thirdPlaceMatch.winnerTeamId !== null
      )
    ) {
      throw new AppError(
        'Cannot change the semifinal winner because the third-place playoff has already started or contains a result.',
        400
      );
    }
  }
}

  // Preserve existing result details
  const previousDetails =
    currentMatch.resultDetails &&
    typeof currentMatch.resultDetails === 'object' &&
    !Array.isArray(currentMatch.resultDetails)
      ? { ...currentMatch.resultDetails }
      : {};

  // Record the correction for future reference
  const previousCorrections = Array.isArray(previousDetails.corrections)
    ? previousDetails.corrections
    : [];

  const correctionRecord = {
    correctedBy: adminId,
    correctedAt: new Date().toISOString(),
    reason: reason.trim(),
    previousScore: currentMatch.score,
    previousWinnerId: existingWinnerId,
correctedWinnerId,
    correctedScore: games
      .map((game) => `${game.player1Score}-${game.player2Score}`)
      .join(', '),
  };

  // Update bracket participants when the corrected winner changes
if (winnerChanged && nextMatch) {
  const isSingles = currentMatch.matchType === 'SINGLES';

  const nextSlot = isSingles
    ? (isSlot1 ? 'player1Id' : 'player2Id')
    : (isSlot1 ? 'team1Id' : 'team2Id');

  // Verify the next-round slot still contains the original winner
  if (nextMatch[nextSlot] !== existingWinnerId) {
    throw new AppError(
      'The next-round participant does not match the original winner. Please review the bracket.',
      409
    );
  }

  await tx.match.update({
    where: { id: nextMatch.id },
    data: isSingles
      ? isSlot1
        ? { player1Id: correctedWinnerId }
        : { player2Id: correctedWinnerId }
      : isSlot1
        ? { team1Id: correctedWinnerId }
        : { team2Id: correctedWinnerId },
  });

  // A semifinal correction also changes the third-place participant
  if (thirdPlaceMatch) {
    const correctedLoserId = isSingles
      ? (correctedWinnerId === currentMatch.player1Id
          ? currentMatch.player2Id
          : currentMatch.player1Id)
      : (correctedWinnerId === currentMatch.team1Id
          ? currentMatch.team2Id
          : currentMatch.team1Id);

    const originalLoserId = isSingles
      ? (existingWinnerId === currentMatch.player1Id
          ? currentMatch.player2Id
          : currentMatch.player1Id)
      : (existingWinnerId === currentMatch.team1Id
          ? currentMatch.team2Id
          : currentMatch.team1Id);

    const thirdSlot = isSingles
      ? (isSlot1 ? 'player1Id' : 'player2Id')
      : (isSlot1 ? 'team1Id' : 'team2Id');

    if (thirdPlaceMatch[thirdSlot] !== originalLoserId) {
      throw new AppError(
        'The third-place playoff participant does not match the original loser.',
        409
      );
    }

    await tx.match.update({
      where: { id: thirdPlaceMatch.id },
      data: isSingles
        ? isSlot1
          ? { player1Id: correctedLoserId }
          : { player2Id: correctedLoserId }
        : isSlot1
          ? { team1Id: correctedLoserId }
          : { team2Id: correctedLoserId },
    });
  }
}

  // Replace the existing game records
  await tx.game.deleteMany({
    where: { matchId },
  });

  await tx.game.createMany({
    data: games.map((game) => ({
      matchId,
      gameNumber: game.gameNumber,
      player1Score: game.player1Score,
      player2Score: game.player2Score,
      winnerId:
        currentMatch.matchType === 'SINGLES'
          ? game.player1Score > game.player2Score
            ? currentMatch.player1Id
            : currentMatch.player2Id
          : null,
    })),
  });

  // Update the match result without changing the winner
  // Update the corrected match result and winner
return tx.match.update({
  where: { id: matchId },
  data: {
    winnerId: correctedWinnerId,
    winnerTeamId:
      currentMatch.matchType === 'SINGLES'
        ? null
        : correctedWinnerId,
    score: correctionRecord.correctedScore,
      resultDetails: {
        ...previousDetails,
        games,
        bestOf,
        player1Wins,
        player2Wins,
        totalGames: games.length,
        corrections: [...previousCorrections, correctionRecord],
      },
    },
    include: {
      games: {
        orderBy: { gameNumber: 'asc' },
      },
    },
  });
});

return correctedMatch;
}
}