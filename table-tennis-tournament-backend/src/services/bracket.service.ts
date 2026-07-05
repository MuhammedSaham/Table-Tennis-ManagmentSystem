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
      startDate
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

  // ==============================
  // BRACKET BUILDER (COMPLETELY REWRITTEN)
  // ==============================
  private buildBracket(
    tournamentId: string,
    categoryId: string,
    seededPlayers: SeededPlayer[],
    bracketSize: number,
    startDate: Date,
  ): any[] {

    const matches: any[] = [];
    let matchNumber = 1;

    // STEP 1: create slots
    const slots: (string | null)[] = Array(bracketSize).fill(null);
    const positions = this.getSeededPositions(bracketSize);

    seededPlayers.forEach((p, i) => {
      slots[positions[i] - 1] = p.id;
    });

    // STEP 2: Determine round structure based on bracket size
    let currentRoundPlayers: (string | null)[] = slots;
    let roundLevel = this.getRoundLevels(bracketSize);
    let roundIndex = 0;

    // For 4 players, roundLevels = ['Quarter Finals', 'Semi Finals', 'Final']
    // But we need to skip Quarter Finals if there are exactly 4 players
    // Actually, with 4 players, we want: Semi Finals -> Final -> 3rd Place
    // With 8 players: Quarter Finals -> Semi Finals -> Final -> 3rd Place
    
    // Calculate total rounds needed
    const totalRounds = Math.log2(bracketSize);
    const roundsToCreate: string[] = [];
    
    // Build round names from first to last
    if (bracketSize === 2) {
      roundsToCreate.push('Final');
    } else if (bracketSize === 4) {
      roundsToCreate.push('Semi-Finals');
      roundsToCreate.push('Final');
    } else if (bracketSize === 8) {
      roundsToCreate.push('Quarter-Finals');
      roundsToCreate.push('Semi-Finals');
      roundsToCreate.push('Final');
    } else if (bracketSize === 16) {
      roundsToCreate.push('Round of 16');
      roundsToCreate.push('Quarter-Finals');
      roundsToCreate.push('Semi-Finals');
      roundsToCreate.push('Final');
    } else if (bracketSize === 32) {
      roundsToCreate.push('Round of 32');
      roundsToCreate.push('Round of 16');
      roundsToCreate.push('Quarter-Finals');
      roundsToCreate.push('Semi-Finals');
      roundsToCreate.push('Final');
    }

    // Create matches for each round
    while (currentRoundPlayers.length > 1) {

  const roundName =
    roundsToCreate[roundIndex] || `Round ${roundIndex + 1}`;

  const nextRoundPlayers: (string | null | "WINNER_SLOT")[] = [];

  for (let i = 0; i < currentRoundPlayers.length; i += 2) {

    const p1 = currentRoundPlayers[i];
    const p2 = currentRoundPlayers[i + 1];

    // both empty
    if (!p1 && !p2) {
      nextRoundPlayers.push(null);
      continue;
    }

    // first round byes
    if (roundIndex === 0 && p1 && !p2) {
      nextRoundPlayers.push(p1);
      continue;
    }

    if (roundIndex === 0 && !p1 && p2) {
      nextRoundPlayers.push(p2);
      continue;
    }

    // later round placeholder matches
    if (p1 && !p2) {
      matches.push({
        tournamentId,
        categoryId,
        matchType: MatchType.SINGLES,
        round: roundName,
        matchNumber: matchNumber++,
        scheduledTime: startDate,
        player1Id: p1,
        player2Id: null,
        status: MatchStatus.SCHEDULED,
        winnerId: null,
        score: null,
      });

      nextRoundPlayers.push("WINNER_SLOT" as any);
      continue;
    }

    if (!p1 && p2) {
      matches.push({
        tournamentId,
        categoryId,
        matchType: MatchType.SINGLES,
        round: roundName,
        matchNumber: matchNumber++,
        scheduledTime: startDate,
        player1Id: null,
        player2Id: p2,
        status: MatchStatus.SCHEDULED,
        winnerId: null,
        score: null,
      });

      nextRoundPlayers.push("WINNER_SLOT" as any);
      continue;
    }

    // normal match
    matches.push({
      tournamentId,
      categoryId,
      matchType: MatchType.SINGLES,
      round: roundName,
      matchNumber: matchNumber++,
      scheduledTime: startDate,
      player1Id: p1 === "WINNER_SLOT" ? null : p1,
      player2Id: p2 === "WINNER_SLOT" ? null : p2,
      status: MatchStatus.SCHEDULED,
      winnerId: null,
      score: null,
    });

    nextRoundPlayers.push("WINNER_SLOT" as any);
  }

  currentRoundPlayers = nextRoundPlayers;
  roundIndex++;
}
    // ==============================
    // 3RD PLACE PLAYOFF
    // ==============================
    if (bracketSize >= 4) {
      // We need to store the losers from the semi-finals for the 3rd place match
      // But since we're generating the bracket statically, we'll just create the match
      matches.push({
        tournamentId,
        categoryId,
        matchType: MatchType.SINGLES,
        round: '3rd Place Playoff',
        matchNumber: matchNumber++,
        scheduledTime: startDate,
        player1Id: null,
        player2Id: null,
        status: MatchStatus.SCHEDULED,
        winnerId: null,
        score: null,
      });
    }

    return matches;
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