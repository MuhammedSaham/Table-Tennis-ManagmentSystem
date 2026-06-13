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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Tournament Leaderboard
        </h1>
      </div>

      {/* Tournament Selector */}
      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Tournament
        </label>
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="input-field max-w-md"
        >
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name} ({tournament.status})
            </option>
          ))}
        </select>
      </div>

      {loadingStandings ? (
        <div className="flex justify-center items-center h-64">
          Loading standings...
        </div>
      ) : standings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            No standings available for this tournament yet.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Complete matches to generate rankings.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {standings.map((category) => (
            <div key={category.categoryId} className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {category.categoryName}
                </h2>
                <div className="text-sm text-gray-500">
                  {category.totalPlayers} Players • {category.completedMatches}{" "}
                  Matches
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Player
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Played
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Wins
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Losses
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Games W/L
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {category.standings.map((player, index) => (
                      <tr key={player.playerId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {getMedalColor(index)}
                        </td>
                        <Link
                          to={`/profile/${player.playerId}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {player.playerName}
                        </Link>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">
                          {player.matchesPlayed}
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 font-medium text-center">
                          {player.wins}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-medium text-center">
                          {player.losses}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">
                          {player.gamesWon} / {player.gamesLost}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-primary-600 text-center">
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
  );
};

export default Leaderboard;
