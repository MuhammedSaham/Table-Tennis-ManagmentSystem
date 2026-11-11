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

export const createUserSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        phone: z.string().optional(),
        role: z.enum(['ADMIN', 'REFEREE', 'PLAYER']),
        playerProfile: z.object({
            dateOfBirth: z.coerce.date().optional(),
            skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
            clubAffiliation: z.string().optional(),
            gender: z.enum(['MALE', 'FEMALE']).optional(),
            isClubMember: z.boolean().optional(),
        }).optional(),
        refereeProfile: z.object({
            certification: z.string().optional(),
            experienceYears: z.number().int().min(0).optional(),
        }).optional(),
        adminProfile: z.object({
            department: z.string().optional(),
        }).optional(),
    }),
});