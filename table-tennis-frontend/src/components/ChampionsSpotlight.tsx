import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { TrophyIcon } from "@heroicons/react/24/outline";

interface Winner {
  tournamentId: string;
  tournamentName: string;
  categoryName: string;
  position: number;
  winner: {
    firstName: string;
    lastName: string;
    id: string;
  };
  runnerUp: {
    firstName: string;
    lastName: string;
    id: string;
  };
  secondrunnerUp?: {
    firstName: string;
    lastName: string;
    id: string;
  };
  score: string;
  completedAt: string;
}

const ChampionsSpotlight: React.FC = () => {
  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentWinners();
  }, []);

  const fetchRecentWinners = async () => {
    try {
      // Get all completed tournaments
      const tournamentsRes = await api.get("/tournaments");
      const completedTournaments = tournamentsRes.data.data.filter(
        (t: any) => t.status === "COMPLETED",
      );

      const winners = [];

      for (const tournament of completedTournaments.slice(0, 3)) {
        // Get winners for each tournament
        const winnersRes = await api.get(
          `/results/tournaments/${tournament.id}/winners`,
        );
        const categoryWinners = winnersRes.data.data.winners;

        for (const category of categoryWinners) {
          if (category.winner) {
            winners.push({
              tournamentId: tournament.id,
              tournamentName: tournament.name,
              categoryName: category.categoryName,
              position: 1,
              winner: category.winner,
              runnerUp: category.runnerUp,
              secondrunnerUp: category.secondrunnerUp,
              score: category.score,
              completedAt: tournament.endDate,
            });
          }
        }
      }

      setRecentWinners(winners.slice(0, 6)); // Show top 6 recent winners
    } catch (error) {
      console.error("Failed to fetch winners:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="spinner mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading champions...</p>
      </div>
    );
  }

  if (recentWinners.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary-900 to-primary-800 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
            <TrophyIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white/90">Champions Spotlight</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Recent Tournament Champions
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Celebrating the winners of our recent tournaments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentWinners.map((winner, index) => (
            <Link
              key={`${winner.tournamentId}-${winner.categoryName}`}
              to={`/tournaments/${winner.tournamentId}`}
              className="group"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Medal Color Header */}
                <div
                  className={`h-2 ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                      : index === 1
                        ? "bg-gradient-to-r from-gray-400 to-gray-500"
                        : index === 2
                          ? "bg-gradient-to-r from-amber-600 to-amber-700"
                          : "bg-gradient-to-r from-primary-500 to-secondary-500"
                  }`}
                />

                <div className="p-6">
                  {/* Tournament Name */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {winner.tournamentName}
                    </h3>
                    {index === 0 && <span className="text-2xl">🏆</span>}
                    {index === 1 && <span className="text-2xl">🥈</span>}
                    {index === 2 && <span className="text-2xl">🥉</span>}
                  </div>

                  {/* Category */}
                  <p className="text-sm text-primary-600 font-medium mb-4">
                    {winner.categoryName}
                  </p>

                  {/* Winner Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white text-xl">
                      🏆
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Champion</p>
                      <p className="font-bold text-gray-900">
                        {winner.winner.firstName} {winner.winner.lastName}
                      </p>
                    </div>
                  </div>

                  {/* Runner Up */}
                  {winner.runnerUp && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl">
                        🥈
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Runner-up</p>
                        <p className="font-medium text-gray-700">
                          {winner.runnerUp.firstName} {winner.runnerUp.lastName}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 2ndRunner Up */}
                  {winner.secondrunnerUp && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl">
                        🥉
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Second Runner-up
                        </p>
                        <p className="font-medium text-gray-700">
                          {winner.secondrunnerUp.firstName}{" "}
                          {winner.secondrunnerUp.lastName}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Score */}
                  {winner.score && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-500">Final Score</p>
                      <p className="font-mono font-semibold text-primary-600">
                        {winner.score}
                      </p>
                    </div>
                  )}

                  {/* View Details Link */}
                  <div className="mt-4 text-primary-600 text-sm font-medium group-hover:text-primary-700 transition">
                    View Tournament Details →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChampionsSpotlight;
