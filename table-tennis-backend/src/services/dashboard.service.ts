import prisma from '../config/database';

export class DashboardService {
  // Get admin dashboard statistics
  async getAdminDashboard() {
    const [
      totalUsers,
      totalPlayers,
      totalReferees,
      totalAdmins,
      totalTournaments,
      ongoingTournaments,
      completedTournaments,
      totalMatches,
      completedMatches,
      totalRegistrations,
      pendingRegistrations,
      recentUsers,
      recentTournaments,
    ] = await Promise.all([
      // Count users by role
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PLAYER' } }),
      prisma.user.count({ where: { role: 'REFEREE' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      
      // Tournament stats
      prisma.tournament.count(),
      prisma.tournament.count({ where: { status: 'ONGOING' } }),
      prisma.tournament.count({ where: { status: 'COMPLETED' } }),
      
      // Match stats
      prisma.match.count(),
      prisma.match.count({ where: { status: 'COMPLETED' } }),
      
      // Registration stats
      prisma.tournamentRegistration.count(),
      prisma.tournamentRegistration.count({ where: { status: 'PENDING' } }),
      
      // Recent data
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.tournament.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { registrations: true, matches: true },
          },
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        players: totalPlayers,
        referees: totalReferees,
        admins: totalAdmins,
      },
      tournaments: {
        total: totalTournaments,
        ongoing: ongoingTournaments,
        completed: completedTournaments,
      },
      matches: {
        total: totalMatches,
        completed: completedMatches,
        completionRate: totalMatches > 0 ? ((completedMatches / totalMatches) * 100).toFixed(1) : '0',
      },
      registrations: {
        total: totalRegistrations,
        pending: pendingRegistrations,
      },
      recentUsers,
      recentTournaments,
    };
  }

  // Get player dashboard
  async getPlayerDashboard(playerId: string) {
    const [
      playerProfile,
      matches,
      registrations,
      upcomingMatches,
      recentResults,
      statistics,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: playerId },
        include: { playerProfile: true },
      }),
      prisma.match.count({
        where: {
          OR: [{ player1Id: playerId }, { player2Id: playerId }],
        },
      }),
      prisma.tournamentRegistration.count({
        where: { playerId, status: 'APPROVED' },
      }),
      prisma.match.findMany({
        where: {
          OR: [{ player1Id: playerId }, { player2Id: playerId }],
          scheduledTime: { gt: new Date() },
          status: 'SCHEDULED',
        },
        take: 5,
        include: {
          tournament: { select: { name: true } },
          player1: { select: { firstName: true, lastName: true } },
          player2: { select: { firstName: true, lastName: true } },
        },
        orderBy: { scheduledTime: 'asc' },
      }),
      prisma.match.findMany({
        where: {
          OR: [{ player1Id: playerId }, { player2Id: playerId }],
          status: 'COMPLETED',
        },
        take: 5,
        include: {
          tournament: { select: { name: true } },
          player1: { select: { firstName: true, lastName: true } },
          player2: { select: { firstName: true, lastName: true } },
        },
        orderBy: { endTime: 'desc' },
      }),
      this.getPlayerStatistics(playerId),
    ]);

    return {
      profile: playerProfile,
      stats: {
        totalMatches: matches,
        activeRegistrations: registrations,
        upcomingMatches: upcomingMatches.length,
      },
      upcomingMatches,
      recentResults,
      statistics,
    };
  }

  // Get player statistics
  private async getPlayerStatistics(playerId: string) {
    const completedMatches = await prisma.match.findMany({
      where: {
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
        status: 'COMPLETED',
      },
      include: { games: true },
    });

    let wins = 0;
    let losses = 0;
    let totalGamesWon = 0;
    let totalGamesLost = 0;

    for (const match of completedMatches) {
      const isWinner = match.winnerId === playerId;
      if (isWinner) {
        wins++;
      } else {
        losses++;
      }

      for (const game of match.games) {
        const isPlayer1 = match.player1Id === playerId;
        const playerScore = isPlayer1 ? game.player1Score : game.player2Score;
        const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;
        
        if (playerScore > opponentScore) {
          totalGamesWon++;
        } else {
          totalGamesLost++;
        }
      }
    }

    return {
      totalMatches: completedMatches.length,
      wins,
      losses,
      winRate: completedMatches.length > 0 ? ((wins / completedMatches.length) * 100).toFixed(1) : '0',
      gamesWon: totalGamesWon,
      gamesLost: totalGamesLost,
    };
  }

  // Get referee dashboard
async getRefereeDashboard(refereeUserId: string) {
  const referee = await prisma.refereeProfile.findUnique({
    where: { userId: refereeUserId },
  });

  if (!referee) {
    throw new Error('Referee profile not found');
  }

  const [
    knockoutAssigned,
    knockoutCompleted,
    groupAssigned,
    groupCompleted,
    upcomingMatches,
    knockoutTimeMatches,
    groupTimeMatches,
  ] = await Promise.all([
    // Knockout Stage counts
    prisma.match.count({
      where: { refereeId: referee.id },
    }),

    prisma.match.count({
      where: {
        refereeId: referee.id,
        status: 'COMPLETED',
      },
    }),

    // Group Stage counts
    prisma.groupMatch.count({
      where: { refereeId: referee.id },
    }),

    prisma.groupMatch.count({
      where: {
        refereeId: referee.id,
        status: 'COMPLETED',
      },
    }),

    // Existing upcoming Knockout Stage matches
    prisma.match.findMany({
      where: {
        refereeId: referee.id,
        scheduledTime: { gt: new Date() },
        status: 'SCHEDULED',
      },
      take: 5,
      include: {
        tournament: {
          select: { name: true, venue: true },
        },
        player1: {
          select: { firstName: true, lastName: true },
        },
        player2: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { scheduledTime: 'asc' },
    }),

    // Completed Knockout Stage match times
    prisma.match.findMany({
      where: {
        refereeId: referee.id,
        status: 'COMPLETED',
        startTime: { not: null },
        endTime: { not: null },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    }),

    // Completed Group Stage match times
    prisma.groupMatch.findMany({
      where: {
        refereeId: referee.id,
        status: 'COMPLETED',
        startTime: { not: null },
        endTime: { not: null },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    }),
  ]);

  // Calculate match duration in minutes
  const calculateMinutes = (
    matches: {
      startTime: Date | null;
      endTime: Date | null;
    }[]
  ) => {
    return matches.reduce((total, match) => {
      if (!match.startTime || !match.endTime) {
        return total;
      }

      const duration =
        (match.endTime.getTime() -
          match.startTime.getTime()) / 60000;

      return total + (duration > 0 ? duration : 0);
    }, 0);
  };

  const groupMinutes = Math.round(
    calculateMinutes(groupTimeMatches)
  );

  const knockoutMinutes = Math.round(
    calculateMinutes(knockoutTimeMatches)
  );

  const totalMinutes = groupMinutes + knockoutMinutes;

  const totalAssigned = groupAssigned + knockoutAssigned;
  const completedMatches = groupCompleted + knockoutCompleted;

  return {
    referee: {
      ...referee,
      user: await prisma.user.findUnique({
        where: { id: refereeUserId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      }),
    },

    statistics: {
      totalAssigned,
      completedMatches,
      pendingMatches: totalAssigned - completedMatches,

      completionRate:
        totalAssigned > 0
          ? ((completedMatches / totalAssigned) * 100).toFixed(1)
          : '0',

      // New working-hours statistics
      groupStageMinutes: groupMinutes,
      knockoutStageMinutes: knockoutMinutes,
      totalWorkingMinutes: totalMinutes,

      totalWorkingHours: Number(
        (totalMinutes / 60).toFixed(2)
      ),

      totalWorkingTime: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
    },

    upcomingMatches,
  };
}
}