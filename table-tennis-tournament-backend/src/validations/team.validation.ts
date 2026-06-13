import { z } from 'zod';

export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Team name must be at least 2 characters'),
    tournamentId: z.string().cuid('Invalid tournament ID').optional(),
    categoryId: z.string().cuid('Invalid category ID').optional(),
    captainId: z.string().cuid('Invalid captain ID'),
    memberIds: z.array(z.string().cuid()).optional().default([]),
    partnerDetails: z.object({
      firstName: z.string().min(1, 'Partner first name is required'),
      lastName: z.string().min(1, 'Partner last name is required'),
      email: z.string().email('Invalid partner email'),
      phone: z.string().optional(),
    }).optional(),
  }).refine(data => {
    // If it's a doubles registration (has partner details), validate partner fields
    if (data.partnerDetails) {
      return data.partnerDetails.firstName && data.partnerDetails.lastName && data.partnerDetails.email;
    }
    return true;
  }, {
    message: 'Partner details are required for team registration',
    path: ['partnerDetails'],
  }),
});