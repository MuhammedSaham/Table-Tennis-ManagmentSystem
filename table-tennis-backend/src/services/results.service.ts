import prisma from '../config/database';
import { AppError } from '../utils/AppError';

export class ResultsService {
  // Get tournament standings by category
  
async getTournamentStandings(tournamentId: string, categoryId?: string) {
  const categories = await prisma.category.findMany({
    where: {
      tournamentId,
      ...(categoryId ? { id: categoryId } : {}),
    },
    include: {
      registrations: {
        where: { status: 'APPROVED' },
        include: {
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
                    },
                  },
                },
              },
            },
          },
        },
      },
      matches: {
        where: { status: 'COMPLETED' },
      },
      groups: {
        include: {
          matches: {
            where: { status: 'COMPLETED' },
          },
        },
      },
    },
  });

  return categories.map((category) => {
    const isDoubles =
      category.type === 'DOUBLES' ||
      category.type === 'MIXED_DOUBLES';

    const stats = new Map<string, any>();

    const createStats = (
      id: string,
      name: string,
      members: { playerId: string; playerName: string }[] = []
    ) => ({
      playerId: id,
      playerName: name,
      teamId: isDoubles ? id : null,
      participantType: isDoubles ? 'TEAM' : 'PLAYER',
      members,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
    });

    // Initialize approved participants.
    for (const registration of category.registrations) {
      if (isDoubles) {
        const team = registration.team;

        if (!team) continue;

        const members = team.members.map((member) => ({
          playerId: member.player.id,
          playerName:
            `${member.player.firstName} ${member.player.lastName}`,
        }));

        const teamName =
          members.length > 0
            ? members.map((member) => member.playerName).join(' & ')
            : team.name;

        if (!stats.has(team.id)) {
          stats.set(
            team.id,
            createStats(team.id, teamName, members)
          );
        }
      } else {
        const player = registration.player;

        if (!stats.has(player.id)) {
          stats.set(
            player.id,
            createStats(
              player.id,
              `${player.firstName} ${player.lastName}`
            )
          );
        }
      }
    }

    // Update standings for one completed match.
    const processMatch = (
      participant1Id: string | null,
      participant2Id: string | null,
      winnerId: string | null,
      score1: number,
      score2: number
    ) => {
      if (!participant1Id || !participant2Id || !winnerId) {
        return;
      }

      const first = stats.get(participant1Id);
      const second = stats.get(participant2Id);

      if (!first || !second) return;

      if (
        winnerId !== participant1Id &&
        winnerId !== participant2Id
      ) {
        return;
      }

      first.matchesPlayed++;
      second.matchesPlayed++;

      if (winnerId === participant1Id) {
        first.wins++;
        second.losses++;
        first.points += 2;
      } else {
        second.wins++;
        first.losses++;
        second.points += 2;
      }

      first.gamesWon += score1;
      first.gamesLost += score2;

      second.gamesWon += score2;
      second.gamesLost += score1;
    };

    // Knockout stage.
    for (const match of category.matches) {
      let score1 = 0;
      let score2 = 0;

      if (match.score) {
        // Supports "3-1" and "11-8, 9-11, 11-7".
        const scoreParts = match.score.split(',');

        if (scoreParts.length === 1) {
          const scores = scoreParts[0].trim().split('-').map(Number);

          if (scores.length === 2 && scores.every(Number.isFinite)) {
            score1 = scores[0];
            score2 = scores[1];
          }
        } else {
          for (const part of scoreParts) {
            const scores = part.trim().split('-').map(Number);

            if (scores.length !== 2 || !scores.every(Number.isFinite)) {
              continue;
            }

            if (scores[0] > scores[1]) score1++;
            else if (scores[1] > scores[0]) score2++;
          }
        }
      }

      processMatch(
        isDoubles ? match.team1Id : match.player1Id,
        isDoubles ? match.team2Id : match.player2Id,
        isDoubles
          ? match.winnerTeamId
          : match.winnerId,
        score1,
        score2
      );
    }

    // Group stage.
    for (const group of category.groups) {
      for (const match of group.matches) {
        processMatch(
          isDoubles ? match.team1Id : match.player1Id,
          isDoubles ? match.team2Id : match.player2Id,
          isDoubles
            ? match.winnerTeamId
            : match.winnerId,
          match.player1Score ?? 0,
          match.player2Score ?? 0
        );
      }
    }

    const sortedStats = Array.from(stats.values()).sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      }

      if (a.wins !== b.wins) {
        return b.wins - a.wins;
      }

      const aDiff = a.gamesWon - a.gamesLost;
      const bDiff = b.gamesWon - b.gamesLost;

      return bDiff - aDiff;
    });

    return {
      categoryId: category.id,
      categoryName: category.name,
      categoryType: category.type,
      totalPlayers: stats.size,
      completedMatches:
        category.matches.length +
        category.groups.reduce(
          (total, group) => total + group.matches.length,
          0
        ),
      standings: sortedStats,
    };
  });
}

  // Helper method to update player statistics
  private updatePlayerStats(
    playerStats: Map<string, any>, 
    player1Id: string, 
    player2Id: string, 
    winnerId: string | null, 
    player1Score: number = 0, 
    player2Score: number = 0
  ) {
    const player1Stat = playerStats.get(player1Id);
    const player2Stat = playerStats.get(player2Id);

    if (!player1Stat || !player2Stat) return;

    player1Stat.matchesPlayed++;
    player2Stat.matchesPlayed++;

    const isPlayer1Winner = winnerId === player1Id;
    
    if (isPlayer1Winner) {
      player1Stat.wins++;
      player2Stat.losses++;
      player1Stat.points += 2;
    } else if (winnerId === player2Id) {
      player2Stat.wins++;
      player1Stat.losses++;
      player2Stat.points += 2;
    }

    // Add scores to games won/lost
    player1Stat.gamesWon += player1Score;
    player1Stat.gamesLost += player2Score;
    player2Stat.gamesWon += player2Score;
    player2Stat.gamesLost += player1Score;
  }

  // Get category winners
 
async getCategoryWinners(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      categories: {
        include: {
          matches: {
            where: {
              round: { in: ['Final', 'Finals', 'Semi-Finals', 'Semi-final', 'Semifinals', 'Semifinal'] },
            },
            include: {
              player1: {
                select: { id: true, firstName: true, lastName: true,profileImage: true, },
              },
              player2: {
                select: { id: true, firstName: true, lastName: true,profileImage: true, },
              },
              team1: {
                include: {
                  members: {
                    include: {
                      player: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                          profileImage: true,
                        },
                      },
                    },
                  },
                },
              },
              team2: {
                include: {
                  members: {
                    include: {
                      player: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                          profileImage: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!tournament) {
    throw new AppError('Tournament not found', 404);
  }

  const winners = tournament.categories.map(category => {
    const isDoubles = [
      'DOUBLES',
      'MIXED',
      'MIXED_DOUBLES',
    ].includes(category.type);

    const isSemiFinal = (r: string) => {
      const norm = (r || '').toLowerCase().replace(/[^a-z]/g, '');
      return norm === 'semifinals' || norm === 'semifinal';
    };
    const isFinal = (r: string) => {
      const norm = (r || '').toLowerCase().replace(/[^a-z]/g, '');
      return norm === 'final' || norm === 'finals';
    };

    const finalMatch = category.matches.find(
      m => isFinal(m.round) && ['COMPLETED', 'WALKOVER'].includes(m.status),
    );

    const semifinals = category.matches.filter(m => isSemiFinal(m.round));

    const getParticipants = (match: typeof category.matches[number]) => {
      if (isDoubles) {
        return {
          first: match.team1,
          second: match.team2,
          winnerId: match.winnerTeamId || match.winnerId,
          firstId: match.team1Id || match.team1?.id,
          secondId: match.team2Id || match.team2?.id,
        };
      }

      return {
        first: match.player1,
        second: match.player2,
        winnerId: match.winnerId,
        firstId: match.player1Id || match.player1?.id,
        secondId: match.player2Id || match.player2?.id,
      };
    };

    let winner = null;
    let runnerUp = null;

    if (finalMatch) {
      const participants = getParticipants(finalMatch);

      if (participants.winnerId) {
        const isFirstWinner =
          participants.winnerId === participants.firstId ||
          (isDoubles &&
            (participants.first as any)?.members?.some(
              (m: any) => m.playerId === participants.winnerId || m.player?.id === participants.winnerId,
            ));
        const isSecondWinner =
          participants.winnerId === participants.secondId ||
          (isDoubles &&
            (participants.second as any)?.members?.some(
              (m: any) => m.playerId === participants.winnerId || m.player?.id === participants.winnerId,
            ));

        if (isFirstWinner) {
          winner = participants.first;
          runnerUp = participants.second;
        } else if (isSecondWinner) {
          winner = participants.second;
          runnerUp = participants.first;
        }
      }
    }

    const jointThird: any[] = [];

    if (
      semifinals.length === 2 &&
      semifinals.every(match => ['COMPLETED', 'WALKOVER'].includes(match.status))
    ) {
      for (const match of semifinals) {
        const participants = getParticipants(match);

        const isFirstWinner =
          participants.winnerId === participants.firstId ||
          (isDoubles &&
            (participants.first as any)?.members?.some(
              (m: any) => m.playerId === participants.winnerId || m.player?.id === participants.winnerId,
            ));
        const isSecondWinner =
          participants.winnerId === participants.secondId ||
          (isDoubles &&
            (participants.second as any)?.members?.some(
              (m: any) => m.playerId === participants.winnerId || m.player?.id === participants.winnerId,
            ));

        if (isFirstWinner) {
          if (participants.second) {
            jointThird.push(participants.second);
          }
        } else if (isSecondWinner) {
          if (participants.first) {
            jointThird.push(participants.first);
          }
        }
      }
    }

    return {
      categoryId: category.id,
      categoryName: category.name,
      winner,
      runnerUp,
      jointThird: jointThird.length === 2 ? jointThird : [],
      score: finalMatch?.score || null,
    };
  });

  return {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    status: tournament.status,
    winners,
    released: false,
    releasedAt: null,
  };
}


  // Release tournament results (Admin only)
  async releaseResults(adminId: string, tournamentId: string) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can release tournament results', 403);
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        categories: {
          include: {
            matches: {
              where: { status: 'COMPLETED' },
            },
          },
        },
      },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    if (tournament.status !== 'COMPLETED') {
      throw new AppError('Cannot release results for incomplete tournament', 400);
    }

    // Get winners for each category
    
const categoryWinners: any = {};

const categoryResults = await this.getCategoryWinners(tournamentId);

for (const category of categoryResults.winners) {
  if (!category.winner || !category.runnerUp) {
    continue;
  }

  const isDoubles = [
    'DOUBLES',
    'MIXED',
    'MIXED_DOUBLES',
  ].includes(
    tournament.categories.find(c => c.id === category.categoryId)
      ?.type || '',
  );

  categoryWinners[category.categoryId] = {
    winnerId: category.winner.id,
    runnerUpId: category.runnerUp.id,

    // Both semifinal losers share third place
    jointThirdIds: category.jointThird.map(
      (participant: any) => participant.id,
    ),

    participantType: isDoubles ? 'TEAM' : 'PLAYER',
    score: category.score,
  };
}


    // Create or update tournament results
    const results = await prisma.tournamentResult.upsert({
      where: { tournamentId },
      update: {
        results: categoryWinners,
        releasedBy: adminId,
        releasedAt: new Date(),
        isPublished: true,
      },
      create: {
        tournamentId,
        results: categoryWinners,
        releasedBy: adminId,
        isPublished: true,
      },
    });

    // Notify all registered players
    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
        status: 'APPROVED',
      },
      select: { playerId: true },
    });

    if (registrations.length > 0) {
      await prisma.notification.createMany({
        data: registrations.map(reg => ({
          userId: reg.playerId,
          type: 'TOURNAMENT_RESULTS',
          title: 'Tournament Results Released',
          message: `Results for ${tournament.name} have been released. Check the leaderboard!`,
        })),
      });
    }

    return results;
  }

  // Get tournament statistics
  async getTournamentStatistics(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        categories: {
          include: {
            registrations: {
              where: { status: 'APPROVED' },
            },
            matches: true,
          },
        },
        matches: {
          where: { status: 'COMPLETED' },
        },
        registrations: {
          where: { status: 'APPROVED' },
        },
      },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }

    // Calculate statistics
    let totalMatches = 0;
    let completedMatches = 0;
    let totalParticipants = 0;
    let categoriesWithWinners = 0;

    for (const category of tournament.categories) {
      totalParticipants += category.registrations.length;
      totalMatches += category.matches.length;
      completedMatches += category.matches.filter(m => m.status === 'COMPLETED').length;
      
      const hasFinal = category.matches.some(m => m.round === 'Final' && m.status === 'COMPLETED');
      if (hasFinal) categoriesWithWinners++;
    }

    const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    return {
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      status: tournament.status,
      venue: tournament.venue,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      statistics: {
        totalCategories: tournament.categories.length,
        totalParticipants,
        totalMatches,
        completedMatches,
        matchCompletionRate: `${progress.toFixed(1)}%`,
        categoriesWithWinners,
        categoriesPending: tournament.categories.length - categoriesWithWinners,
      },
    };
  }

  // Get player ranking across tournament
  async getPlayerRanking(tournamentId: string, limit: number = 10) {
    const standings = await this.getTournamentStandings(tournamentId);
    
    // Combine all players from all categories
    const allPlayers: any[] = [];
    standings.forEach(category => {
      category.standings.forEach(player => {
        allPlayers.push({
          ...player,
          categoryName: category.categoryName,
        });
      });
    });

    // Sort by wins and return top players
    const topPlayers = allPlayers
      .sort((a, b) => {
        if (a.wins !== b.wins) return b.wins - a.wins;
        const aDiff = a.gamesWon - a.gamesLost;
        const bDiff = b.gamesWon - b.gamesLost;
        return bDiff - aDiff;
      })
      .slice(0, limit);

    return {
      tournamentId,
      topPlayers,
      totalPlayers: allPlayers.length,
    };
  }
  // Add this method to the ResultsService class

async getGlobalCategoryStandings(
  categoryName: string,
  limit: number = 50
) {
  const categories = await prisma.category.findMany({
    where: { name: categoryName },
    select: { type: true },
  });

  const isDoubles = categories.some(
    (category) =>
      category.type === 'DOUBLES' ||
      category.type === 'MIXED_DOUBLES'
  );

  // Preserve the existing singles ranking calculation.
  if (!isDoubles) {
    const knockoutMatches = await prisma.match.findMany({
      where: {
        category: { name: categoryName },
        status: 'COMPLETED',
      },
      include: {
        player1: {
          select: { id: true, firstName: true, lastName: true },
        },
        player2: {
          select: { id: true, firstName: true, lastName: true },
        },
        tournament: { select: { id: true, name: true } },
        category: { select: { name: true } },
      },
    });

    const groupMatches = await prisma.groupMatch.findMany({
      where: {
        group: {
          category: { name: categoryName },
        },
        status: 'COMPLETED',
      },
      include: {
        player1: {
          select: { id: true, firstName: true, lastName: true },
        },
        player2: {
          select: { id: true, firstName: true, lastName: true },
        },
        group: {
          include: {
            tournament: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
    });

    const playerStats = new Map<string, any>();

    for (const match of knockoutMatches) {
      if (match.player1Id && match.player2Id && match.winnerId) {
        this.updateGlobalPlayerStats(playerStats, match);
      }
    }

    for (const match of groupMatches) {
      if (match.player1Id && match.player2Id && match.winnerId) {
        this.updateGlobalPlayerStatsFromGroup(playerStats, match);
      }
    }

    
    // Only Club Players are eligible for the Global Leaderboard.
    // Match statistics still include results against Guest Players.
    const clubPlayers = await prisma.playerProfile.findMany({
      where: {
        isClubMember: true,
        userId: {
          in: Array.from(playerStats.keys()),
        },
      },
      select: {
        userId: true,
      },
    });

    const clubPlayerIds = new Set(
      clubPlayers.map((player) => player.userId)
    );

    const sortedStats = Array.from(playerStats.values())
      .filter((player) => clubPlayerIds.has(player.playerId))
      .sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        if (a.wins !== b.wins) return b.wins - a.wins;

        return (
          b.gamesWon - b.gamesLost -
          (a.gamesWon - a.gamesLost)
        );
      })
      .slice(0, limit);


    for (const player of sortedStats) {
      const user = await prisma.user.findUnique({
        where: { id: player.playerId },
        select: { firstName: true, lastName: true },
      });

      if (user) {
        player.playerName =
          `${user.firstName} ${user.lastName}`;
      }

      player.participantType = 'PLAYER';
    }

    return {
      categoryName,
      totalPlayers: clubPlayerIds.size,
      standings: sortedStats,
      lastUpdated: new Date(),
    };
  }

  // DOUBLES / MIXED DOUBLES
  const teamInclude = {
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
  };

  const knockoutMatches = await prisma.match.findMany({
    where: {
      category: {
        name: categoryName,
        type: { in: ['DOUBLES', 'MIXED_DOUBLES'] },
      },
      status: 'COMPLETED',
    },
    include: {
      team1: { include: teamInclude },
      team2: { include: teamInclude },
    },
  });

  const groupMatches = await prisma.groupMatch.findMany({
    where: {
      group: {
        category: {
          name: categoryName,
          type: { in: ['DOUBLES', 'MIXED_DOUBLES'] },
        },
      },
      status: 'COMPLETED',
    },
    include: {
      team1: { include: teamInclude },
      team2: { include: teamInclude },
    },
  });

  const teamStats = new Map<string, any>();

  
  // Only teams with two active Club Players are eligible
  // for the Global Doubles and Mixed Doubles Leaderboards.
  const clubMemberProfiles = await prisma.playerProfile.findMany({
    where: {
      isClubMember: true,
    },
    select: {
      userId: true,
    },
  });

  const clubMemberIds = new Set(
    clubMemberProfiles.map((profile) => profile.userId)
  );

  const isClubTeam = (team: any): boolean => {
    if (!team) return false;

    const activeMembers = team.members.filter(
      (member: any) => member.isActive === true
    );

    return (
      activeMembers.length === 2 &&
      activeMembers.every((member: any) =>
        clubMemberIds.has(member.playerId)
      )
    );
  };


  const getPartnershipKey = (team: any): string | null => {
  if (!team) return null;

  const playerIds = team.members
    .map((member: any) => member.playerId)
    .sort();

  if (playerIds.length !== 2) return null;

  return JSON.stringify(playerIds);
};

  const initializeTeam = (team: any) => {
  if (!isClubTeam(team)) return;

  const partnershipKey = getPartnershipKey(team);

  if (!partnershipKey || teamStats.has(partnershipKey)) return;

  const members = team.members
    .map((member: any) => ({
      playerId: member.player.id,
      playerName:
        `${member.player.firstName} ${member.player.lastName}`,
    }))
    .sort((a: any, b: any) =>
      a.playerId.localeCompare(b.playerId)
    );

  teamStats.set(partnershipKey, {
    playerId: partnershipKey,
    teamId: team.id,
    playerName: members
      .map((member: any) => member.playerName)
      .join(' & '),
    participantType: 'TEAM',
    members,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    gamesWon: 0,
    gamesLost: 0,
    points: 0,
  });
};

  const processTeamMatch = (
    team1: any,
    team2: any,
    winnerTeamId: string | null,
    score1: number,
    score2: number
  ) => {
    if (
      !team1 ||
      !team2 ||
      !winnerTeamId ||
      (winnerTeamId !== team1.id && winnerTeamId !== team2.id)
    ) {
      return;
    }

    const key1 = getPartnershipKey(team1);
const key2 = getPartnershipKey(team2);

if (!key1 || !key2 || key1 === key2) return;

initializeTeam(team1);
initializeTeam(team2);

const first = teamStats.get(key1);
const second = teamStats.get(key2);

if (!first || !second) return;

    first.matchesPlayed++;
    second.matchesPlayed++;

    if (winnerTeamId === team1.id) {
      first.wins++;
      second.losses++;
      first.points += 2;
    } else {
      second.wins++;
      first.losses++;
      second.points += 2;
    }

    first.gamesWon += score1;
    first.gamesLost += score2;
    second.gamesWon += score2;
    second.gamesLost += score1;
  };

  // Knockout results
  for (const match of knockoutMatches) {
    let score1 = 0;
    let score2 = 0;

    if (match.score) {
      const scoreParts = match.score.split(',');

      if (scoreParts.length === 1) {
        const scores = scoreParts[0].trim().split('-').map(Number);

        if (scores.length === 2 && scores.every(Number.isFinite)) {
          score1 = scores[0];
          score2 = scores[1];
        }
      } else {
        for (const part of scoreParts) {
          const scores = part.trim().split('-').map(Number);

          if (scores.length !== 2 || !scores.every(Number.isFinite)) {
            continue;
          }

          if (scores[0] > scores[1]) score1++;
          else if (scores[1] > scores[0]) score2++;
        }
      }
    }

    processTeamMatch(
      match.team1,
      match.team2,
      match.winnerTeamId,
      score1,
      score2
    );
  }

  // Group stage results
  for (const match of groupMatches) {
    processTeamMatch(
      match.team1,
      match.team2,
      match.winnerTeamId,
      match.player1Score ?? 0,
      match.player2Score ?? 0
    );
  }

  
  const eligiblePartnershipKeys = new Set<string>();

  for (const match of [...knockoutMatches, ...groupMatches]) {
    for (const team of [match.team1, match.team2]) {
      if (isClubTeam(team)) {
        const key = getPartnershipKey(team);

        if (key) {
          eligiblePartnershipKeys.add(key);
        }
      }
    }
  }

  const sortedStats = Array.from(teamStats.values())
    .filter((team) =>
      eligiblePartnershipKeys.has(team.playerId)
    )
    .sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.wins !== b.wins) return b.wins - a.wins;

      return (
        b.gamesWon - b.gamesLost -
        (a.gamesWon - a.gamesLost)
      );
    })
    .slice(0, limit);


  return {
    categoryName,
    totalPlayers: eligiblePartnershipKeys.size,
    standings: sortedStats,
    lastUpdated: new Date(),
  };
}


// Helper method for knockout matches
private updateGlobalPlayerStats(playerStats: Map<string, any>, match: any) {
  // Initialize players
  if (!playerStats.has(match.player1Id)) {
    playerStats.set(match.player1Id, {
      playerId: match.player1Id,
      playerName: '',
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
    });
  }
  if (!playerStats.has(match.player2Id)) {
    playerStats.set(match.player2Id, {
      playerId: match.player2Id,
      playerName: '',
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
    });
  }

  const p1Stat = playerStats.get(match.player1Id);
  const p2Stat = playerStats.get(match.player2Id);

  p1Stat.matchesPlayed++;
  p2Stat.matchesPlayed++;

  const isPlayer1Winner = match.winnerId === match.player1Id;
  
  if (isPlayer1Winner) {
    p1Stat.wins++;
    p2Stat.losses++;
    p1Stat.points += 2;
  } else {
    p2Stat.wins++;
    p1Stat.losses++;
    p2Stat.points += 2;
  }

  // Parse score
  if (match.score) {
    const games = match.score.split(', ');
    games.forEach((game: string) => {
      const [p1Sc, p2Sc] = game.split('-').map(Number);
      p1Stat.gamesWon += p1Sc;
      p1Stat.gamesLost += p2Sc;
      p2Stat.gamesWon += p2Sc;
      p2Stat.gamesLost += p1Sc;
    });
  }
}

// Helper method for group matches
private updateGlobalPlayerStatsFromGroup(playerStats: Map<string, any>, match: any) {
  if (!playerStats.has(match.player1Id)) {
    playerStats.set(match.player1Id, {
      playerId: match.player1Id,
      playerName: '',
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
    });
  }
  if (!playerStats.has(match.player2Id)) {
    playerStats.set(match.player2Id, {
      playerId: match.player2Id,
      playerName: '',
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0,
    });
  }

  const p1Stat = playerStats.get(match.player1Id);
  const p2Stat = playerStats.get(match.player2Id);

  p1Stat.matchesPlayed++;
  p2Stat.matchesPlayed++;

  const isPlayer1Winner = match.winnerId === match.player1Id;
  
  if (isPlayer1Winner) {
    p1Stat.wins++;
    p2Stat.losses++;
    p1Stat.points += 2;
  } else {
    p2Stat.wins++;
    p1Stat.losses++;
    p2Stat.points += 2;
  }

  // Add scores
  p1Stat.gamesWon += match.player1Score || 0;
  p1Stat.gamesLost += match.player2Score || 0;
  p2Stat.gamesWon += match.player2Score || 0;
  p2Stat.gamesLost += match.player1Score || 0;
}
}

