import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { MatchType, MatchStatus } from '@prisma/client';

// Convert score to an integer or null
const toNullableScore = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const score = Number(value);

  if (!Number.isInteger(score) || score < 0) {
    throw new AppError("Invalid game score", 400);
  }

  return score;
};

export class GroupService {
  // Create groups and assign players
  async createGroups(adminId: string, tournamentId: string, categoryId: string, numberOfGroups: number) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can create groups', 403);
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { type: true },
    });

    if (category?.type === 'DOUBLES' || category?.type === 'MIXED_DOUBLES') {
      return this.createDoublesGroups(adminId, tournamentId, categoryId, numberOfGroups);
    }

    const registrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId, categoryId, status: 'APPROVED' },
      include: { player: true },
    });

    const players = registrations.map(r => r.player);

    if (players.length < 2) {
      throw new AppError('Need at least 2 players to create groups', 400);
    }

    // Delete existing groups and knockout matches
    const existingGroups = await prisma.group.findMany({
      where: { tournamentId, categoryId },
      select: { id: true },
    });

    if (existingGroups.length > 0) {
      const groupIds = existingGroups.map(g => g.id);
      await prisma.groupPlayer.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.groupMatch.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.group.deleteMany({ where: { tournamentId, categoryId } });
      await prisma.match.deleteMany({
        where: {
          tournamentId,
          categoryId,
          round: { in: ['Quarter-Finals', 'Semi-Finals', 'Final'] },
        },
      });
    }

    const shuffledPlayers = this.shuffleArray([...players]);
    const playersPerGroup = Math.ceil(players.length / numberOfGroups);

    const groups = [];
    for (let i = 0; i < numberOfGroups; i++) {
      const groupName = String.fromCharCode(65 + i);
      const startIdx = i * playersPerGroup;
      const endIdx = Math.min(startIdx + playersPerGroup, players.length);
      const groupPlayers = shuffledPlayers.slice(startIdx, endIdx);

      if (groupPlayers.length === 0) continue;

      const group = await prisma.group.create({
        data: {
          name: `Group ${groupName}`,
          tournamentId,
          categoryId,
          players: {
            create: groupPlayers.map((player: { id: string }) => ({ playerId: player.id })),
          },
        },
        include: { players: { include: { player: true } } },
      });
      groups.push(group);
    }

    return groups;
  }

  // Generate league matches for all groups
  async generateGroupMatches(adminId: string, tournamentId: string, categoryId: string) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can generate group matches', 403);
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { type: true },
    });

    if (category?.type === 'DOUBLES' || category?.type === 'MIXED_DOUBLES') {
      return this.generateDoublesGroupMatches(adminId, tournamentId, categoryId);
    }

    const groups = await prisma.group.findMany({
      where: { tournamentId, categoryId },
      include: { players: { include: { player: true } } },
    });

    if (groups.length === 0) {
      throw new AppError('No groups found. Create groups first.', 400);
    }
    

    const existingMatches = await prisma.groupMatch.findMany({
      where: { group: { tournamentId, categoryId } },
      select: { id: true },
    });

    if (existingMatches.length > 0) {
      await prisma.groupMatch.deleteMany({
        where: { id: { in: existingMatches.map(m => m.id) } },
      });
    }

    const allMatches = [];

    for (const group of groups) {
      const players = group.players.map(p => p.player);

      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const match = await prisma.groupMatch.create({
            data: {
              groupId: group.id,
              player1Id: players[i].id,
              player2Id: players[j].id,
              scheduledTime: new Date(),
              status: 'SCHEDULED',
              round: 1,
            },
          });
          allMatches.push(match);
        }
      }
    }

    return {
      message: `Generated ${allMatches.length} group matches`,
      totalMatches: allMatches.length,
      groups: groups.length,
    };
  }

  // Record group match score
  // Record group match score — best of 3 or best of 5 with per-game scores
async recordGroupScore(
  matchId: string,
  games: { p1: number | null; p2: number | null }[],  // array of up to 5 games
  adminId: string,
  bestOf: 3 | 5 = 5,
  userRole?: string,
  startTime?: string,
  endTime?: string
) {
  const existingMatch = await prisma.groupMatch.findUnique({
    where: { id: matchId },
    include: { group: { include: { players: true } }, referee: true },
  }) as any;

  if (!existingMatch) throw new AppError('Match not found', 404);

  // Start Time and End Time are optional
if (Boolean(startTime) !== Boolean(endTime)) {
  throw new AppError(
    "Please provide both Start Time and End Time, or leave both empty",
    400
  );
}

let parsedStartTime: Date | undefined;
let parsedEndTime: Date | undefined;

if (startTime && endTime) {
  parsedStartTime = new Date(startTime);
  parsedEndTime = new Date(endTime);

  if (
    Number.isNaN(parsedStartTime.getTime()) ||
    Number.isNaN(parsedEndTime.getTime())
  ) {
    throw new AppError("Invalid match time", 400);
  }

  if (parsedEndTime <= parsedStartTime) {
    throw new AppError("End Time must be after Start Time", 400);
  }
}

  if (existingMatch.team1Id && existingMatch.team2Id) {
    return this.recordDoublesGroupScore(matchId, games, adminId, bestOf, userRole, startTime, endTime);
  }

  if (userRole === 'REFEREE') {
    if (!existingMatch.referee || existingMatch.referee.userId !== adminId) {
      throw new AppError('You can only record scores for matches assigned to you', 403);
    }
  }

  // Count games won per player
  const winsToWin = Math.ceil(bestOf / 2); // 2 for BO3, 3 for BO5
  let p1GamesWon = 0;
  let p2GamesWon = 0;

  for (const g of games) {
    if (g.p1 === null || g.p2 === null) continue;
    if (g.p1 > g.p2) p1GamesWon++;
    else if (g.p2 > g.p1) p2GamesWon++;
  }

  // Validate — must have a clear winner
  if (p1GamesWon < winsToWin && p2GamesWon < winsToWin) {
    throw new AppError(
      `Match not complete. Need ${winsToWin} game wins to win the match.`,
      400
    );
  }

  const player1Score = p1GamesWon;  // games won by player1
  const player2Score = p2GamesWon;  // games won by player2
  const winnerId = p1GamesWon > p2GamesWon
    ? existingMatch.player1Id
    : existingMatch.player2Id;

  // Revert old stats if this is an update
  const isUpdate = existingMatch.player1Score !== null;
  if (isUpdate && existingMatch.player1Score !== null && existingMatch.player2Score !== null) {
    await this.revertGroupPlayerStats(
      existingMatch.groupId,
      existingMatch.player1Id,
      existingMatch.player2Id,
      existingMatch.player1Score,
      existingMatch.player2Score
    );
  }

  // Save to DB
  const updatedMatch = await prisma.groupMatch.update({
    where: { id: matchId },
    data: {
      player1Score,
      player2Score,
      winnerId,
      bestOf,
      status: 'COMPLETED',
      completedAt: new Date(),
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      game1player1: toNullableScore(games[0]?.p1),
game1player2: toNullableScore(games[0]?.p2),

game2player1: toNullableScore(games[1]?.p1),
game2player2: toNullableScore(games[1]?.p2),

game3player1: toNullableScore(games[2]?.p1),
game3player2: toNullableScore(games[2]?.p2),

game4player1: toNullableScore(games[3]?.p1),
game4player2: toNullableScore(games[3]?.p2),

game5player1: toNullableScore(games[4]?.p1),
game5player2: toNullableScore(games[4]?.p2),
    },
  });

  await this.updateGroupPlayerStats(
    existingMatch.groupId,
    existingMatch.player1Id,
    existingMatch.player2Id,
    player1Score,
    player2Score
  );

  return updatedMatch;
}
  // Update player statistics in group
  private async updateGroupPlayerStats(
    groupId: string,
    player1Id: string,
    player2Id: string,
    player1Score: number,
    player2Score: number,
  ) {
    const isPlayer1Winner = player1Score > player2Score;

    await prisma.groupPlayer.update({
      where: { groupId_playerId: { groupId, playerId: player1Id } },
      data: {
        matchesPlayed: { increment: 1 },
        wins: { increment: isPlayer1Winner ? 1 : 0 },
        losses: { increment: isPlayer1Winner ? 0 : 1 },
        points: { increment: player1Score },
        pointsScored: { increment: player1Score },
        pointsConceded: { increment: player2Score },
        gamesWon: { increment: player1Score },
        gamesLost: { increment: player2Score },
      },
    });

    await prisma.groupPlayer.update({
      where: { groupId_playerId: { groupId, playerId: player2Id } },
      data: {
        matchesPlayed: { increment: 1 },
        wins: { increment: isPlayer1Winner ? 0 : 1 },
        losses: { increment: isPlayer1Winner ? 1 : 0 },
        points: { increment: player2Score },
        pointsScored: { increment: player2Score },
        pointsConceded: { increment: player1Score },
        gamesWon: { increment: player2Score },
        gamesLost: { increment: player1Score },
      },
    });
  }

  // Get group standings
  async getGroupStandings(tournamentId: string, categoryId: string) {
    const groups = await prisma.group.findMany({
      where: { tournamentId, categoryId },
      include: {
        players: {
          include: {
            player: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { points: 'desc' },
        },
        teams: {
          include: {
            team: {
              include: {
                members: {
                  include: {
                    player: { select: { id: true, firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
          orderBy: { points: 'desc' },
        },
        matches: {
          include: {
            player1: { select: { id: true, firstName: true, lastName: true } },
            player2: { select: { id: true, firstName: true, lastName: true } },
            team1: {
              include: {
                members: {
                  include: {
                    player: { select: { id: true, firstName: true, lastName: true } },
                  },
                },
              },
            },
            team2: {
              include: {
                members: {
                  include: {
                    player: { select: { id: true, firstName: true, lastName: true } },
                  },
                },
              },
            },
            referee: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          },
        },
      },
    });

    return groups;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Generate knockout stage from group stage results
  //
  // Dynamic bracket logic:
  //   4 players  → Semi-final (×2) + Final (×1)          = 3 matches
  //   6 players  → Quarter-final (×2, 4 play) + BYE (×2) + SF (×2) + F (×1) = 5 matches
  //   8 players  → Quarter-final (×4) + SF (×2) + F (×1) = 7 matches
  // ─────────────────────────────────────────────────────────────────────────────
  async generateKnockoutStage(
    adminId: string,
    tournamentId: string,
    categoryId: string,
    topFromEachGroup: number = 2,
  ) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can generate knockout stage', 403);
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { type: true },
    });

    if (category?.type === 'DOUBLES' || category?.type === 'MIXED_DOUBLES') {
      return this.generateDoublesKnockoutStage(adminId, tournamentId, categoryId, topFromEachGroup);
    }

    // ── 1. Fetch groups and collect qualified players ────────────────────────
    const groups = await prisma.group.findMany({
      where: { tournamentId, categoryId },
      include: {
        players: {
          orderBy: [
            { points: 'desc' },
            { gamesWon: 'desc' },
            { pointsScored: 'desc' },
          ],
        },
      },
    });

    if (groups.length === 0) {
      throw new AppError('No groups found. Create groups first.', 400);
    }

    const qualifiedPlayers: Array<{
      id: string;
      points: number;
      gamesWon: number;
      pointsScored: number;
      groupRank: number; // 1 = group winner, 2 = runner-up, etc.
    }> = [];

    for (const group of groups) {
      const topPlayers = group.players.slice(0, topFromEachGroup);
      topPlayers.forEach((player, rank) => {
        qualifiedPlayers.push({
          id: player.playerId,
          points: player.points,
          gamesWon: player.gamesWon,
          pointsScored: player.pointsScored,
          groupRank: rank + 1,
        });
      });
    }

    const totalPlayers = qualifiedPlayers.length;
    console.log(`\n📊 Qualified players: ${totalPlayers}`);

    if (totalPlayers < 2) {
      throw new AppError('Not enough players qualified for knockout stage', 400);
    }

    // ── 2. Delete existing knockout matches and their games ───────────────────
    const existingMatches = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      select: { id: true },
    });
    if (existingMatches.length > 0) {
      await prisma.game.deleteMany({
        where: { matchId: { in: existingMatches.map(m => m.id) } },
      });
      await prisma.match.deleteMany({
        where: { tournamentId, categoryId },
      });
    }

    // ── 3. Determine bracket structure dynamically ───────────────────────────
    const bracketSize = this.nextPowerOfTwo(totalPlayers); // 4, 8, 16
    const byes = bracketSize - totalPlayers;

    console.log(`📐 Bracket size: ${bracketSize}, Byes: ${byes}, Total players: ${totalPlayers}`);

    // Sort group winners by record (seeds), then runners-up, then any others
    const groupWinners = qualifiedPlayers
      .filter(p => p.groupRank === 1)
      .sort((a, b) => b.points - a.points || b.gamesWon - a.gamesWon || b.pointsScored - a.pointsScored);

    const groupRunnerUps = qualifiedPlayers
      .filter(p => p.groupRank === 2)
      .sort((a, b) => b.points - a.points || b.gamesWon - a.gamesWon || b.pointsScored - a.pointsScored);

    const otherQualified = qualifiedPlayers
      .filter(p => p.groupRank > 2)
      .sort((a, b) => b.points - a.points || b.gamesWon - a.gamesWon || b.pointsScored - a.pointsScored);

    const seededPlayers = [...groupWinners, ...groupRunnerUps, ...otherQualified];

    const allMatches = [];
    let matchNumber = 1;

    // ── 4a. CASE: 4 players with 0 byes — skip straight to Semi-finals ───────
    if (bracketSize === 4 && byes === 0) {
      const [winner1, winner2] = groupWinners;
      const [runnerUp1, runnerUp2] = groupRunnerUps;

      console.log('🏓 Creating Semi-finals (no Quarter-finals needed)');

      const sf1 = await prisma.match.create({
        data: {
          tournamentId,
          categoryId,
          matchType: 'SINGLES',
          player1Id: winner1?.id ?? null,
          player2Id: runnerUp2?.id ?? runnerUp1?.id ?? null,
          round: 'Semi-Finals',
          matchNumber: matchNumber++,
          scheduledTime: new Date(),
          status: 'SCHEDULED',
        },
      });
      allMatches.push(sf1);

      const sf2 = await prisma.match.create({
        data: {
          tournamentId,
          categoryId,
          matchType: 'SINGLES',
          player1Id: winner2?.id ?? null,
          player2Id: runnerUp1?.id ?? runnerUp2?.id ?? null,
          round: 'Semi-Finals',
          matchNumber: matchNumber++,
          scheduledTime: new Date(),
          status: 'SCHEDULED',
        },
      });
      allMatches.push(sf2);

      const finalMatch = await prisma.match.create({
        data: {
          tournamentId,
          categoryId,
          matchType: 'SINGLES',
          player1Id: null,
          player2Id: null,
          round: 'Final',
          matchNumber: matchNumber++,
          scheduledTime: new Date(),
          status: 'SCHEDULED',
        },
      });
      allMatches.push(finalMatch);


    }

    // ── 4b. CASE: bracketSize >= 8 (e.g. 5-8 players with QF, or 9-16 with R16) ──
    else {
      const firstRoundMatchCount = bracketSize / 2;
      const randomized = this.shuffleArray([...seededPlayers]);
      const byePlayers = randomized.slice(0, byes);
      const playingPlayers = randomized.slice(byes);

      const matchOrder = this.getSeededMatchOrder(firstRoundMatchCount);
      const firstRoundPairs = Array.from({ length: firstRoundMatchCount }, () => ({
        p1: null as string | null,
        p2: null as string | null,
        isBye: false,
      }));

      // Place BYEs according to official seeded match order (top & bottom balanced)
      for (let i = 0; i < byes; i++) {
        const matchIndex = matchOrder[i];
        firstRoundPairs[matchIndex].isBye = true;
        firstRoundPairs[matchIndex].p1 = byePlayers[i].id;
      }

      // Fill remaining first round match slots with playing players
      let playingIndex = 0;
      for (let i = 0; i < firstRoundMatchCount; i++) {
        if (!firstRoundPairs[i].isBye) {
          firstRoundPairs[i].p1 = playingPlayers[playingIndex++]?.id || null;
          firstRoundPairs[i].p2 = playingPlayers[playingIndex++]?.id || null;
        }
      }

      // Create Round 1 matches (e.g. Quarter-Finals)
      let currentRoundMatches: any[] = [];
      const round1Name = this.getKnockoutRoundName(firstRoundMatchCount);

      for (let i = 0; i < firstRoundMatchCount; i++) {
        const pair = firstRoundPairs[i];
        const match = await prisma.match.create({
          data: {
            tournamentId,
            categoryId,
            matchType: 'SINGLES',
            player1Id: pair.p1,
            player2Id: pair.p2,
            round: round1Name,
            matchNumber: matchNumber++,
            scheduledTime: new Date(),
            status: pair.isBye ? 'COMPLETED' : 'SCHEDULED',
            winnerId: pair.isBye ? pair.p1 : null,
            score: pair.isBye ? 'BYE' : null,
          },
        });
        currentRoundMatches.push(match);
        allMatches.push(match);
      }

      // Create subsequent rounds (e.g. Semi-Finals, Final)
      let matchesInNextRound = Math.floor(firstRoundMatchCount / 2);
      while (matchesInNextRound >= 1) {
        const nextRoundName = this.getKnockoutRoundName(matchesInNextRound);
        const nextRoundMatches: any[] = [];

        for (let i = 0; i < matchesInNextRound; i++) {
          const prev1 = currentRoundMatches[i * 2];
          const prev2 = currentRoundMatches[i * 2 + 1];

          const p1Id = prev1?.winnerId || null;
          const p2Id = prev2?.winnerId || null;

          const match = await prisma.match.create({
            data: {
              tournamentId,
              categoryId,
              matchType: 'SINGLES',
              player1Id: p1Id,
              player2Id: p2Id,
              round: nextRoundName,
              matchNumber: matchNumber++,
              scheduledTime: new Date(),
              status: 'SCHEDULED',
            },
          });
          nextRoundMatches.push(match);
          allMatches.push(match);
        }
        currentRoundMatches = nextRoundMatches;
        matchesInNextRound = Math.floor(matchesInNextRound / 2);
      }


    }

    // ── 5. Summary ───────────────────────────────────────────────────────────
    const qfCount = allMatches.filter(m => m.round === 'Quarter-Finals' || m.round === 'Quarter-final').length;
    const sfCount = allMatches.filter(m => m.round === 'Semi-Finals' || m.round === 'Semi-final').length;
    const fCount  = allMatches.filter(m => m.round === 'Final').length;

    console.log(`\n✅ Generated ${allMatches.length} knockout matches`);
    console.log(`   Quarter-finals : ${qfCount}`);
    console.log(`   Semi-finals    : ${sfCount}`);
    console.log(`   Final          : ${fCount}`);

    return {
      message: `Generated ${allMatches.length} knockout matches`,
      totalPlayers,
      bracketSize,
      totalMatches: allMatches.length,
      breakdown: { quarterFinals: qfCount, semiFinals: sfCount, final: fCount },
      matches: allMatches.map(m => ({
        id: m.id,
        round: m.round,
        matchNumber: m.matchNumber,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        status: m.status,
      })),
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /** Returns the smallest power of 2 >= n (e.g. 4→4, 5→8, 6→8, 9→16) */
  private nextPowerOfTwo(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }

  private getSeededMatchOrder(numMatches: number): number[] {
    if (numMatches === 1) return [0];
    if (numMatches === 2) return [0, 1];
    if (numMatches === 4) return [0, 3, 1, 2];
    if (numMatches === 8) return [0, 7, 3, 4, 1, 6, 2, 5];
    if (numMatches === 16) return [0, 15, 7, 8, 3, 12, 4, 11, 1, 14, 6, 9, 2, 13, 5, 10];
    return Array.from({ length: numMatches }, (_, i) => i);
  }

  private getKnockoutRoundName(numMatches: number): string {
    if (numMatches === 1) return 'Final';
    if (numMatches === 2) return 'Semi-Finals';
    if (numMatches === 4) return 'Quarter-Finals';
    if (numMatches === 8) return 'Round of 16';
    if (numMatches === 16) return 'Round of 32';
    return `Round of ${numMatches * 2}`;
  }

  // Add this method to revert old statistics when re-recording scores
private async revertGroupPlayerStats(groupId: string, player1Id: string, player2Id: string, player1Score: number, player2Score: number) {
  const isPlayer1Winner = player1Score > player2Score;

  await prisma.groupPlayer.update({
    where: { groupId_playerId: { groupId, playerId: player1Id } },
    data: {
      matchesPlayed: { decrement: 1 },
      wins: { decrement: isPlayer1Winner ? 1 : 0 },
      losses: { decrement: isPlayer1Winner ? 0 : 1 },
      points: { decrement: player1Score },
      pointsScored: { decrement: player1Score },
      pointsConceded: { decrement: player2Score },
      gamesWon: { decrement: player1Score },
      gamesLost: { decrement: player2Score },
    },
  });

  await prisma.groupPlayer.update({
    where: { groupId_playerId: { groupId, playerId: player2Id } },
    data: {
      matchesPlayed: { decrement: 1 },
      wins: { decrement: isPlayer1Winner ? 0 : 1 },
      losses: { decrement: isPlayer1Winner ? 1 : 0 },
      points: { decrement: player2Score },
      pointsScored: { decrement: player2Score },
      pointsConceded: { decrement: player1Score },
      gamesWon: { decrement: player2Score },
      gamesLost: { decrement: player1Score },
    },
  });
}
// Add this new method to GroupService class

async updateGroupMembers(
  adminId: string,
  tournamentId: string,
  categoryId: string,
  groupAssignments: { groupId: string; playerIds: string[] }[]
) {
  const admin = await prisma.adminProfile.findUnique({ where: { userId: adminId } });
  if (!admin) throw new AppError('Only admins can update group members', 403);

  // Verify no matches have been played yet (prevent editing mid-tournament)
  const playedMatches = await prisma.groupMatch.findMany({
    where: {
      group: { tournamentId, categoryId },
      status: 'COMPLETED',
    },
  });
  if (playedMatches.length > 0) {
    throw new AppError('Cannot reassign players after matches have been played', 400);
  }

  // Validate all playerIds are approved registrations for this tournament/category
  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId, categoryId, status: 'APPROVED' },
    select: { playerId: true },
  });
  const approvedIds = new Set(registrations.map(r => r.playerId));

  for (const { playerIds } of groupAssignments) {
    for (const pid of playerIds) {
      if (!approvedIds.has(pid)) {
        throw new AppError(`Player ${pid} is not an approved registrant`, 400);
      }
    }
  }

  // Rebuild GroupPlayer records for each group
  for (const { groupId, playerIds } of groupAssignments) {
    await prisma.groupPlayer.deleteMany({ where: { groupId } });
    await prisma.groupPlayer.createMany({
      data: playerIds.map(playerId => ({ groupId, playerId })),
    });
  }

  // Regenerate group matches (wipes old unplayed ones)
  await prisma.groupMatch.deleteMany({
    where: {
      group: { tournamentId, categoryId },
      status: 'SCHEDULED',
    },
  });

  return await this.getGroupStandings(tournamentId, categoryId);
}

  async assignRefereeToGroupMatch(matchId: string, refereeUserId: string) {
    const referee = await prisma.refereeProfile.findUnique({
      where: { userId: refereeUserId },
    });

    if (!referee) {
      throw new AppError('Referee not found', 404);
    }

    const updatedMatch = await prisma.groupMatch.update({
      where: { id: matchId },
      data: { refereeId: referee.id },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true } },
        player2: { select: { id: true, firstName: true, lastName: true } },
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
        referee: { include: { user: true } },
      },
    });

    return updatedMatch;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // DEDICATED DOUBLES GROUP + KNOCKOUT PIPELINE
  // ═════════════════════════════════════════════════════════════════════════════

  // Create groups and assign doubles teams
  async createDoublesGroups(
    adminId: string,
    tournamentId: string,
    categoryId: string,
    numberOfGroups: number
  ) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can create groups', 403);
    }

    // Fetch all APPROVED team registrations for this doubles category
    const teamRegistrations = await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
        categoryId,
        status: 'APPROVED',
        teamId: { not: null },
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                player: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    const teams = teamRegistrations
      .map(r => r.team)
      .filter((t): t is NonNullable<typeof t> => t !== null);

    if (teams.length < 2) {
      throw new AppError('Need at least 2 teams to create groups', 400);
    }

    // Delete existing groups, matches, and knockout matches for this category
    const existingGroups = await prisma.group.findMany({
      where: { tournamentId, categoryId },
      select: { id: true },
    });

    if (existingGroups.length > 0) {
      const groupIds = existingGroups.map(g => g.id);
      await prisma.groupTeam.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.groupPlayer.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.groupMatch.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.group.deleteMany({ where: { tournamentId, categoryId } });
      await prisma.match.deleteMany({
        where: {
          tournamentId,
          categoryId,
          round: {
  in: [
    'Round of 128',
    'Round of 64',
    'Round of 32',
    'Round of 16',
    'Quarter-Finals',
    'Semi-Finals',
    'Final',
    '3rd Place Playoff',
  ],
},
        },
      });
    }

    const shuffledTeams = this.shuffleArray([...teams]);
    const teamsPerGroup = Math.ceil(teams.length / numberOfGroups);

    const groups = [];
    for (let i = 0; i < numberOfGroups; i++) {
      const groupName = String.fromCharCode(65 + i);
      const startIdx = i * teamsPerGroup;
      const endIdx = Math.min(startIdx + teamsPerGroup, teams.length);
      const groupTeams = shuffledTeams.slice(startIdx, endIdx);

      if (groupTeams.length === 0) continue;

      const group = await prisma.group.create({
        data: {
          name: `Group ${groupName}`,
          tournamentId,
          categoryId,
          teams: {
            create: groupTeams.map((team: { id: string }) => ({ teamId: team.id })),
          },
        },
        include: {
          teams: {
            include: {
              team: {
                include: {
                  members: {
                    include: {
                      player: { select: { id: true, firstName: true, lastName: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });
      groups.push(group);
    }

    return groups;
  }

  // Generate league matches for doubles groups
  async generateDoublesGroupMatches(adminId: string, tournamentId: string, categoryId: string) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can generate group matches', 403);
    }

    const groups = await prisma.group.findMany({
      where: { tournamentId, categoryId },
      include: {
        teams: {
          include: {
            team: {
              include: {
                members: {
                  include: {
                    player: { select: { id: true, firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (groups.length === 0) {
      throw new AppError('No groups found. Create groups first.', 400);
    }

    const existingMatches = await prisma.groupMatch.findMany({
      where: { group: { tournamentId, categoryId } },
      select: { id: true },
    });

    if (existingMatches.length > 0) {
      await prisma.groupMatch.deleteMany({
        where: { id: { in: existingMatches.map(m => m.id) } },
      });
    }

    const allMatches = [];

    for (const group of groups) {
      const teams = group.teams.map(gt => gt.team);

      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const match = await prisma.groupMatch.create({
            data: {
              groupId: group.id,
              team1Id: teams[i].id,
              team2Id: teams[j].id,
              scheduledTime: new Date(),
              status: 'SCHEDULED',
              round: 1,
            },
          });
          allMatches.push(match);
        }
      }
    }

    return {
      message: `Generated ${allMatches.length} doubles group matches`,
      totalMatches: allMatches.length,
      groups: groups.length,
    };
  }

  // Record score for doubles group match
  async recordDoublesGroupScore(
    matchId: string,
    games: { p1: number | null; p2: number | null }[],
    adminId: string,
    bestOf: 3 | 5 = 5,
    userRole?: string,
    startTime?: string,
    endTime?: string
  ) {
    const existingMatch = await prisma.groupMatch.findUnique({
      where: { id: matchId },
      include: {
        group: { include: { teams: true } },
        referee: true,
        team1: { include: { members: { include: { player: true } } } },
        team2: { include: { members: { include: { player: true } } } },
      },
    }) as any;

    if (!existingMatch) throw new AppError('Match not found', 404);

   // Start Time and End Time are optional
if (Boolean(startTime) !== Boolean(endTime)) {
  throw new AppError(
    "Please provide both Start Time and End Time, or leave both empty",
    400
  );
}

let parsedStartTime: Date | undefined;
let parsedEndTime: Date | undefined;

if (startTime && endTime) {
  parsedStartTime = new Date(startTime);
  parsedEndTime = new Date(endTime);

  if (
    Number.isNaN(parsedStartTime.getTime()) ||
    Number.isNaN(parsedEndTime.getTime())
  ) {
    throw new AppError("Invalid match time", 400);
  }

  if (parsedEndTime <= parsedStartTime) {
    throw new AppError("End Time must be after Start Time", 400);
  }
}

    if (userRole === 'REFEREE') {
      if (!existingMatch.referee || existingMatch.referee.userId !== adminId) {
        throw new AppError('You can only record scores for matches assigned to you', 403);
      }
    }

    const normalizedGames = games.map((game) => ({
  p1: toNullableScore(game.p1),
  p2: toNullableScore(game.p2),
}));

console.log("BACKEND NORMALIZED GAMES:", normalizedGames);
console.log("BACKEND BEST OF:", bestOf);

const winsToWin = Math.ceil(bestOf / 2);
let team1GamesWon = 0;
let team2GamesWon = 0;

for (const g of normalizedGames) {
  if (g.p1 === null || g.p2 === null) continue;

  if (g.p1 > g.p2) team1GamesWon++;
  else if (g.p2 > g.p1) team2GamesWon++;
}

console.log("Team 1 games won:", team1GamesWon);
console.log("Team 2 games won:", team2GamesWon);

    if (team1GamesWon < winsToWin && team2GamesWon < winsToWin) {
      throw new AppError(
        `Match not complete. Need ${winsToWin} game wins to win the match.`,
        400
      );
    }

    const player1Score = team1GamesWon;
    const player2Score = team2GamesWon;
    const winnerTeamId =
      team1GamesWon > team2GamesWon ? existingMatch.team1Id : existingMatch.team2Id;

    // Revert old stats if updating
    const isUpdate =
      existingMatch.player1Score !== null && existingMatch.player2Score !== null;
    if (isUpdate) {
      await this.revertGroupTeamStats(
        existingMatch.groupId,
        existingMatch.team1Id,
        existingMatch.team2Id,
        existingMatch.player1Score,
        existingMatch.player2Score
      );
    }

    const updatedMatch = await prisma.groupMatch.update({
  where: { id: matchId },
  data: {
    player1Score,
    player2Score,
    winnerTeamId,
    bestOf,
    status: 'COMPLETED',
    completedAt: new Date(),

    // Optional match times
    startTime: parsedStartTime,
    endTime: parsedEndTime,

    // Convert strings to integers; empty scores become null
    game1player1: toNullableScore(games[0]?.p1),
    game1player2: toNullableScore(games[0]?.p2),

    game2player1: toNullableScore(games[1]?.p1),
    game2player2: toNullableScore(games[1]?.p2),

    game3player1: toNullableScore(games[2]?.p1),
    game3player2: toNullableScore(games[2]?.p2),

    game4player1: toNullableScore(games[3]?.p1),
    game4player2: toNullableScore(games[3]?.p2),

    game5player1: toNullableScore(games[4]?.p1),
    game5player2: toNullableScore(games[4]?.p2),
  },
});

    await this.updateGroupTeamStats(
      existingMatch.groupId,
      existingMatch.team1Id,
      existingMatch.team2Id,
      player1Score,
      player2Score
    );

    return updatedMatch;
  }

  // Update team stats in doubles group
  private async updateGroupTeamStats(
    groupId: string,
    team1Id: string,
    team2Id: string,
    team1Score: number,
    team2Score: number
  ) {
    const isTeam1Winner = team1Score > team2Score;

    await prisma.groupTeam.update({
      where: { groupId_teamId: { groupId, teamId: team1Id } },
      data: {
        matchesPlayed: { increment: 1 },
        wins: { increment: isTeam1Winner ? 1 : 0 },
        losses: { increment: isTeam1Winner ? 0 : 1 },
        points: { increment: team1Score },
        pointsScored: { increment: team1Score },
        pointsConceded: { increment: team2Score },
        gamesWon: { increment: team1Score },
        gamesLost: { increment: team2Score },
      },
    });

    await prisma.groupTeam.update({
      where: { groupId_teamId: { groupId, teamId: team2Id } },
      data: {
        matchesPlayed: { increment: 1 },
        wins: { increment: isTeam1Winner ? 0 : 1 },
        losses: { increment: isTeam1Winner ? 1 : 0 },
        points: { increment: team2Score },
        pointsScored: { increment: team2Score },
        pointsConceded: { increment: team1Score },
        gamesWon: { increment: team2Score },
        gamesLost: { increment: team1Score },
      },
    });
  }

  // Revert team stats in doubles group
  private async revertGroupTeamStats(
    groupId: string,
    team1Id: string,
    team2Id: string,
    oldTeam1Score: number,
    oldTeam2Score: number
  ) {
    const wasTeam1Winner = oldTeam1Score > oldTeam2Score;

    await prisma.groupTeam.update({
      where: { groupId_teamId: { groupId, teamId: team1Id } },
      data: {
        matchesPlayed: { decrement: 1 },
        wins: { decrement: wasTeam1Winner ? 1 : 0 },
        losses: { decrement: wasTeam1Winner ? 0 : 1 },
        points: { decrement: oldTeam1Score },
        pointsScored: { decrement: oldTeam1Score },
        pointsConceded: { decrement: oldTeam2Score },
        gamesWon: { decrement: oldTeam1Score },
        gamesLost: { decrement: oldTeam2Score },
      },
    });

    await prisma.groupTeam.update({
      where: { groupId_teamId: { groupId, teamId: team2Id } },
      data: {
        matchesPlayed: { decrement: 1 },
        wins: { decrement: wasTeam1Winner ? 0 : 1 },
        losses: { decrement: wasTeam1Winner ? 1 : 0 },
        points: { decrement: oldTeam2Score },
        pointsScored: { decrement: oldTeam2Score },
        pointsConceded: { decrement: oldTeam1Score },
        gamesWon: { decrement: oldTeam2Score },
        gamesLost: { decrement: oldTeam1Score },
      },
    });
  }

  // Generate knockout stage for doubles from group results
  async generateDoublesKnockoutStage(
    adminId: string,
    tournamentId: string,
    categoryId: string,
    topFromEachGroup: number = 2
  ) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can generate knockout stage', 403);
    }

    const groups = await prisma.group.findMany({
      where: { tournamentId, categoryId },
      include: {
        teams: {
          include: {
            team: {
              include: {
                members: {
                  include: {
                    player: { select: { id: true, firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
          orderBy: [
            { points: 'desc' },
            { gamesWon: 'desc' },
            { pointsScored: 'desc' },
          ],
        },
      },
    });

    if (groups.length === 0) {
      throw new AppError('No groups found. Create groups first.', 400);
    }

    const qualifiedTeams: Array<{
      id: string;
      points: number;
      gamesWon: number;
      pointsScored: number;
      groupRank: number;
    }> = [];

    for (const group of groups) {
      const topTeams = group.teams.slice(0, topFromEachGroup);
      topTeams.forEach((gt, rank) => {
        qualifiedTeams.push({
          id: gt.teamId,
          points: gt.points,
          gamesWon: gt.gamesWon,
          pointsScored: gt.pointsScored,
          groupRank: rank + 1,
        });
      });
    }

    const totalTeams = qualifiedTeams.length;
    if (totalTeams < 2) {
      throw new AppError('Not enough teams qualified for knockout stage', 400);
    }

    // Delete existing knockout matches and their games for this category
    const existingMatches = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      select: { id: true },
    });
    if (existingMatches.length > 0) {
      await prisma.game.deleteMany({
        where: { matchId: { in: existingMatches.map(m => m.id) } },
      });
      await prisma.match.deleteMany({
        where: { tournamentId, categoryId },
      });
    }

    const bracketSize = this.nextPowerOfTwo(totalTeams);
    const byes = bracketSize - totalTeams;

    const groupWinners = qualifiedTeams
      .filter(t => t.groupRank === 1)
      .sort((a, b) => b.points - a.points || b.gamesWon - a.gamesWon || b.pointsScored - a.pointsScored);

    const groupRunnerUps = qualifiedTeams
      .filter(t => t.groupRank === 2)
      .sort((a, b) => b.points - a.points || b.gamesWon - a.gamesWon || b.pointsScored - a.pointsScored);

    const otherQualified = qualifiedTeams
      .filter(t => t.groupRank > 2)
      .sort((a, b) => b.points - a.points || b.gamesWon - a.gamesWon || b.pointsScored - a.pointsScored);

    const seededTeams = [...groupWinners, ...groupRunnerUps, ...otherQualified];
    const allMatches = [];
    let matchNumber = 1;

    if (bracketSize === 4 && byes === 0) {
      const [winner1, winner2] = groupWinners;
      const [runnerUp1, runnerUp2] = groupRunnerUps;

      const sf1 = await prisma.match.create({
        data: {
          tournamentId,
          categoryId,
          matchType: 'DOUBLES',
          team1Id: winner1?.id ?? null,
          team2Id: runnerUp2?.id ?? runnerUp1?.id ?? null,
          round: 'Semi-Finals',
          matchNumber: matchNumber++,
          scheduledTime: new Date(),
          status: 'SCHEDULED',
        },
      });
      allMatches.push(sf1);

      const sf2 = await prisma.match.create({
        data: {
          tournamentId,
          categoryId,
          matchType: 'DOUBLES',
          team1Id: winner2?.id ?? null,
          team2Id: runnerUp1?.id ?? runnerUp2?.id ?? null,
          round: 'Semi-Finals',
          matchNumber: matchNumber++,
          scheduledTime: new Date(),
          status: 'SCHEDULED',
        },
      });
      allMatches.push(sf2);

      const finalMatch = await prisma.match.create({
        data: {
          tournamentId,
          categoryId,
          matchType: 'DOUBLES',
          team1Id: null,
          team2Id: null,
          round: 'Final',
          matchNumber: matchNumber++,
          scheduledTime: new Date(),
          status: 'SCHEDULED',
        },
      });
      allMatches.push(finalMatch);


    } else {
      const firstRoundMatchCount = bracketSize / 2;
      const randomized = this.shuffleArray([...seededTeams]);
      const byeTeams = randomized.slice(0, byes);
      const playingTeams = randomized.slice(byes);

      const matchOrder = this.getSeededMatchOrder(firstRoundMatchCount);
      const firstRoundPairs = Array.from({ length: firstRoundMatchCount }, () => ({
        t1: null as string | null,
        t2: null as string | null,
        isBye: false,
      }));

      for (let i = 0; i < byes; i++) {
        const matchIndex = matchOrder[i];
        firstRoundPairs[matchIndex].isBye = true;
        firstRoundPairs[matchIndex].t1 = byeTeams[i].id;
      }

      let playingIndex = 0;
      for (let i = 0; i < firstRoundMatchCount; i++) {
        if (!firstRoundPairs[i].isBye) {
          firstRoundPairs[i].t1 = playingTeams[playingIndex++]?.id || null;
          firstRoundPairs[i].t2 = playingTeams[playingIndex++]?.id || null;
        }
      }

      let currentRoundMatches: any[] = [];
      const round1Name = this.getKnockoutRoundName(firstRoundMatchCount);

      for (let i = 0; i < firstRoundMatchCount; i++) {
        const pair = firstRoundPairs[i];
        const match = await prisma.match.create({
          data: {
            tournamentId,
            categoryId,
            matchType: 'DOUBLES',
            team1Id: pair.t1,
            team2Id: pair.t2,
            round: round1Name,
            matchNumber: matchNumber++,
            scheduledTime: new Date(),
            status: pair.isBye ? 'COMPLETED' : 'SCHEDULED',
            winnerTeamId: pair.isBye ? pair.t1 : null,
            score: pair.isBye ? 'BYE' : null,
          },
        });
        currentRoundMatches.push(match);
        allMatches.push(match);
      }

      let matchesInNextRound = Math.floor(firstRoundMatchCount / 2);
      while (matchesInNextRound >= 1) {
        const nextRoundName = this.getKnockoutRoundName(matchesInNextRound);
        const nextRoundMatches: any[] = [];

        for (let i = 0; i < matchesInNextRound; i++) {
          const prev1 = currentRoundMatches[i * 2];
          const prev2 = currentRoundMatches[i * 2 + 1];

          const t1Id = prev1?.winnerTeamId || null;
          const t2Id = prev2?.winnerTeamId || null;

          const match = await prisma.match.create({
            data: {
              tournamentId,
              categoryId,
              matchType: 'DOUBLES',
              team1Id: t1Id,
              team2Id: t2Id,
              round: nextRoundName,
              matchNumber: matchNumber++,
              scheduledTime: new Date(),
              status: 'SCHEDULED',
            },
          });
          nextRoundMatches.push(match);
          allMatches.push(match);
        }
        currentRoundMatches = nextRoundMatches;
        matchesInNextRound = Math.floor(matchesInNextRound / 2);
      }


    }

    const qfCount = allMatches.filter(
      m => m.round === 'Quarter-Finals' || m.round === 'Quarter-final'
    ).length;
    const sfCount = allMatches.filter(
      m => m.round === 'Semi-Finals' || m.round === 'Semi-final'
    ).length;
    const fCount = allMatches.filter(m => m.round === 'Final').length;

    return {
      message: `Generated ${allMatches.length} doubles knockout matches`,
      totalTeams,
      bracketSize,
      totalMatches: allMatches.length,
      breakdown: { quarterFinals: qfCount, semiFinals: sfCount, final: fCount },
      matches: allMatches.map(m => ({
        id: m.id,
        round: m.round,
        matchNumber: m.matchNumber,
        team1Id: m.team1Id,
        team2Id: m.team2Id,
        status: m.status,
      })),
    };
  }
}

