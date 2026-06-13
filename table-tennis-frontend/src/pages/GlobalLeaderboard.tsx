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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Global Leaderboard</h1>
      </div>

      {/* Category Selector */}
      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Category
        </label>
        {loadingCategories ? (
          <p>Loading categories...</p>
        ) : (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field max-w-md"
          >
            <option value="">-- Select a category --</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name} ({category.type})
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Shows player rankings across ALL tournaments for this category
        </p>
      </div>

      {/* Standings Table */}
      {selectedCategory && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {selectedCategory} - Overall Rankings
          </h2>

          {loading ? (
            <div className="text-center py-8">Loading rankings...</div>
          ) : standings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No completed matches found for this category.
              </p>
              <p className="text-sm text-gray-400">
                Play and complete matches to see rankings.
              </p>
            </div>
          ) : (
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
                      Matches
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Wins
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Losses
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Points
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Games
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {standings.map((player, index) => (
                    <tr key={player.playerId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {index === 0
                          ? "🥇"
                          : index === 1
                            ? "🥈"
                            : index === 2
                              ? "🥉"
                              : `${index + 1}`}
                      </td>
                      <Link
                        to={`/profile/${player.playerId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {player.playerName}
                      </Link>
                      <td className="px-4 py-3 text-sm text-center">
                        {player.matchesPlayed}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-green-600">
                        {player.wins}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-red-600">
                        {player.losses}
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-bold">
                        {player.points}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
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
  );
};

export default GlobalLeaderboard;
