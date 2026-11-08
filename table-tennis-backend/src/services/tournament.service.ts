import prisma from '../config/database';
import { AppError } from '../utils/AppError';

export class TournamentService {
  // Create tournament (Admin only)
  async createTournament(adminId: string, data: {
    name: string;
    description?: string;
    venue: string;
    startDate: Date;
    endDate: Date;
    registrationDeadline: Date;
    maxPlayers?: number;
    tournamentType?: string;
}) {
    // Verify admin
    const admin = await prisma.adminProfile.findUnique({
        where: { userId: adminId },
    });

    if (!admin) {
        throw new AppError('Only admins can create tournaments', 403);
    }

    // Validate dates
    if (data.startDate >= data.endDate) {
        throw new AppError('End date must be after start date', 400);
    }

    if (data.registrationDeadline >= data.startDate) {
        throw new AppError('Registration deadline must be before tournament start', 400);
    }

    // Create tournament
    const tournament = await prisma.tournament.create({
        data: {
          ...data,
          tournamentType: data.tournamentType === 'GROUP_KNOCKOUT' ? 'GROUP_KNOCKOUT' : 'KNOCKOUT',
        },
    });

    console.log('✅ Tournament created:', tournament.name);

    // NO NOTIFICATION CODE NEEDED - Dashboard will show new tournaments
    // Players will see new tournaments when they login to their dashboard

    return tournament;
}
  // Get all tournaments
  async getAllTournaments() {
    const tournaments = await prisma.tournament.findMany({
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            type: true,
            maxParticipants: true,
            currentParticipants: true,
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return tournaments;
  }

  // Get tournament by ID
  async getTournamentById(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        categories: {
          include: {
            _count: {
              select: { registrations: true },
            },
          },
        },
        registrations: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            team: {
              include: {
                members: {
                  include: {
                    player: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        matches: {
          take: 10,
          orderBy: { scheduledTime: 'asc' },
          include: {
            player1: { select: { firstName: true, lastName: true } },
            player2: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    return tournament;
  }

  // Update tournament
  async updateTournament(adminId: string, tournamentId: string, data: {
    name?: string;
    description?: string;
    venue?: string;
    startDate?: Date;
    endDate?: Date;
    registrationDeadline?: Date;
    status?: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    maxPlayers?: number;
  }) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can update tournaments', 403);
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    const updatedTournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data,
    });

if (data.status === 'ONGOING') {
        // Get all approved registrations for this tournament
        const registeredPlayers = await prisma.tournamentRegistration.findMany({
            where: { 
                tournamentId,
                status: 'APPROVED',
            },
            select: { playerId: true },
        });

        if (registeredPlayers.length > 0) {
            await prisma.notification.createMany({
                data: registeredPlayers.map(reg => ({
                    userId: reg.playerId,
                    type: 'TOURNAMENT_STARTING' as any,
                    title: '🏓 Tournament is Starting!',
                    message: `The tournament "${updatedTournament.name}" has started! Check your match schedule.`,
                    createdAt: new Date(),
                })),
            });
            console.log(`📧 Notified ${registeredPlayers.length} players that tournament has started`);
        }
    }


    return updatedTournament;
  }

  // Delete tournament
  async deleteTournament(adminId: string, tournamentId: string) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can delete tournaments', 403);
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    

    // 1. Delete group matches
  await prisma.groupMatch.deleteMany({
    where: { group: { tournamentId } },
  });
  
  // 2. Delete group players
  await prisma.groupPlayer.deleteMany({
    where: { group: { tournamentId } },
  });
  
  // 3. Delete groups
  await prisma.group.deleteMany({
    where: { tournamentId },
  });
  
  // 4. Delete tournament registrations
  await prisma.tournamentRegistration.deleteMany({
    where: { tournamentId },
  });
  
  // 5. Delete matches
  await prisma.match.deleteMany({
    where: { tournamentId },
  });
  
  // 6. Delete categories
  await prisma.category.deleteMany({
    where: { tournamentId },
  });
  
  // 7. Finally delete the tournament
  await prisma.tournament.delete({
    where: { id: tournamentId },
  });

    return { message: 'Tournament deleted successfully' };
  }

  // Add category
  async addCategory(adminId: string, tournamentId: string, data: {
    name: string;
    type: 'SINGLES' | 'DOUBLES' | 'MIXED_DOUBLES' | 'TEAM';
    minAge?: number;
    maxAge?: number;
    gender?: 'MALE' | 'FEMALE' | 'MIXED';
    maxParticipants: number;
  }) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can add categories', 403);
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    const category = await prisma.category.create({
      data: {
        tournamentId,
        ...data,
      },
    });

    return category;
  }

  // Get tournament categories
  async getTournamentCategories(tournamentId: string) {
    const categories = await prisma.category.findMany({
      where: { tournamentId },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    return categories;
  }

  // Update category
  async updateCategory(adminId: string, categoryId: string, data: {
    name?: string;
    type?: 'SINGLES' | 'DOUBLES' | 'MIXED_DOUBLES' | 'TEAM';
    minAge?: number;
    maxAge?: number;
    gender?: 'MALE' | 'FEMALE' | 'MIXED';
    maxParticipants?: number;
  }) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can update categories', 403);
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data,
    });

    return updatedCategory;
  }

  // Delete category
  async deleteCategory(adminId: string, categoryId: string) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can delete categories', 403);
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return { message: 'Category deleted successfully' };
  }

  // Register player for tournament
  // Register player for tournament
async registerForTournament(playerId: string, data: {
  tournamentId: string;
  categoryId?: string;
  teamId?: string;
  partnerId?: string; // For doubles or mixed doubles
}) {
  // Verify player exists
  const player = await prisma.playerProfile.findUnique({
    where: { userId: playerId },
    include: { user: true },
  });

  if (!player) {
    throw new AppError('Player profile not found', 404);
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: data.tournamentId },
    include: { categories: true },
  });

  if (!tournament) {
    throw new AppError('Tournament not found', 404);
  }

  const isClubMember = player.isClubMember;

const paymentProofRequired = isClubMember
  ? tournament.requirePaymentProofClub
  : tournament.requirePaymentProofGuest;

const initialRegistrationStatus = paymentProofRequired
  ? 'PENDING'
  : 'APPROVED';

  // Check registration deadline
  if (new Date() > tournament.registrationDeadline) {
    throw new AppError('Registration deadline has passed', 400);
  }

  // Check tournament status
  if (tournament.status !== 'UPCOMING') {
    throw new AppError('Tournament is no longer accepting registrations', 400);
  }

  let category: any = null;

  // Check category
  if (data.categoryId) {
    category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    if (category.currentParticipants >= category.maxParticipants) {
      throw new AppError('Category is full', 400);
    }

    // ============================================================
    // GENDER RESTRICTION VALIDATION
    // ============================================================
    if (category.gender && category.gender !== 'MIXED') {
      if (!player.gender) {
        throw new AppError(
          'Please specify your gender in your profile before registering for this category',
          400
        );
      }

      if (player.gender !== category.gender) {
        const required = category.gender === 'MALE' ? "men's" : "women's";
        throw new AppError(
          `This category is restricted to ${required} players only`,
          400
        );
      }
    }

    // ============================================================
    // DOUBLES / MIXED DOUBLES VALIDATION
    // ============================================================

    if (
      category.type === 'DOUBLES' ||
      category.type === 'MIXED_DOUBLES'
    ) {
      if (!data.partnerId) {
        throw new AppError(
          'Partner ID is required for doubles',
          400
        );
      }

      // Player cannot select themselves as partner
      if (data.partnerId === playerId) {
        throw new AppError(
          'You cannot select yourself as your partner',
          400
        );
      }

      // Find partner
      const partner = await prisma.playerProfile.findUnique({
        where: { userId: data.partnerId },
        include: { user: true },
      });

      if (!partner) {
        throw new AppError('Partner profile not found', 404);
      }

      const nameLower = category.name.toLowerCase();
      const isMixed =
        category.type === 'MIXED_DOUBLES' ||
        category.gender === 'MIXED' ||
        nameLower.includes('mix');

      const isWomen =
        category.gender === 'FEMALE' ||
        nameLower.includes('women') ||
        nameLower.includes('girl') ||
        nameLower.includes('female');

      const isMen =
        category.gender === 'MALE' ||
        ((nameLower.includes('men') || nameLower.includes('boy') || nameLower.includes('male')) && !nameLower.includes('women'));

      // Same-gender doubles: player and partner must match category gender
      if (!isMixed && (isMen || isWomen)) {
        const requiredGender = isMen ? 'MALE' : 'FEMALE';
        const requiredLabel = isMen ? "men's" : "women's";
        if (player.gender !== requiredGender) {
          throw new AppError(`This category is restricted to ${requiredLabel} players only`, 400);
        }
        if (!partner.gender || partner.gender !== requiredGender) {
          throw new AppError(
            `Your partner must also be eligible for this ${requiredLabel} category`,
            400
          );
        }
      }

      // ------------------------------------------------------------
      // Mixed Doubles: players must have different genders
      // ------------------------------------------------------------
      if (isMixed) {
        if (!player.gender || !partner.gender) {
          throw new AppError(
            'Both players must have a gender specified for mixed doubles',
            400
          );
        }

        if (player.gender === partner.gender) {
          throw new AppError(
            'Players in a mixed doubles team must be of different genders',
            400
          );
        }
      }

      // ------------------------------------------------------------
      // Check whether either player is already registered
      // in this category.
      // ------------------------------------------------------------
      const existingPlayerRegistration =
        await prisma.tournamentRegistration.findFirst({
          where: {
            tournamentId: data.tournamentId,
            categoryId: data.categoryId,
            status: { not: 'CANCELLED' },
            OR: [
              { playerId: playerId },
              { playerId: data.partnerId },
              { partnerId: playerId },
              { partnerId: data.partnerId },
            ],
          },
        });

      if (existingPlayerRegistration) {
        throw new AppError(
          'One of the players is already registered in this category',
          400
        );
      }

      // ------------------------------------------------------------
      // Create a team for doubles / mixed doubles
      // ------------------------------------------------------------

      const team = await prisma.team.create({
        data: {
          name: `${player.user.firstName} & ${partner.user.firstName}`,
          tournamentId: data.tournamentId,
          captainId: playerId,

          members: {
            create: [
              {
                playerId: playerId,
              },
              {
                playerId: data.partnerId,
              },
            ],
          },
        },
      });

      // Store the created team ID
      data.teamId = team.id;
    }

    // ============================================================
    // Age restrictions
    // ============================================================

    if (category.minAge !== null || category.maxAge !== null) {
      if (player.dateOfBirth) {
        const age = this.calculateAge(player.dateOfBirth);

        if (category.minAge !== null && age < category.minAge) {
          throw new AppError(
            `Minimum age requirement: ${category.minAge} years`,
            400
          );
        }

        if (category.maxAge !== null && age > category.maxAge) {
          throw new AppError(
            `Maximum age requirement: ${category.maxAge} years`,
            400
          );
        }
      }
    }
  }

  // ============================================================
  // Singles registration duplicate check
  // ============================================================

  if (
    data.categoryId &&
    category &&
    category.type === 'SINGLES'
  ) {
    const existingRegistration =
      await prisma.tournamentRegistration.findFirst({
        where: {
          tournamentId: data.tournamentId,
          categoryId: data.categoryId,
          playerId: playerId,
          status: { not: 'CANCELLED' },
        },
      });

    if (existingRegistration) {
      throw new AppError(
        'You are already registered for this tournament',
        400
      );
    }
  }

  // ============================================================
  // Create registration
  // ============================================================

  const registration =
    await prisma.tournamentRegistration.create({
      data: {
        tournamentId: data.tournamentId,
        categoryId: data.categoryId,
        playerId,
        partnerId: data.partnerId,
        teamId: data.teamId,
        status: initialRegistrationStatus,
        approvedAt:paymentProofRequired ? null : new Date(),  
      },
      include: {
        tournament: true,
        category: true,
        team: {
          include: {
            members: {
              include: {
                player: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  // Update category participant count
  if (data.categoryId && initialRegistrationStatus === 'APPROVED') {
    await prisma.category.update({
      where: { id: data.categoryId },
      data: {
        currentParticipants: {
          increment: 1,
        },
      },
    });
  }

  // ============================================================
  // Notify admins
  // ============================================================

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin: { id: string }) => ({
        userId: admin.id,
        type: 'REGISTRATION_PENDING',
        title: 'New Tournament Registration',
        message: `${player.user.firstName} ${player.user.lastName} has registered for ${tournament.name}`,
      })),
    });
  }

  return registration;
}

  // Get my registrations (Player)
  async getMyRegistrations(playerId: string) {
    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        OR: [
          { playerId },
          { team: { members: { some: { playerId } } } },
        ],
      },
      include: {
        tournament: true,
        category: true,
        team: {
          include: {
            members: {
              include: {
                player: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    return registrations;
  }

  // Get tournament registrations (Admin/Referee)
  async getTournamentRegistrations(tournamentId: string, status?: string, categoryId?: string) {
    const whereClause: any = { tournamentId };
    if (status) {
      whereClause.status = status;
    }
    if (categoryId){
      whereClause.categoryId = categoryId;
    }

    const registrations = await prisma.tournamentRegistration.findMany({
      where: whereClause,
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            playerProfile: true,
          },
        },
        category: true,
        team: {
          include: {
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
          },
        },
      },
      orderBy: { registeredAt: 'asc' },
    });

    return registrations;
  }

  // Approve or reject registration (Admin only)
  async processRegistration(adminId: string, registrationId: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string) {
    // Verify admin
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can process registrations', 403);
    }

    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: registrationId },
      include: {
        tournament: true,
        category: true,
        player: {
          include: {
            playerProfile: true,
          },
        },
      },
    });

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    if (registration.status !== 'PENDING') {
      throw new AppError('Registration has already been processed', 400);
    }

    if (action === 'APPROVE') {
      // Check whether this player requires payment proof
const isClubMember =
  registration.player.playerProfile?.isClubMember ?? false;

const paymentProofRequired = isClubMember
  ? registration.tournament.requirePaymentProofClub
  : registration.tournament.requirePaymentProofGuest;

if (paymentProofRequired) {
  const paymentProof =
    await prisma.tournamentPaymentProof.findFirst({
      where: {
        tournamentId: registration.tournamentId,
        playerId: registration.playerId,
        registrationId: null,
        status: 'APPROVED',
      },
    });

  if (!paymentProof) {
    throw new AppError(
      'Payment proof must be submitted before approving this registration',
      400
    );
  }

  if (paymentProof.status !== 'APPROVED') {
    throw new AppError(
      'Payment proof must be approved before approving this registration',
      400
    );
  }
}
      // Check if category has space
      if (registration.category) {
        const category = await prisma.category.findUnique({
          where: { id: registration.categoryId! },
        });

        if (category && category.currentParticipants >= category.maxParticipants) {
          throw new AppError('Category is already full', 400);
        }

        // Increment participant count
        if(registration.categoryId){
          await prisma.category.update({
          where: { id: registration.categoryId! },
          data: {
            currentParticipants: { increment: 1 },
          },
        });

        }
        
      }

      // Update registration
      const updated = await prisma.tournamentRegistration.update({
        where: { id: registrationId },
        data: {
          status: 'APPROVED',
          approvedBy: adminId,
          approvedAt: new Date(),
        },
      });

      // Notify player
      await prisma.notification.create({
        data: {
          userId: registration.playerId,
          type: 'REGISTRATION_APPROVED',
          title: 'Registration Approved',
          message: `Your registration for ${registration.tournament.name} has been approved!`,
        },
      });

      return updated;
    } else {
      // Reject registration
      const updated = await prisma.tournamentRegistration.update({
        where: { id: registrationId },
        data: {
          status: 'REJECTED',
          approvedBy: adminId,
          approvedAt: new Date(),
          rejectionReason,
        },
      });

      // Notify player
      await prisma.notification.create({
        data: {
          userId: registration.playerId,
          type: 'REGISTRATION_REJECTED',
          title: 'Registration Rejected',
          message: `Your registration for ${registration.tournament.name} was rejected. Reason: ${rejectionReason || 'Not specified'}`,
        },
      });

      return updated;
    }
  }

  async cancelRegistration(playerId: string, registrationId: string) {
  const registration = await prisma.tournamentRegistration.findUnique({
    where: { id: registrationId },
    include: { 
      tournament: true,
      player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      }
    },
  });

  if (!registration) {
    throw new AppError('Registration not found', 404);
  }

  if (registration.playerId !== playerId) {
    throw new AppError('You can only cancel your own registrations', 403);
  }

  // If registration is approved, decrement participant count
  if (registration.status === 'APPROVED' && registration.categoryId) {
    await prisma.category.update({
      where: { id: registration.categoryId },
      data: {
        currentParticipants: { decrement: 1 },
      },
    });
  }

  if (registration.status === 'CANCELLED') {
    throw new AppError('Registration is already cancelled', 400);
  }

  const updated = await prisma.tournamentRegistration.update({
    where: { id: registrationId },
    data: { status: 'CANCELLED' },
  });

  // Notify admins
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin: { id: any; }) => ({
        userId: admin.id,
        type: 'REGISTRATION_CANCELLED',
        title: 'Registration Cancelled',
        message: `${registration.player?.firstName || 'A player'} ${registration.player?.lastName || ''} has cancelled registration for ${registration.tournament.name}`,
      })),
    });
  }

  return updated;
}

async removeRegistrationByAdmin(adminId: string, registrationId: string) {
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true, isSuperAdmin: true },
  });

  if (
    !admin ||
    (admin.role !== 'ADMIN' &&
      admin.role !== 'SUPER_ADMIN' &&
      !admin.isSuperAdmin)
  ) {
    throw new AppError('Only admins can remove registrations', 403);
  }

  return await prisma.$transaction(async (tx) => {
    const registration = await tx.tournamentRegistration.findUnique({
      where: { id: registrationId },
      include: {
        category: true,
        tournament: true,
      },
    });

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    if (registration.status !== 'APPROVED') {
      throw new AppError(
        'Only approved registrations can be removed',
        400
      );
    }

    if (!registration.categoryId) {
      throw new AppError('Registration category not found', 400);
    }

    if (registration.tournament.status === 'COMPLETED') {
      throw new AppError(
        'Cannot remove registrations from a completed tournament',
        400
      );
    }

    // Conservative safety rule:
    // Do not remove registrations after tournament-stage data
    // has been created for this category.
    const [groupsCount, matchesCount, resultsCount] = await Promise.all([
      tx.group.count({
        where: {
          tournamentId: registration.tournamentId,
          categoryId: registration.categoryId,
        },
      }),
      tx.match.count({
        where: {
          tournamentId: registration.tournamentId,
          categoryId: registration.categoryId,
        },
      }),
      tx.tournamentResult.count({
        where: {
          tournamentId: registration.tournamentId,
        },
      }),
    ]);

    if (groupsCount > 0 || matchesCount > 0 || resultsCount > 0) {
      throw new AppError(
        'Cannot remove this registration because tournament groups, matches, or published result data already exist. Use the tournament no-show or walkover process instead.',
        400
      );
    }

    // Update only this registration.
    const updated = await tx.tournamentRegistration.update({
      where: { id: registrationId },
      data: { status: 'CANCELLED' },
    });

    // Approved registrations contribute one participant entry.
    await tx.category.update({
      where: { id: registration.categoryId },
      data: {
        currentParticipants: {
          decrement: 1,
        },
      },
    });

    return updated;
  });
}

  // Helper method to calculate age
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  // Get age category based on age (Client specification)
private getAgeCategory(age: number): string {
  if (age < 9) return 'Under 9';
  if (age >= 9 && age < 11) return 'Under 11';
  if (age >= 11 && age < 13) return 'Under 13';
  if (age >= 13 && age < 15) return 'Under 15';
  if (age >= 15 && age < 17) return 'Under 17';
  if (age >= 17 && age < 19) return 'Under 19';
  if (age >= 19 && age < 40) return 'Open';
  if (age >= 40 && age < 50) return 'Seniors (40+)';
  if (age >= 50 && age < 60) return 'Masters (50+)';
  if (age >= 60) return 'Veterans (60+)';
  return 'Open';
}

// Get eligible categories for a player
async getEligibleCategories(playerId: string, tournamentId: string) {
  const player = await prisma.playerProfile.findUnique({
    where: { userId: playerId },
  });

  if (!player || !player.dateOfBirth) {
    // If no DOB, return all categories
    return await prisma.category.findMany({
      where: { tournamentId },
    });
  }

  const age = this.calculateAge(player.dateOfBirth);
  
  // Define age ranges for each category
  const ageRanges = {
    'Under 9': { min: 0, max: 8 },
    'Under 11': { min: 9, max: 10 },
    'Under 13': { min: 11, max: 12 },
    'Under 15': { min: 13, max: 14 },
    'Under 17': { min: 15, max: 16 },
    'Under 19': { min: 17, max: 18 },
    'Open': { min: 19, max: 39 },
    'Seniors (40+)': { min: 40, max: 49 },
    'Masters (50+)': { min: 50, max: 59 },
    'Veterans (60+)': { min: 60, max: 150 },
  };

  // Get all categories and filter by age
  const allCategories = await prisma.category.findMany({
    where: { tournamentId },
  });

  const eligibleCategories = allCategories.filter(category => {
    // If category has custom age settings, use those
    if (category.minAge !== null || category.maxAge !== null) {
      const minOk = category.minAge ? age >= category.minAge : true;
      const maxOk = category.maxAge ? age <= category.maxAge : true;
      return minOk && maxOk;
    }
    
    // Otherwise use the standard age ranges based on category name
    for (const [catName, range] of Object.entries(ageRanges)) {
      if (category.name.includes(catName)) {
        return age >= range.min && age <= range.max;
      }
    }
    return true; // If no match, show category
  });

  return eligibleCategories;
}
}

// Export an instance of the service
export const tournamentService = new TournamentService();