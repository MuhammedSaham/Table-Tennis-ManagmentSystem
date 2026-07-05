import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

interface Tournament {
  id: string;
  name: string;
  status: string;
}

interface Standing {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
}

interface CategoryStanding {
  categoryId: string;
  categoryName: string;
  totalPlayers: number;
  completedMatches: number;
  standings: Standing[];
}

const Leaderboard: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [standings, setStandings] = useState<CategoryStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchStandings();
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const response = await api.get("/tournaments");
      setTournaments(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedTournament(response.data.data[0].id);
      }
    } catch (error) {
      toast.error("Failed to fetch tournaments");
    } finally {
      setLoading(false);
    }
  };

  const fetchStandings = async () => {
    setLoadingStandings(true);
    try {
      const response = await api.get(
        `/results/tournaments/${selectedTournament}/standings`,
      );
      setStandings(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch standings");
    } finally {
      setLoadingStandings(false);
    }
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading tournaments...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#061D23] via-[#12679E] via-50% to-[#4AEEFF] py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          Tournament Leaderboard
        </h1>
      </div>

      {/* Tournament Selector */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border-2 border-[#4AEEFF]/50">
        <label className="block text-sm font-medium text-white mb-2">
          Select Tournament
        </label>
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="input-field max-w-md bg-white/90 text-gray-900 border border-[#4AEEFF]/30 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4AEEFF]"
        >
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name} ({tournament.status})
            </option>
          ))}
        </select>
      </div>

      {loadingStandings ? (
        <div className="flex justify-center items-center h-64 text-[#4AEEFF]">
          Loading standings...
        </div>
      ) : standings.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl text-center py-12 border-2 border-[#4AEEFF]/50">
          <p className="text-[#4AEEFF] text-lg font-semibold">
            No standings available for this tournament yet.
          </p>
          <p className="text-sm text-[#4AEEFF]/80 mt-2">
            Complete matches to generate rankings.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {standings.map((category) => (
            <div key={category.categoryId} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-[#4AEEFF]/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {category.categoryName}
                </h2>
                <div className="text-sm text-white/70">
                  {category.totalPlayers} Players • {category.completedMatches}{" "}
                  Matches
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10 border-b border-[#4AEEFF]/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white/80">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-white/80">
                        Player
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-white/80">
                        Played
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-white/80">
                        Wins
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-white/80">
                        Losses
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-white/80">
                        Games W/L
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-white/80">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4AEEFF]/20">
                    {category.standings.map((player, index) => (
                      <tr key={player.playerId} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-sm font-medium text-white/90">
                          {getMedalColor(index)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link
                            to={`/profile/${player.playerId}`}
                            className="text-[#4AEEFF] hover:text-white hover:underline font-medium"
                          >
                            {player.playerName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/70 text-center">
                          {player.matchesPlayed}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4AEEFF] font-medium text-center">
                          {player.wins}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-400 font-medium text-center">
                          {player.losses}
                        </td>
                        <td className="px-4 py-3 text-sm text-white/70 text-center">
                          {player.gamesWon} / {player.gamesLost}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-[#4AEEFF] text-center">
                          {player.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default Leaderboard;
