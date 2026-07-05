import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

interface Player {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  points: number;
  gamesWon: number;
  gamesLost: number;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

const GlobalLeaderboard: React.FC = () => {
  const { user: _user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [standings, setStandings] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    fetchAllCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchGlobalStandings();
    }
  }, [selectedCategory]);

  const fetchAllCategories = async () => {
    try {
      // Fetch all tournaments to get unique categories
      const response = await api.get("/tournaments");
      const tournaments = response.data.data;

      const uniqueCategories = new Map();
      for (const tournament of tournaments) {
        for (const category of tournament.categories) {
          if (!uniqueCategories.has(category.name)) {
            uniqueCategories.set(category.name, category);
          }
        }
      }
      setCategories(Array.from(uniqueCategories.values()));
    } catch (error) {
      console.error("Failed to fetch categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchGlobalStandings = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/results/global/${encodeURIComponent(selectedCategory)}`,
      );
      setStandings(response.data.data.standings);
    } catch (error) {
      console.error("Failed to fetch global standings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#061D23] via-[#12679E] via-50% to-[#4AEEFF] py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Global Leaderboard</h1>
      </div>

      {/* Category Selector */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border-2 border-[#4AEEFF]/50">
        <label className="block text-sm font-medium text-white mb-2">
          Select Category
        </label>
        {loadingCategories ? (
          <p className="text-[#4AEEFF]">Loading categories...</p>
        ) : (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field max-w-md bg-white/90 text-gray-900 border border-[#4AEEFF]/30 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#4AEEFF]"
          >
            <option value="">-- Select a category --</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name} ({category.type})
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-[#4AEEFF]/70 mt-2">
          Shows player rankings across ALL tournaments for this category
        </p>
      </div>

      {/* Standings Table */}
      {selectedCategory && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-[#4AEEFF]/50">
          <h2 className="text-xl font-semibold text-white mb-4">
            {selectedCategory} - Overall Rankings
          </h2>

          {loading ? (
            <div className="text-center py-8 text-[#4AEEFF]">Loading rankings...</div>
          ) : standings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#4AEEFF] text-lg font-semibold">
                No completed matches found for this category.
              </p>
              <p className="text-sm text-[#4AEEFF]/70 mt-2">
                Play and complete matches to see rankings.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/10 border-b border-[#4AEEFF]/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#4AEEFF]">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#4AEEFF]">
                      Player
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-[#4AEEFF]">
                      Matches
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-[#4AEEFF]">
                      Wins
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-[#4AEEFF]">
                      Losses
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-[#4AEEFF]">
                      Points
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-[#4AEEFF]">
                      Games
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4AEEFF]/20">
                  {standings.map((player, index) => (
                    <tr key={player.playerId} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-sm font-medium text-[#4AEEFF]">
                        {index === 0
                          ? "🥇"
                          : index === 1
                            ? "🥈"
                            : index === 2
                              ? "🥉"
                              : `${index + 1}`}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          to={`/profile/${player.playerId}`}
                          className="text-[#4AEEFF] hover:text-white hover:underline font-medium"
                        >
                          {player.playerName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-white/70">
                        {player.matchesPlayed}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-[#4AEEFF] font-medium">
                        {player.wins}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-red-400 font-medium">
                        {player.losses}
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-bold text-[#4AEEFF]">
                        {player.points}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-white/70">
                        {player.gamesWon} - {player.gamesLost}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default GlobalLeaderboard;
