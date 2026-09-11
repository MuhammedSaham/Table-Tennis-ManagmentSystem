import { z } from 'zod';

export const updateProfileSchema = z.object({
    body: z.object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        phone: z.string().optional(),
        profileImage: z.string().url().optional(),
        playerProfile: z.object({
            dateOfBirth: z.string().datetime().optional(),
            skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
            clubAffiliation: z.string().optional(),
            gender: z.enum(['MALE', 'FEMALE']).optional(),
        }).optional(),
    }),
});

export const updateUserRoleSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
    body: z.object({
        role: z.enum(['ADMIN', 'REFEREE', 'PLAYER']),
    }),
});