import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcrypt';

export class TeamService {
  // Helper method to generate random password
  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + 'Aa1';
  }

  // Create team (Player can create for doubles, Admin can create any)
  async createTeam(adminId: string, data: {
    name: string;
    tournamentId?: string;
    categoryId?: string;
    captainId: string;
    memberIds: string[];
    partnerDetails?: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  }) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    const isPlayerCreatingTeam = !admin && data.partnerDetails;

    // Allow if user is admin OR if it's a player creating a doubles team (with partner details)
    if (!admin && !data.partnerDetails) {
      throw new AppError('You must provide partner details for doubles registration', 403);
    }

    let partnerUser = null;
    
    // If partner details provided, create or find partner
    if (data.partnerDetails) {
      // Check if partner already exists
      partnerUser = await prisma.user.findUnique({
        where: { email: data.partnerDetails.email },
      });
      
      if (!partnerUser) {
        // Create new user for partner
        const randomPassword = this.generateRandomPassword();
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        partnerUser = await prisma.user.create({
          data: {
            email: data.partnerDetails.email,
            password: hashedPassword,
            firstName: data.partnerDetails.firstName,
            lastName: data.partnerDetails.lastName,
            phone: data.partnerDetails.phone,
            role: 'PLAYER',
            playerProfile: {
              create: {
                skillLevel: 'Intermediate',
              },
            },
          },
        });
        
        // Log credentials (in production, send email)
        console.log(`========================================`);
        console.log(`🔐 New Partner Account Created`);
        console.log(`📧 Email: ${data.partnerDetails.email}`);
        console.log(`🔑 Password: ${randomPassword}`);
        console.log(`========================================`);
      }
      
      data.memberIds.push(partnerUser.id);
    }

    // Verify captain exists
    const captain = await prisma.user.findFirst({
      where: { id: data.captainId, role: 'PLAYER' },
    });

    if (!captain) {
      throw new AppError('Captain must be a registered player', 404);
    }

    // Ensure captain is in member list
    if (!data.memberIds.includes(data.captainId)) {
      data.memberIds.push(data.captainId);
    }

    // Remove duplicates (in case captain was added twice)
    const uniqueMemberIds = [...new Set(data.memberIds)];

    // Verify all members are players
    const members = await prisma.user.findMany({
      where: {
        id: { in: uniqueMemberIds },
        role: 'PLAYER',
      },
    });

    if (members.length !== uniqueMemberIds.length) {
      throw new AppError('All team members must be registered players', 400);
    }

    // Create team
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: data.name,
          tournamentId: data.tournamentId,
          captainId: data.captainId,
        },
      });

      await tx.teamMember.createMany({
        data: uniqueMemberIds.map(memberId => ({
          teamId: newTeam.id,
          playerId: memberId,
        })),
      });

      return newTeam;
    });

    // Create tournament registration for the team
    if (data.tournamentId && data.categoryId) {
      await prisma.tournamentRegistration.create({
        data: {
          tournamentId: data.tournamentId,
          categoryId: data.categoryId,
          playerId: data.captainId,
          teamId: team.id,
          status: 'PENDING',
        },
      });
    }

    return team;
  }

  // Get team by ID
  async getTeamById(teamId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        captain: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                playerProfile: true,
              },
            },
          },
        },
        tournament: true,
      },
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    return team;
  }

  // Get all teams for tournament
  async getTournamentTeams(tournamentId: string) {
    const teams = await prisma.team.findMany({
      where: { tournamentId },
      include: {
        captain: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        members: {
          include: {
            player: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return teams;
  }

  // ─── DOUBLES INVITE METHODS ─────────────────────────────────────────────────

  // Helper to determine category division
  private getCategoryDivision(category: { type: string; gender?: string | null; name: string }): 'MIXED' | 'MEN' | 'WOMEN' | 'OPEN' {
    const nameLower = category.name.toLowerCase();

    // Mixed doubles check
    if (
      category.type === 'MIXED_DOUBLES' ||
      category.gender === 'MIXED' ||
      nameLower.includes('mix')
    ) {
      return 'MIXED';
    }

    // Women's doubles check
    if (
      category.gender === 'FEMALE' ||
      nameLower.includes('women') ||
      nameLower.includes('girl') ||
      nameLower.includes('female')
    ) {
      return 'WOMEN';
    }

    // Men's doubles check
    if (
      category.gender === 'MALE' ||
      ((nameLower.includes('men') || nameLower.includes('boy') || nameLower.includes('male')) && !nameLower.includes('women'))
    ) {
      return 'MEN';
    }

    return 'OPEN';
  }

  // Search all PLAYER accounts by name or email (for partner selection)
  async searchPartners(query: string, excludeUserId: string, categoryId?: string) {
    const excludeIds = [excludeUserId];

    let genderFilter: any = undefined;

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (category) {
        // Exclude players already registered in this category
        const existingRegistrations = await prisma.tournamentRegistration.findMany({
          where: { categoryId, status: { in: ['PENDING', 'APPROVED'] } },
          select: { playerId: true, team: { select: { members: { select: { playerId: true } } } } },
        });

        for (const reg of existingRegistrations) {
          if (reg.playerId) excludeIds.push(reg.playerId);
          if (reg.team?.members) {
            for (const m of reg.team.members) {
              excludeIds.push(m.playerId);
            }
          }
        }

        const inviterProfile = await prisma.playerProfile.findUnique({
          where: { userId: excludeUserId },
          select: { gender: true },
        });

        const division = this.getCategoryDivision(category);

        if (division === 'MIXED') {
          // In Mixed Doubles:
          // A male player can ONLY search and see female players
          // A female player can ONLY search and see male players
          if (inviterProfile?.gender === 'MALE') {
            genderFilter = 'FEMALE';
          } else if (inviterProfile?.gender === 'FEMALE') {
            genderFilter = 'MALE';
          } else {
            return []; // Cannot determine opposite gender if gender not set
          }
        } else if (division === 'MEN') {
          // In Men's Doubles: only male players can participate, and only search males
          if (inviterProfile?.gender !== 'MALE') {
            return [];
          }
          genderFilter = 'MALE';
        } else if (division === 'WOMEN') {
          // In Women's Doubles: only female players can participate, and only search females
          if (inviterProfile?.gender !== 'FEMALE') {
            return [];
          }
          genderFilter = 'FEMALE';
        } else if (category.gender && category.gender !== 'MIXED') {
          genderFilter = category.gender;
        }
      }
    }

    const uniqueExcludeIds = [...new Set(excludeIds)];

    const whereClause: any = {
      role: 'PLAYER',
      id: { notIn: uniqueExcludeIds },
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (genderFilter) {
      whereClause.playerProfile = {
        gender: genderFilter,
      };
    }

    const players = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        playerProfile: {
          select: {
            gender: true,
            skillLevel: true,
            clubAffiliation: true,
          },
        },
      },
      take: 20,
    });
    return players;
  }

  // Send a doubles partner invite
  async sendInvite(inviterId: string, tournamentId: string, categoryId: string, inviteeId: string) {
    // Verify inviter is a player
    const inviter = await prisma.user.findFirst({
      where: { id: inviterId, role: 'PLAYER' },
      include: { playerProfile: { select: { gender: true } } },
    });
    if (!inviter) throw new AppError('Only players can send doubles invites', 403);

    // Verify invitee exists and is a player
    const invitee = await prisma.user.findFirst({
      where: { id: inviteeId, role: 'PLAYER' },
      include: { playerProfile: { select: { gender: true } } },
    });
    if (!invitee) throw new AppError('Invited partner must be a registered player', 404);

    // Verify tournament + category exist
    const category = await prisma.category.findFirst({
      where: { id: categoryId, tournamentId },
    });
    if (!category) throw new AppError('Category not found or is not a doubles category', 404);

    // Prevent inviting yourself
    if (inviterId === inviteeId) throw new AppError('You cannot invite yourself', 400);

    // Enforce gender constraints
    const inviterGender = inviter.playerProfile?.gender;
    const inviteeGender = invitee.playerProfile?.gender;
    const division = this.getCategoryDivision(category);

    if (division === 'MIXED') {
      if (!inviterGender || !inviteeGender) {
        throw new AppError('Both players must have a gender specified in their profile for mixed doubles', 400);
      }
      if (inviterGender === inviteeGender) {
        throw new AppError('Mixed doubles requires one male and one female player', 400);
      }
    } else if (division === 'MEN') {
      if (inviterGender !== 'MALE') {
        throw new AppError("Only male players can participate in Men's doubles", 400);
      }
      if (inviteeGender !== 'MALE') {
        throw new AppError("Men's doubles partner must be a male player", 400);
      }
    } else if (division === 'WOMEN') {
      if (inviterGender !== 'FEMALE') {
        throw new AppError("Only female players can participate in Women's doubles", 400);
      }
      if (inviteeGender !== 'FEMALE') {
        throw new AppError("Women's doubles partner must be a female player", 400);
      }
    }

    // Check if invitee already has a confirmed team in this category
    const inviteeExistingTeam = await prisma.tournamentRegistration.findFirst({
      where: { tournamentId, categoryId, playerId: inviteeId, status: { in: ['PENDING', 'APPROVED'] } },
    });
    if (inviteeExistingTeam) throw new AppError('This player already has a team registered for this category', 400);

    // Check if inviter already has a confirmed team in this category
    const inviterExistingTeam = await prisma.tournamentRegistration.findFirst({
      where: { tournamentId, categoryId, playerId: inviterId, status: { in: ['PENDING', 'APPROVED'] } },
    });
    if (inviterExistingTeam) throw new AppError('You already have a team registered for this category', 400);

    // Upsert the invite (cancel any existing one and create fresh)
    const invite = await prisma.doublesInvite.upsert({
      where: { tournamentId_categoryId_inviterId: { tournamentId, categoryId, inviterId } },
      update: { inviteeId, status: 'PENDING', updatedAt: new Date() },
      create: { tournamentId, categoryId, inviterId, inviteeId, status: 'PENDING' },
    });

    // Notify the invitee
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: inviteeId,
        type: 'DOUBLES_INVITE',
        title: 'Doubles Partner Invite',
        message: `${inviter.firstName} ${inviter.lastName} invited you to partner for ${tournament?.name ?? 'a tournament'} – ${category.name}. Invite ID: ${invite.id}`,
      },
    });

    return invite;
  }

  // Accept or decline an invite
  async respondToInvite(inviteeId: string, inviteId: string, accept: boolean) {
    const invite = await prisma.doublesInvite.findUnique({
      where: { id: inviteId },
      include: {
        inviter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            playerProfile: { select: { gender: true } },
          },
        },
        invitee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            playerProfile: { select: { gender: true } },
          },
        },
        tournament: { select: { name: true } },
        category: { select: { name: true, type: true, gender: true } },
      },
    });

    if (!invite) throw new AppError('Invite not found', 404);
    if (invite.inviteeId !== inviteeId) throw new AppError('This invite is not for you', 403);
    if (invite.status !== 'PENDING') throw new AppError('This invite has already been responded to', 400);

    if (!accept) {
      // DECLINE
      await prisma.doublesInvite.update({ where: { id: inviteId }, data: { status: 'DECLINED' } });
      await prisma.notification.updateMany({
        where: {
          userId: inviteeId,
          type: 'DOUBLES_INVITE',
          message: { contains: inviteId },
        },
        data: { isRead: true },
      });
      await prisma.notification.create({
        data: {
          userId: invite.inviterId,
          type: 'DOUBLES_INVITE_DECLINED',
          title: 'Doubles Invite Declined',
          message: `${invite.invitee.firstName} ${invite.invitee.lastName} declined your doubles invite for ${invite.tournament.name} – ${invite.category.name}.`,
        },
      });
      return { status: 'DECLINED' };
    }
    
    // Gender validation on acceptance
    const inviterGender = invite.inviter.playerProfile?.gender;
    const inviteeGender = invite.invitee.playerProfile?.gender;
    const division = this.getCategoryDivision(invite.category);

    if (division === 'MIXED') {
      if (!inviterGender || !inviteeGender || inviterGender === inviteeGender) {
        throw new AppError(
          'Mixed doubles requires one male and one female player',
          400
        );
      }
    } else if (division === 'MEN') {
      if (inviterGender !== 'MALE' || inviteeGender !== 'MALE') {
        throw new AppError(
          "Men's doubles only allows male players",
          400
        );
      }
    } else if (division === 'WOMEN') {
      if (inviterGender !== 'FEMALE' || inviteeGender !== 'FEMALE') {
        throw new AppError(
          "Women's doubles only allows female players",
          400
        );
      }
    }

    // ACCEPT — create team + 2 members + registration
    const teamName = `${invite.inviter.firstName} & ${invite.invitee.firstName}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create team
      const team = await tx.team.create({
        data: {
          name: teamName,
          tournamentId: invite.tournamentId,
          captainId: invite.inviterId,
        },
      });

      // Add both players as members
      await tx.teamMember.createMany({
        data: [
          { teamId: team.id, playerId: invite.inviterId },
          { teamId: team.id, playerId: invite.inviteeId },
        ],
      });

      // Create registration for the team (APPROVED directly per Choice 1)
      await tx.tournamentRegistration.create({
        data: {
          tournamentId: invite.tournamentId,
          categoryId: invite.categoryId,
          playerId: invite.inviterId,
          teamId: team.id,
          status: 'APPROVED',
        },
      });

      // Update currentParticipants count on category
      await tx.category.update({
        where: { id: invite.categoryId },
        data: { currentParticipants: { increment: 1 } },
      });

      // Mark invite as ACCEPTED with teamId
      await tx.doublesInvite.update({
        where: { id: inviteId },
        data: { status: 'ACCEPTED', teamId: team.id },
      });

      // Mark invitee's DOUBLES_INVITE notification as read
      await tx.notification.updateMany({
        where: {
          userId: inviteeId,
          type: 'DOUBLES_INVITE',
          message: { contains: inviteId },
        },
        data: { isRead: true },
      });

      return team;
    });

    // Notify the inviter
    await prisma.notification.create({
      data: {
        userId: invite.inviterId,
        type: 'DOUBLES_INVITE_ACCEPTED',
        title: 'Doubles Invite Accepted! 🎉',
        message: `${invite.invitee.firstName} ${invite.invitee.lastName} accepted your doubles invite for ${invite.tournament.name} – ${invite.category.name}. Your team is officially confirmed and registered!`,
      },
    });

    return { status: 'ACCEPTED', team: result };
  }

  // Cancel a pending invite (inviter only)
  async cancelInvite(inviterId: string, inviteId: string) {
    const invite = await prisma.doublesInvite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new AppError('Invite not found', 404);
    if (invite.inviterId !== inviterId) throw new AppError('You can only cancel your own invites', 403);
    if (invite.status !== 'PENDING') throw new AppError('Only pending invites can be cancelled', 400);

    await prisma.doublesInvite.update({ where: { id: inviteId }, data: { status: 'CANCELLED' } });
    return { status: 'CANCELLED' };
  }

  // Get all pending invites sent TO this user
  async getMyInvites(userId: string) {
    return prisma.doublesInvite.findMany({
      where: { inviteeId: userId, status: 'PENDING' },
      include: {
        inviter: { select: { id: true, firstName: true, lastName: true, email: true } },
        tournament: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get all pending invites SENT BY this user
  async getMySentInvites(userId: string) {
    return prisma.doublesInvite.findMany({
      where: { inviterId: userId, status: 'PENDING' },
      include: {
        invitee: { select: { id: true, firstName: true, lastName: true, email: true } },
        tournament: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
