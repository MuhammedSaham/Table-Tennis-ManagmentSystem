import prisma from '../config/database';
import { AppError } from '../utils/AppError';

export class UserService {
    // Get user profile by ID
    async getUserProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                playerProfile: true,
                refereeProfile: true,
                adminProfile: true,
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        return userWithoutPassword;
    }

    // Update user profile
    async updateUserProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        profileImage?: string;
        playerProfile?: {
            dateOfBirth?: Date;
            skillLevel?: string;
            clubAffiliation?: string;
            gender?: 'MALE' | 'FEMALE';
        };
    }) {
        // Update base user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                profileImage: data.profileImage,
            },
            include: {
                playerProfile: true,
                refereeProfile: true,
                adminProfile: true,
            },
        });

        // Update player profile if provided
        if (data.playerProfile) {
            await prisma.playerProfile.upsert({
                where: { userId },
                update: data.playerProfile,
                create: {
                    userId,
                    ...data.playerProfile,
                },
            });
        }

        // Fetch fresh user data
        const freshUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                playerProfile: true,
                refereeProfile: true,
                adminProfile: true,
            },
        });

        const { password, ...userWithoutPassword } = freshUser!;
        return userWithoutPassword;
    }

    // Get all users (Admin only)
    async getAllUsers() {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                createdAt: true,
                isSuperAdmin: true,
                playerProfile: {
                    select: {
                        ranking: true,
                        rankingNote: true,
                        skillLevel: true,
                        clubAffiliation: true,
                        dateOfBirth: true,
                        isClubMember: true,
                    }
                },
                refereeProfile: true,
                adminProfile: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Transform the data to include ranking at root level for easier frontend access
        const transformedUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
            createdAt: user.createdAt,
            isSuperAdmin: user.isSuperAdmin,
            // Include player profile data at root level
            ranking: user.playerProfile?.ranking || null,
            rankingNote: user.playerProfile?.rankingNote || null,
            skillLevel: user.playerProfile?.skillLevel || null,
            clubAffiliation: user.playerProfile?.clubAffiliation || null,
            dateOfBirth: user.playerProfile?.dateOfBirth || null,
            isClubMember: user.playerProfile?.isClubMember ?? false,
            // Keep original profiles if needed elsewhere
            playerProfile: user.playerProfile,
            refereeProfile: user.refereeProfile,
            adminProfile: user.adminProfile,
        }));

        return transformedUsers;
    }

    // Get user by ID (Admin only)
    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                createdAt: true,
                isSuperAdmin: true,
                playerProfile: {
                    select: {
                        ranking: true,
                        rankingNote: true,
                        skillLevel: true,
                        clubAffiliation: true,
                        dateOfBirth: true,
                    }
                },
                refereeProfile: true,
                adminProfile: true,
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Transform to include ranking at root level
        const transformedUser = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
            createdAt: user.createdAt,
            isSuperAdmin: user.isSuperAdmin,
            ranking: user.playerProfile?.ranking || null,
            rankingNote: user.playerProfile?.rankingNote || null,
            skillLevel: user.playerProfile?.skillLevel || null,
            clubAffiliation: user.playerProfile?.clubAffiliation || null,
            dateOfBirth: user.playerProfile?.dateOfBirth || null,
            playerProfile: user.playerProfile,
            refereeProfile: user.refereeProfile,
            adminProfile: user.adminProfile,
        };

        return transformedUser;
    }

    // Update user role (Admin only)
    async updateUserRole(userId: string, newRole: 'ADMIN' | 'REFEREE' | 'PLAYER') {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                playerProfile: true,
                refereeProfile: true,
                adminProfile: true,
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Update user role
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
            },
        });

        // Create appropriate profile if needed
        if (newRole === 'PLAYER' && !user.playerProfile) {
            await prisma.playerProfile.create({
                data: { userId },
            });
        } else if (newRole === 'REFEREE' && !user.refereeProfile) {
            await prisma.refereeProfile.create({
                data: { userId },
            });
        } else if (newRole === 'ADMIN' && !user.adminProfile) {
            await prisma.adminProfile.create({
                data: { userId, department: 'General' },
            });
        }

        return updatedUser;
    }

    // Delete user (Admin only)
    async deleteUser(userId: string) {
        // First delete all related records
        await prisma.$transaction([
            prisma.notification.deleteMany({ where: { userId } }),
            prisma.tournamentRegistration.deleteMany({ where: { playerId: userId } }),
            prisma.teamMember.deleteMany({ where: { playerId: userId } }),
            prisma.playerProfile.deleteMany({ where: { userId } }),
            prisma.refereeProfile.deleteMany({ where: { userId } }),
            prisma.adminProfile.deleteMany({ where: { userId } }),
            prisma.user.delete({ where: { id: userId } }),
        ]);

        return { message: 'User deleted successfully' };
    }
}