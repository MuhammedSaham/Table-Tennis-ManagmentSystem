import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { config } from '../config/env';
import { sendPasswordResetEmail } from './email.service';

export class AuthService {
    // Register new user with Admin Approval Workflow
    async register(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        role: 'SUPER_ADMIN' | 'ADMIN' | 'REFEREE' | 'PLAYER';
        adminRequestReason?: string;
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
        // Prevent public registration as SUPER_ADMIN
        if ((userData.role as string) === 'SUPER_ADMIN') {
            throw new AppError('Public registration as SUPER_ADMIN is prohibited', 400);
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (existingUser) {
            throw new AppError('Email already exists', 400);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, config.BCRYPT_SALT_ROUNDS);

        // Create user with role-specific profile in a transaction
        const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Set admin request status if registering as ADMIN
            let adminRequestStatus: any = 'NONE';
            let adminRequestedAt = null;
            let finalRole = userData.role;
            
            if (userData.role === 'ADMIN') {
                adminRequestStatus = 'PENDING';
                adminRequestedAt = new Date();
                finalRole = 'PLAYER'; // Temporarily set as PLAYER until approved
            }

            // Create base user
            const newUser = await tx.user.create({
                data: {
                    email: userData.email,
                    password: hashedPassword,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    phone: userData.phone,
                    role: finalRole as any,
                    adminRequestStatus,
                    adminRequestedAt,
                },
            });

            // Create role-specific profile (NOT for ADMIN yet - wait for approval)
            if (userData.role === 'PLAYER' && userData.playerProfile) {
                await tx.playerProfile.create({
                    data: {
                        userId: newUser.id,
                        dateOfBirth: userData.playerProfile.dateOfBirth,
                        skillLevel: userData.playerProfile.skillLevel,
                        clubAffiliation: userData.playerProfile.clubAffiliation,
                        gender: userData.playerProfile.gender,
                        isClubMember: userData.playerProfile.isClubMember ?? false,
                    },
                });
            } else if (userData.role === 'REFEREE' && userData.refereeProfile) {
                await tx.refereeProfile.create({
                    data: {
                        userId: newUser.id,
                        certification: userData.refereeProfile.certification,
                        experienceYears: userData.refereeProfile.experienceYears,
                    },
                });
            }

            return newUser;
        });

        // NOTIFY EXISTING SUPER ADMINS AND ADMINS ABOUT NEW ADMIN REQUEST
        if (userData.role === 'ADMIN') {
            try {
                // Get all existing super admins and admins
                const existingAdmins: Array<{ id: string }> = await prisma.user.findMany({
                    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
                    select: { id: true },
                });

                if (existingAdmins.length > 0) {
                    await prisma.notification.createMany({
                        data: existingAdmins.map((admin: { id: string }) => ({
                            userId: admin.id,
                            type: 'NEW_ADMIN_REQUEST' as any,
                            title: '👑 New Admin Request',
                            message: `${userData.firstName} ${userData.lastName} (${userData.email}) has requested to become an administrator. Go to Admin Requests to review.`,
                            createdAt: new Date(),
                        })),
                    });
                }
            } catch (error) {
                console.error('Failed to notify admins:', error);
            }
        }

        // Generate JWT token
        const token = this.generateToken(user.id);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: userData.role === 'ADMIN' ? 'PENDING_ADMIN' : user.role,
                adminRequestStatus: user.adminRequestStatus,
                permissions: [],
                isEmailVerified: true,
            } as any,
            token,
            message: 'Registration successful! Please check your email to verify your account.',
        };
    }

    // Login user
    async login(email: string, password: string) {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                playerProfile: true,
                refereeProfile: true,
                adminProfile: true,
                adminPermissions: true,
            },
        });

        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }

        // Generate token
        const token = this.generateToken(user.id);

        // Get role-specific profile
        let profile = null;
        if (user.role === 'PLAYER') profile = user.playerProfile;
        else if (user.role === 'REFEREE') profile = user.refereeProfile;
        else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') profile = user.adminProfile;

        // Compute permissions list
        let permissions: string[] = [];
        if (user.role === 'SUPER_ADMIN') {
            permissions = [
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
        } else if (user.role === 'ADMIN') {
            permissions = user.adminPermissions.map((p) => p.permission);
        }

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                adminRequestStatus: user.adminRequestStatus,
                isSuperAdmin: user.role === 'SUPER_ADMIN' || user.isSuperAdmin,
                permissions,
                profile,
            },
            token,
        };
    }

    // Generate JWT token
    private generateToken(userId: string): string {
        try {
            const payload = { userId };
            const secret: string = config.JWT_SECRET;
            return jwt.sign(payload, secret, { expiresIn: '7d' });
        } catch (error) {
            console.error('Token generation error:', error);
            throw new AppError('Error generating authentication token', 500);
        }
    }

    // Verify token and get user
    async verifyToken(token: string) {
        try {
            const secret: string = config.JWT_SECRET;
            const decoded = jwt.verify(token, secret) as { userId: string };

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    adminRequestStatus: true,
                    isSuperAdmin: true,
                    adminPermissions: {
                        select: {
                            permission: true,
                        },
                    },
                },
            });

            if (!user) {
                throw new AppError('User not found', 401);
            }

            let permissions: string[] = [];
            if (user.role === 'SUPER_ADMIN') {
                permissions = [
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
            } else if (user.role === 'ADMIN') {
                permissions = user.adminPermissions.map((p) => p.permission);
            }

            return {
                ...user,
                isSuperAdmin: user.role === 'SUPER_ADMIN' || user.isSuperAdmin,
                permissions,
            };
        } catch (error) {
            throw new AppError('Invalid token', 401);
        }
    }

    // Forgot password - generate a single-use reset token and email it to the user.
    async forgotPassword(email: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { message: 'If your email is registered, you will receive a reset link.' };
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000);

        await sendPasswordResetEmail(email, resetToken);
        await prisma.user.update({
            where: { email },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpiry: resetTokenExpiry,
            },
        });

        return { message: 'If your email is registered, you will receive a reset link.' };
    }

    // Reset password - verify token and set new password
    async resetPassword(token: string, newPassword: string) {
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            throw new AppError('Invalid or expired reset token', 400);
        }

        const hashedPassword = await bcrypt.hash(newPassword, config.BCRYPT_SALT_ROUNDS);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpiry: null,
            },
        });

        return { message: 'Password reset successful. You can now login with your new password.' };
    }
}