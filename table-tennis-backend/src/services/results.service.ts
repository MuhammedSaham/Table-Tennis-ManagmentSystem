import prisma from '../config/database';
import { AppError } from '../utils/AppError';

export class ResultsService {
  // Get tournament standings by category
  async getTournamentStandings(tournamentId: string, categoryId?: string) {
    const whereClause: any = { tournamentId };
    if (categoryId) {
      whereClause.id = categoryId;
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        matches: {
          where: { status: 'COMPLETED' },
          include: {
            player1: { select: { id: true, firstName: true, lastName: true } },
            player2: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        groups: {
          include: {
            matches: {
              where: { status: 'COMPLETED' },
              include: {
                player1: { select: { id: true, firstName: true, lastName: true } },
                player2: { select: { id: true, firstName: true, lastName: true } },
              },
            },
            players: {
              include: {
                player: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    playerProfile: true,
                  },
                },
              },
            },
          },
        },
        registrations: {
          where: { status: 'APPROVED' },
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                playerProfile: true,
              },
            },
          },
        },
      },
    });

    const standings = categories.map(category => {
      const playerStats = new Map();

      // Initialize all registered players
      category.registrations.forEach(reg => {
        playerStats.set(reg.player.id, {
          playerId: reg.player.id,
          playerName: `${reg.player.firstName} ${reg.player.lastName}`,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          gamesWon: 0,
          gamesLost: 0,
          points: 0,
        });
      });

      // Process knockout matches
      category.matches.forEach(match => {
        if (match.player1Id && match.player2Id) {
          let p1score = 0, p2score = 0;
          if (match.score) {
            const scores = match.score.split('-').map(Number);
            p1score = scores[0] || 0;
            p2score = scores[1] || 0;
          }
          this.updatePlayerStats(playerStats, match.player1Id, match.player2Id, match.winnerId, p1score, p2score);
        }
      });

      // Process group stage matches
      for (const group of category.groups) {
        for (const match of group.matches as any[]) {
          if (match.player1Id && match.player2Id) {
            this.updatePlayerStats(
              playerStats, 
              match.player1Id, 
              match.player2Id, 
              match.winnerId, 
              match.player1Score || 0, 
              match.player2Score || 0
            );
          }
        }
      }

      const sortedStats = Array.from(playerStats.values())
        .sort((a, b) => {
          if (a.points !== b.points) return b.points - a.points;
          if (a.wins !== b.wins) return b.wins - a.wins;
          const aDiff = a.gamesWon - a.gamesLost;
          const bDiff = b.gamesWon - b.gamesLost;
          return bDiff - aDiff;
        });

      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryType: category.type,
        totalPlayers: category.registrations.length,
        completedMatches: category.matches.length + category.groups.reduce((sum, g) => sum + g.matches.length, 0),
        standings: sortedStats,
      };
    });

    return standings;
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
                select: { id: true, firstName: true, lastName: true },
              },
              player2: {
                select: { id: true, firstName: true, lastName: true },
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
async getGlobalCategoryStandings(categoryName: string, limit: number = 50) {
  // Get all knockout matches for this exact category
  const knockoutMatches = await prisma.match.findMany({
    where: {
      category: {
        name: categoryName  // Exact match
      },
      status: 'COMPLETED',
    },
    include: {
      player1: { select: { id: true, firstName: true, lastName: true } },
      player2: { select: { id: true, firstName: true, lastName: true } },
      tournament: { select: { id: true, name: true } },
      category: { select: { name: true } },
    },
  });

  // Get all group stage matches for this exact category
  const groupMatches = await prisma.groupMatch.findMany({
    where: {
      group: {
        category: {
          name: categoryName  // Exact match
        }
      },
      status: 'COMPLETED',
    },
    include: {
      player1: { select: { id: true, firstName: true, lastName: true } },
      player2: { select: { id: true, firstName: true, lastName: true } },
      group: {
        include: {
          tournament: { select: { name: true } },
          category: { select: { name: true } },
        }
      },
    },
  });

  const playerStats = new Map();

  // Process knockout matches
  for (const match of knockoutMatches) {
    if (match.player1Id && match.player2Id && match.winnerId) {
      this.updateGlobalPlayerStats(playerStats, match);
    }
  }

  // Process group matches
  for (const match of groupMatches) {
    if (match.player1Id && match.player2Id && match.winnerId) {
      this.updateGlobalPlayerStatsFromGroup(playerStats, match);
    }
  }

  // Convert to array and sort
  const sortedStats = Array.from(playerStats.values())
    .sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.wins !== b.wins) return b.wins - a.wins;
      const aDiff = a.gamesWon - a.gamesLost;
      const bDiff = b.gamesWon - b.gamesLost;
      return bDiff - aDiff;
    })
    .slice(0, limit);

  // Fetch player names
  for (const player of sortedStats) {
    const user = await prisma.user.findUnique({
      where: { id: player.playerId },
      select: { firstName: true, lastName: true }
    });
    if (user) {
      player.playerName = `${user.firstName} ${user.lastName}`;
    }
  }

  return {
    categoryName,
    totalPlayers: playerStats.size,
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

