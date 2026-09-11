import { z } from 'zod';

export const registerTournamentSchema = z.object({
  body: z.object({
    tournamentId: z.string().cuid('Invalid tournament ID'),
    categoryId: z.string().cuid('Invalid category ID').optional(),
    teamId: z.string().cuid('Invalid team ID').optional(),
  }),
});

export const processRegistrationSchema = z.object({
  params: z.object({
    registrationId: z.string().cuid('Invalid registration ID'),
  }),
  body: z.object({
    action: z.enum(['APPROVE', 'REJECT']),
    rejectionReason: z.string().optional(),
  }),
});