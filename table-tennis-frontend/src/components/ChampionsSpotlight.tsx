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
    <div className="bg-[#061D23] py-20 relative border-t border-white/5 overflow-hidden w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#12679E]/20 border border-[#4AEEFF]/30 backdrop-blur-sm rounded-full px-4 py-1 mb-4 shadow-[0_0_15px_rgba(74,238,255,0.12)]">
            <TrophyIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-semibold text-[#4AEEFF] uppercase tracking-wider">Champions Spotlight</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 font-display">
            Recent Tournament <span className="bg-gradient-to-r from-yellow-400 via-amber-200 to-white bg-clip-text text-transparent">Champions</span>
          </h2>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
            Celebrating the winners of our recent championship tournaments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentWinners.map((winner, index) => (
            <Link
              key={`${winner.tournamentId}-${winner.categoryName}`}
              to={`/tournaments/${winner.tournamentId}`}
              className="group"
            >
              <div className="bg-[#08232B]/90 hover:bg-[#0C2F3A] border border-[#12679E]/40 hover:border-[#4AEEFF]/70 rounded-2xl overflow-hidden shadow-xl hover:shadow-[0_12px_35px_rgba(74,238,255,0.15)] transition-all duration-300 transform hover:-translate-y-1.5 backdrop-blur-md">
                {/* Medal Color Header */}
                <div
                  className={`h-2 ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                      : index === 1
                        ? "bg-gradient-to-r from-gray-400 to-gray-500"
                        : index === 2
                          ? "bg-gradient-to-r from-amber-600 to-amber-700"
                          : "bg-gradient-to-r from-[#12679E] to-[#4AEEFF]"
                  }`}
                />

                <div className="p-6">
                  {/* Tournament Name */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-[#4AEEFF] transition-colors">
                      {winner.tournamentName}
                    </h3>
                    {index === 0 && <span className="text-2xl">🏆</span>}
                    {index === 1 && <span className="text-2xl">🥈</span>}
                    {index === 2 && <span className="text-2xl">🥉</span>}
                  </div>

                  {/* Category */}
                  <p className="text-xs font-bold uppercase tracking-wider text-[#4AEEFF] bg-[#12679E]/30 border border-[#4AEEFF]/30 px-2.5 py-0.5 rounded-full inline-block mb-4">
                    {winner.categoryName}
                  </p>

                  {/* Winner Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                      🏆
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-yellow-400/90 font-medium">Champion</p>
                      <p className="font-bold text-white">
                        {winner.winner.firstName} {winner.winner.lastName}
                      </p>
                    </div>
                  </div>

                  {/* Runner Up */}
                  {winner.runnerUp && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-gray-300 text-xl">
                        🥈
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Runner-up</p>
                        <p className="font-medium text-gray-200">
                          {winner.runnerUp.firstName} {winner.runnerUp.lastName}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 2ndRunner Up */}
                  {winner.secondrunnerUp && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-gray-300 text-xl">
                        🥉
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                          Second Runner-up
                        </p>
                        <p className="font-medium text-gray-200">
                          {winner.secondrunnerUp.firstName}{" "}
                          {winner.secondrunnerUp.lastName}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Score */}
                  {winner.score && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs uppercase tracking-wider text-gray-400">Final Score</p>
                      <p className="font-mono font-semibold text-[#4AEEFF]">
                        {winner.score}
                      </p>
                    </div>
                  )}

                  {/* View Details Link */}
                  <div className="mt-4 pt-3 border-t border-white/10 text-[#4AEEFF] text-sm font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
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
