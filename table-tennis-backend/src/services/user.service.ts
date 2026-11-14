import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcrypt';
import { config } from '../config/env';

export class UserService {
    async createUser(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        role: 'ADMIN' | 'REFEREE' | 'PLAYER';
        playerProfile?: {
            dateOfBirth?: Date;
            skillLevel?: string;
            clubAffiliation?: string;
            gender?: 'MALE' | 'FEMALE';
            isClubMember?: boolean;
        };
        refereeProfile?: {
            certification?: string;
            experienceYears?: number;
        };
        adminProfile?: {
            department?: string;
        };
    }) {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new AppError('Email already exists', 400);
        }

        const password = await bcrypt.hash(data.password, config.BCRYPT_SALT_ROUNDS);
        const user = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    email: data.email,
                    password,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    role: data.role,
                    isSuperAdmin: false,
                    adminRequestStatus: data.role === 'ADMIN' ? 'APPROVED' : 'NONE',
                    ...(data.playerProfile
                        ? { playerProfile: { create: data.playerProfile } }
                        : {}),
                    ...(data.refereeProfile
                        ? { refereeProfile: { create: data.refereeProfile } }
                        : {}),
                    ...(data.adminProfile
                        ? { adminProfile: { create: data.adminProfile } }
                        : {}),
                },
                include: {
                    playerProfile: true,
                    refereeProfile: true,
                    adminProfile: true,
                },
            });
            return createdUser;
        });

        const { password: _password, ...safeUser } = user;
        return safeUser;
    }

    // Get user profile by ID
    async getUserProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                playerProfile: true,
                refereeProfile: true,
                adminProfile: true,
                adminPermissions: true,
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const allPermissions = [
            'MANAGE_USERS',
            'MANAGE_PLAYERS',
            'MANAGE_REFEREES',
            'MANAGE_TOURNAMENTS',
            'MANAGE_REGISTRATIONS',
            'MANAGE_MATCHES',
            'MANAGE_RESULTS',
            'MANAGE_RANKINGS',
            'MANAGE_CLUB_MEMBERSHIPS',
        ];

        let permissions: string[] = [];
        if (user.role === 'SUPER_ADMIN') {
            permissions = allPermissions;
        } else if (user.role === 'ADMIN') {
            permissions = user.adminPermissions?.map((p) => p.permission) || [];
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        return {
            ...userWithoutPassword,
            permissions,
        };
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
        await prisma.user.update({
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
                adminPermissions: true,
            },
        });

        const allPermissions = [
            'MANAGE_USERS',
            'MANAGE_PLAYERS',
            'MANAGE_REFEREES',
            'MANAGE_TOURNAMENTS',
            'MANAGE_REGISTRATIONS',
            'MANAGE_MATCHES',
            'MANAGE_RESULTS',
            'MANAGE_RANKINGS',
            'MANAGE_CLUB_MEMBERSHIPS',
        ];

        let permissions: string[] = [];
        if (freshUser!.role === 'SUPER_ADMIN') {
            permissions = allPermissions;
        } else if (freshUser!.role === 'ADMIN') {
            permissions = freshUser!.adminPermissions?.map((p) => p.permission) || [];
        }

        const { password, ...userWithoutPassword } = freshUser!;
        return {
            ...userWithoutPassword,
            permissions,
        };
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
                profileImage: true,
                adminPermissions: {
                    select: {
                        permission: true,
                    },
                },
                playerProfile: {
                    select: {
                        ranking: true,
                        rankingNote: true,
                        skillLevel: true,
                        clubAffiliation: true,
                        dateOfBirth: true,
                        gender: true,
                        isClubMember: true,
                    }
                },
                refereeProfile: true,
                adminProfile: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const allPermissions = [
            'MANAGE_USERS',
            'MANAGE_PLAYERS',
            'MANAGE_REFEREES',
            'MANAGE_TOURNAMENTS',
            'MANAGE_REGISTRATIONS',
            'MANAGE_MATCHES',
            'MANAGE_RESULTS',
            'MANAGE_RANKINGS',
            'MANAGE_CLUB_MEMBERSHIPS',
        ];

        // Transform the data to include ranking and permissions at root level for easier frontend access
        const transformedUsers = users.map(user => {
            let permissions: string[] = [];
            if (user.role === 'SUPER_ADMIN') {
                permissions = allPermissions;
            } else if (user.role === 'ADMIN') {
                permissions = user.adminPermissions.map((p) => p.permission);
            }

            return {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phone: user.phone,
                createdAt: user.createdAt,
                isSuperAdmin: user.role === 'SUPER_ADMIN' || user.isSuperAdmin,
                permissions,
                ranking: user.playerProfile?.ranking || null,
                rankingNote: user.playerProfile?.rankingNote || null,
                skillLevel: user.playerProfile?.skillLevel || null,
                clubAffiliation: user.playerProfile?.clubAffiliation || null,
                dateOfBirth: user.playerProfile?.dateOfBirth || null,
                gender: user.playerProfile?.gender || null,
                isClubMember: user.playerProfile?.isClubMember ?? false,
                playerProfile: user.playerProfile,
                refereeProfile: user.refereeProfile,
                adminProfile: user.adminProfile,
            };
        });

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
                profileImage: true,
                adminPermissions: {
                    select: {
                        permission: true,
                    },
                },
                playerProfile: {
                    select: {
                        ranking: true,
                        rankingNote: true,
                        skillLevel: true,
                        clubAffiliation: true,
                        dateOfBirth: true,
                    }
                },
                refereeProfile: {
                    include: {
                        matches: {
                            select: {
                                id: true,
                                round: true,
                                matchNumber: true,
                                status: true,
                                score: true,
                                scheduledTime: true,
                                startTime: true,
                                endTime: true,
                                tournament: { select: { id: true, name: true } },
                                category: { select: { id: true, name: true } },
                                player1: { select: { id: true, firstName: true, lastName: true } },
                                player2: { select: { id: true, firstName: true, lastName: true } },
                                team1: { select: { id: true, name: true } },
                                team2: { select: { id: true, name: true } },
                            },
                            orderBy: { scheduledTime: 'desc' },
                        },
                        groupMatches: {
                            select: {
                                id: true,
                                status: true,
                                scheduledTime: true,
                                startTime: true,
                                endTime: true,
                                player1Score: true,
                                player2Score: true,
                                player1: { select: { id: true, firstName: true, lastName: true } },
                                player2: { select: { id: true, firstName: true, lastName: true } },
                                team1: { select: { id: true, name: true } },
                                team2: { select: { id: true, name: true } },
                                group: {
                                    select: {
                                        tournament: { select: { id: true, name: true } },
                                        category: { select: { id: true, name: true } },
                                    },
                                },
                            },
                            orderBy: { scheduledTime: 'desc' },
                        },
                    },
                },
                adminProfile: true,
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const allPermissions = [
            'MANAGE_USERS',
            'MANAGE_PLAYERS',
            'MANAGE_REFEREES',
            'MANAGE_TOURNAMENTS',
            'MANAGE_REGISTRATIONS',
            'MANAGE_MATCHES',
            'MANAGE_RESULTS',
            'MANAGE_RANKINGS',
            'MANAGE_CLUB_MEMBERSHIPS',
        ];

        let permissions: string[] = [];
        if (user.role === 'SUPER_ADMIN') {
            permissions = allPermissions;
        } else if (user.role === 'ADMIN') {
            permissions = user.adminPermissions.map((p) => p.permission);
        }

        const transformedUser = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
            createdAt: user.createdAt,
            isSuperAdmin: user.role === 'SUPER_ADMIN' || user.isSuperAdmin,
            profileImage: user.profileImage,
            permissions,
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
    async updateUserRole(userId: string, newRole: 'SUPER_ADMIN' | 'ADMIN' | 'REFEREE' | 'PLAYER') {
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

        // Prevent changing SUPER_ADMIN user role away from SUPER_ADMIN
        if (user.role === 'SUPER_ADMIN' && newRole !== 'SUPER_ADMIN') {
            throw new AppError('The Super Admin role cannot be changed', 400);
        }

        // Update user role
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole, isSuperAdmin: newRole === 'SUPER_ADMIN' },
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
        } else if ((newRole === 'ADMIN' || newRole === 'SUPER_ADMIN') && !user.adminProfile) {
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