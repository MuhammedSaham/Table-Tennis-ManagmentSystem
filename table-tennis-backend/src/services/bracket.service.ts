import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { MatchType, MatchStatus } from '@prisma/client';

interface SeededPlayer {
  id: string;
  firstName: string;
  lastName: string;
  seed: number;
  skillScore: number;
}

export class BracketService {

  // ==============================
  // MAIN GENERATE BRACKET
  // ==============================
  async generateBracket(adminId: string, tournamentId: string, categoryId: string) {

    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) throw new AppError('Only admins can generate brackets', 403);

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        registrations: {
          where: { status: 'APPROVED' },
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                playerProfile: { select: { skillLevel: true } },
              },
            },
          },
        },
      },
    }) as any;

    if (!category) throw new AppError('Category not found', 404);

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { startDate: true },
    });

    if (!tournament) throw new AppError('Tournament not found', 404);

    // ── DOUBLES: delegate to team-based bracket builder ─────────────────────────
    if (category.type === 'DOUBLES' || category.type === 'MIXED_DOUBLES') {
      return this.generateDoublesBracket(adminId, tournamentId, categoryId, new Date(tournament.startDate),MatchType.DOUBLES);
    }

    // ── SINGLES: existing logic unchanged ────────────────────────────────────────
    const players = category.registrations.map((r: any) => r.player);

    if (players.length < 2) {
      throw new AppError('Need at least 2 players', 400);
    }

    const seededPlayers = await this.seedPlayers(players);

    const n = seededPlayers.length;
    const bracketSize = this.nextPowerOfTwo(n);
    const startDate = new Date(tournament.startDate);

    // delete old matches
    const existing = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      select: { id: true },
    });

    if (existing.length > 0) {
      await prisma.game.deleteMany({
        where: { matchId: { in: existing.map(m => m.id) } },
      });

      await prisma.match.deleteMany({
        where: { tournamentId, categoryId },
      });
    }

    const matches = this.buildBracket(
      tournamentId,
      categoryId,
      seededPlayers,
      bracketSize,
      startDate,
      MatchType.SINGLES
    );
    console.log(
  matches.map(m => ({
    matchNumber: m.matchNumber,
    round: m.round,
    player1Id: m.player1Id,
    player2Id: m.player2Id
  }))
);

    await prisma.match.createMany({ data: matches });

    const created = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      include: {
        player1: { select: { firstName: true, lastName: true } },
        player2: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ matchNumber: 'asc' }],
    });

    return {
      message: 'Bracket generated successfully',
      totalPlayers: n,
      bracketSize,
      totalMatches: created.length,
      matches: created,
    };
  }

  // ── DOUBLES BRACKET GENERATOR ─────────────────────────────────────────────────
  private async generateDoublesBracket(
    adminId: string,
    tournamentId: string,
    categoryId: string,
    startDate: Date,
    matchType: MatchType
  ) {
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

    if (teamRegistrations.length < 2) {
      throw new AppError('Need at least 2 approved doubles teams to generate a bracket', 400);
    }

    const teams = teamRegistrations.map((r: any) => r.team).filter(Boolean);
    const n = teams.length;
    const bracketSize = this.nextPowerOfTwo(n);
    const byes = bracketSize - n;

    // Shuffle teams for random seeding
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const byeTeams = shuffled.slice(0, byes);
    const playingTeams = shuffled.slice(byes);

    // Delete existing matches for this category
    const existing = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      select: { id: true },
    });
    if (existing.length > 0) {
      await prisma.game.deleteMany({ where: { matchId: { in: existing.map((m: any) => m.id) } } });
      await prisma.match.deleteMany({ where: { tournamentId, categoryId } });
    }

    const firstRoundMatchCount = bracketSize / 2;
    const matchOrder = this.getSeededMatchOrder(firstRoundMatchCount);
    const firstRoundPairs = Array.from({ length: firstRoundMatchCount }, () => ({
      t1: null as string | null,
      t2: null as string | null,
      isBye: false,
    }));

    // Seed BYEs into standard bracket positions (opposite halves of the draw)
    for (let i = 0; i < byes; i++) {
      const matchIndex = matchOrder[i];
      firstRoundPairs[matchIndex].isBye = true;
      firstRoundPairs[matchIndex].t1 = byeTeams[i].id;
    }

    // Fill remaining match slots with playing teams
    let playingIndex = 0;
    for (let i = 0; i < firstRoundMatchCount; i++) {
      if (!firstRoundPairs[i].isBye) {
        firstRoundPairs[i].t1 = playingTeams[playingIndex++]?.id || null;
        firstRoundPairs[i].t2 = playingTeams[playingIndex++]?.id || null;
      }
    }

    const matchesToCreate: any[] = [];
    let matchNumber = 1;
    let currentRoundMatches: any[] = [];

    // Create Round 1
    const round1Name = this.getRoundName(firstRoundMatchCount);
    for (let i = 0; i < firstRoundMatchCount; i++) {
      const pair = firstRoundPairs[i];
      const matchObj = {
        tournamentId,
        categoryId,
        matchType,
        team1Id: pair.t1,
        team2Id: pair.t2,
        round: round1Name,
        matchNumber: matchNumber++,
        scheduledTime: startDate,
        status: pair.isBye ? MatchStatus.COMPLETED : MatchStatus.SCHEDULED,
        score: pair.isBye ? 'BYE' : null,
        winnerTeamId: pair.isBye ? pair.t1 : null,
        winnerId: null,
      };
      currentRoundMatches.push(matchObj);
      matchesToCreate.push(matchObj);
    }

    // Build subsequent rounds (Semi-Finals, Finals) and automatically advance BYE teams
    let matchesInNextRound = firstRoundMatchCount / 2;
    while (matchesInNextRound >= 1) {
      const nextRoundName = this.getRoundName(matchesInNextRound);
      const nextRoundMatches: any[] = [];

      for (let i = 0; i < matchesInNextRound; i++) {
        const prev1 = currentRoundMatches[i * 2];
        const prev2 = currentRoundMatches[i * 2 + 1];

        const t1Id = prev1?.winnerTeamId || null;
        const t2Id = prev2?.winnerTeamId || null;

        const matchObj = {
          tournamentId,
          categoryId,
          matchType,
          team1Id: t1Id,
          team2Id: t2Id,
          round: nextRoundName,
          matchNumber: matchNumber++,
          scheduledTime: startDate,
          status: MatchStatus.SCHEDULED,
          score: null,
          winnerTeamId: null,
          winnerId: null,
        };
        nextRoundMatches.push(matchObj);
        matchesToCreate.push(matchObj);
      }
      currentRoundMatches = nextRoundMatches;
      matchesInNextRound = Math.floor(matchesInNextRound / 2);
    }

    // 3rd Place Playoff (requires bracketSize >= 4)
    
    await prisma.match.createMany({ data: matchesToCreate });

    const created = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      include: {
        team1: { include: { members: { include: { player: { select: { firstName: true, lastName: true } } } } } },
        team2: { include: { members: { include: { player: { select: { firstName: true, lastName: true } } } } } },
      },
      orderBy: [{ matchNumber: 'asc' }],
    });

    return {
      message: 'Doubles bracket generated successfully',
      totalTeams: n,
      bracketSize,
      totalMatches: created.length,
      matches: created,
    };
  }


  // ==============================
  // BRACKET BUILDER (COMPLETELY REWRITTEN)
  // ==============================
  private buildBracket(
    tournamentId: string,
    categoryId: string,
    seededPlayers: SeededPlayer[],
    bracketSize: number,
    startDate: Date,
    matchType: MatchType
  ): any[] {
    const totalPlayers = seededPlayers.length;
    const byes = bracketSize - totalPlayers;
    const firstRoundMatchCount = bracketSize / 2;

    // Randomize all players so BYE distribution and matchups are completely fair and random
    const randomizedPlayers = [...seededPlayers];
    for (let i = randomizedPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [randomizedPlayers[i], randomizedPlayers[j]] = [randomizedPlayers[j], randomizedPlayers[i]];
    }

    const byePlayers = randomizedPlayers.slice(0, byes);
    const playingPlayers = randomizedPlayers.slice(byes);

    const getRoundName = (numMatches: number) => {
      if (numMatches === 1) return 'Final';
      if (numMatches === 2) return 'Semi-Finals';
      if (numMatches === 4) return 'Quarter-Finals';
      if (numMatches === 8) return 'Round of 16';
      if (numMatches === 16) return 'Round of 32';
      return `Round of ${numMatches * 2}`;
    };

    const getSeededMatchOrder = (numMatches: number) => {
      if (numMatches === 1) return [0];
      if (numMatches === 2) return [0, 1];
      if (numMatches === 4) return [0, 3, 1, 2];
      if (numMatches === 8) return [0, 7, 3, 4, 1, 6, 2, 5];
      if (numMatches === 16) return [0, 15, 7, 8, 3, 12, 4, 11, 1, 14, 6, 9, 2, 13, 5, 10];
      return Array.from({ length: numMatches }, (_, i) => i);
    };

    const matchOrder = getSeededMatchOrder(firstRoundMatchCount);
    const firstRoundPairs = Array.from({ length: firstRoundMatchCount }, () => ({
      p1: null as string | null,
      p2: null as string | null,
      isBye: false,
    }));

    for (let i = 0; i < byes; i++) {
      const matchIndex = matchOrder[i];
      firstRoundPairs[matchIndex].isBye = true;
      firstRoundPairs[matchIndex].p1 = byePlayers[i].id;
    }

    let playingIndex = 0;
    for (let i = 0; i < firstRoundMatchCount; i++) {
      if (!firstRoundPairs[i].isBye) {
        firstRoundPairs[i].p1 = playingPlayers[playingIndex++]?.id || null;
        firstRoundPairs[i].p2 = playingPlayers[playingIndex++]?.id || null;
      }
    }

    const matches: any[] = [];
    let matchNumber = 1;

    // ── Generate Rounds ──
    let currentRoundMatches: any[] = [];

    // Create Round 1
    const round1Name = getRoundName(firstRoundMatchCount);
    
    for (let i = 0; i < firstRoundMatchCount; i++) {
      const pair = firstRoundPairs[i];
      const matchObj = {
        tournamentId,
        categoryId,
        matchType,
        player1Id: pair.p1,
        player2Id: pair.p2,
        round: round1Name,
        matchNumber: matchNumber++,
        scheduledTime: startDate,
        status: pair.isBye ? MatchStatus.COMPLETED : MatchStatus.SCHEDULED,
        winnerId: pair.isBye ? pair.p1 : null,
        score: pair.isBye ? 'BYE' : null,
      };
      // We push a "fake" id so we can track parent-child relationships if needed,
      // but since we just need winnerIds, we can simulate it.
      currentRoundMatches.push(matchObj);
      matches.push(matchObj);
    }

    // Create subsequent rounds
    let matchesInNextRound = firstRoundMatchCount / 2;
    while (matchesInNextRound >= 1) {
      const nextRoundName = getRoundName(matchesInNextRound);
      
      const nextRoundMatches: any[] = [];
      for (let i = 0; i < matchesInNextRound; i++) {
        const prev1 = currentRoundMatches[i * 2];
        const prev2 = currentRoundMatches[i * 2 + 1];
        
        const p1Id = prev1?.winnerId || null;
        const p2Id = prev2?.winnerId || null;
        
        const matchObj = {
          tournamentId,
          categoryId,
          matchType,
          player1Id: p1Id,
          player2Id: p2Id,
          round: nextRoundName,
          matchNumber: matchNumber++,
          scheduledTime: startDate,
          status: MatchStatus.SCHEDULED,
          winnerId: null,
          score: null,
        };
        nextRoundMatches.push(matchObj);
        matches.push(matchObj);
      }
      currentRoundMatches = nextRoundMatches;
      matchesInNextRound /= 2;
    }

    // ── 3rd Place Playoff ──
    
    return matches;
  }

  // Helper method for standard seeded round names
  private getRoundName(numMatches: number): string {
    if (numMatches === 1) return 'Final';
    if (numMatches === 2) return 'Semi-Finals';
    if (numMatches === 4) return 'Quarter-Finals';
    if (numMatches === 8) return 'Round of 16';
    if (numMatches === 16) return 'Round of 32';
    return `Round of ${numMatches * 2}`;
  }

  // Helper method for standard tournament seeded match order (places byes on opposite ends)
  private getSeededMatchOrder(numMatches: number): number[] {
    if (numMatches === 1) return [0];
    if (numMatches === 2) return [0, 1];
    if (numMatches === 4) return [0, 3, 1, 2];
    if (numMatches === 8) return [0, 7, 3, 4, 1, 6, 2, 5];
    if (numMatches === 16) return [0, 15, 7, 8, 3, 12, 4, 11, 1, 14, 6, 9, 2, 13, 5, 10];
    return Array.from({ length: numMatches }, (_, i) => i);
  }

  // ==============================
  // GET ROUND LEVELS (DEPRECATED - kept for compatibility)
  // ==============================
  private getRoundLevels(size: number): string[] {
    const levels: string[] = [];
    let s = size;
    
    while (s >= 2) {
      if (s === 2) levels.push('Final');
      else if (s === 4) levels.push('Semi-Finals');
      else if (s === 8) levels.push('Quarter-Finals');
      else if (s === 16) levels.push('Round of 16');
      else if (s === 32) levels.push('Round of 32');
      else levels.push(`Round of ${s}`);
      s = s / 2;
    }
    
    return levels.reverse();
  }

  // ==============================
  // SEED POSITIONS (STANDARD)
  // ==============================
  private getSeededPositions(size: number): number[] {
    if (size === 2) return [1, 2];
    if (size === 4) return [1, 4, 3, 2];
    if (size === 8) return [1, 8, 5, 4, 3, 6, 7, 2];
    if (size === 16) return [1, 16, 9, 8, 5, 12, 13, 4, 3, 14, 11, 6, 7, 10, 15, 2];

    return Array.from({ length: size }, (_, i) => i + 1);
  }

  // ==============================
  // POWER OF 2
  // ==============================
  private nextPowerOfTwo(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }

  // ==============================
  // SEED PLAYERS
  // ==============================
  private async seedPlayers(players: any[]): Promise<SeededPlayer[]> {

    const stats = await Promise.all(players.map(async p => {

      const profile = await prisma.playerProfile.findUnique({
        where: { userId: p.id },
        select: { ranking: true, skillLevel: true },
      });

      const base =
        profile?.skillLevel === 'PROFESSIONAL' ? 1 :
        profile?.skillLevel === 'ADVANCED' ? 0.75 :
        profile?.skillLevel === 'INTERMEDIATE' ? 0.5 : 0.25;

      const score = profile?.ranking
        ? 10000 - profile.ranking
        : base * 100 + Math.random() * 5;

      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        skillScore: Math.round(score),
        seed: 0,
      };
    }));

    stats.sort((a, b) => b.skillScore - a.skillScore);

    return stats.map((p, i) => ({ ...p, seed: i + 1 }));
  }

  // ==============================
  // GET BRACKET
  // ==============================
  async getBracket(tournamentId: string, categoryId: string) {
    const matches = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      include: {
        player1: true,
        player2: true,
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
        referee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImage: true,
              },
            },
          },
        },
      },
      orderBy: { matchNumber: 'asc' },
    });

    const rounds: Record<string, any[]> = {};

    matches.forEach(m => {
      if (!rounds[m.round]) rounds[m.round] = [];
      rounds[m.round].push(m);
    });

    return { tournamentId, categoryId, rounds };
  }
}