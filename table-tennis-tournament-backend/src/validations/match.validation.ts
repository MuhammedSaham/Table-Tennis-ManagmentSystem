import { z } from 'zod';

export const createMatchSchema = z.object({
  body: z.object({
    tournamentId: z.string().cuid('Invalid tournament ID'),
    categoryId: z.string().cuid('Invalid category ID'),
    matchType: z.enum(['SINGLES', 'DOUBLES', 'TEAM']),
    player1Id: z.string().cuid().optional(),
    player2Id: z.string().cuid().optional(),
    team1Id: z.string().cuid().optional(),
    team2Id: z.string().cuid().optional(),
    refereeId: z.string().cuid().optional(),
    round: z.string().min(1, 'Round is required'),
    matchNumber: z.number().int().positive(),
    scheduledTime: z.string().datetime('Invalid date format'),
  }).refine(data => {
    if (data.matchType !== 'TEAM') {
      return data.player1Id && data.player2Id;
    }
    return true;
  }, {
    message: 'Both players are required for singles/doubles matches',
    path: ['player2Id'],
  }).refine(data => {
    if (data.matchType === 'TEAM') {
      return data.team1Id && data.team2Id;
    }
    return true;
  }, {
    message: 'Both teams are required for team matches',
    path: ['team2Id'],
  }),
});

export const updateMatchStatusSchema = z.object({
  params: z.object({
    matchId: z.string().cuid('Invalid match ID'),
  }),
  body: z.object({
    status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'WALKOVER']),
  }),
});

export const assignRefereeSchema = z.object({
  params: z.object({
    matchId: z.string().cuid('Invalid match ID'),
  }),
  body: z.object({
    refereeUserId: z.string().cuid('Invalid referee user ID'),
  }),
});

// Add this schema
export const recordScoresSchema = z.object({
  params: z.object({
    matchId: z.string().cuid('Invalid match ID'),
  }),
  body: z.object({
    games: z.array(z.object({
      gameNumber: z.number().int().min(1),
      player1Score: z.number().int().min(0),
      player2Score: z.number().int().min(0),
    })).min(1, 'At least one game is required')
      .max(7, 'Maximum 7 games per match'),
  }),
});