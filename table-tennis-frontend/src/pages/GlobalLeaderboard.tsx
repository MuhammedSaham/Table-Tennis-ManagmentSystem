import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { ChevronDownIcon, TrophyIcon } from "@heroicons/react/24/outline";

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
    <div
      className="min-h-screen py-12"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(7,19,31,0.85) 0%, rgba(11,61,89,0.75) 40%, rgba(13,94,130,0.7) 100%), url('/bg1.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="relative mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20 relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,222,255,0.15),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_20%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-sm shadow-cyan-500/10">
              <TrophyIcon className="h-5 w-5 text-cyan-300" />
              Global leaderboard
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Global Leaderboard</h1>
            <p className="max-w-2xl text-base leading-7 text-slate-400">
              Consolidated player rankings across all tournaments and categories.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 shadow-lg shadow-black/10">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Categories</div>
              <div className="text-lg font-semibold text-cyan-300">{categories.length}</div>
            </div>
            <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 shadow-lg shadow-black/10">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Selected</div>
              <div className="text-lg font-semibold text-cyan-300">{selectedCategory || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Selector */}
      <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/20">
        <label className="mb-3 block text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          Select Category
        </label>
        {loadingCategories ? (
          <p className="text-cyan-300">Loading categories...</p>
        ) : (
          <div className="relative max-w-md">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 pr-12 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="" className="bg-slate-950 text-white">-- Select a category --</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name} className="bg-slate-950 text-white">
                  {category.name} ({category.type})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
              <ChevronDownIcon className="h-5 w-5" />
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Shows player rankings across ALL tournaments for this category
        </p>
      </div>

      {/* Standings Table */}
      {!selectedCategory ? (
        <div className="rounded-[32px] border border-white/10 bg-white/5 px-6 py-16 text-center backdrop-blur-xl shadow-2xl shadow-black/10">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-200 shadow-lg shadow-cyan-500/10">
            <TrophyIcon className="h-10 w-10" />
          </div>
          <p className="text-lg font-semibold text-white">Select a category to view rankings.</p>
          <p className="mt-2 text-sm text-slate-400">Choose a category from the dropdown to load the global table.</p>
        </div>
      ) : (
        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:shadow-cyan-500/10">
          <h2 className="mb-4 text-xl font-semibold text-white">{selectedCategory} - Overall Rankings</h2>

          {loading ? (
            <div className="py-8 text-center text-cyan-300">Loading rankings...</div>
          ) : standings.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-lg font-semibold text-white">No completed matches found for this category.</p>
              <p className="mt-2 text-sm text-slate-400">Play and complete matches to see rankings.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-cyan-400/20 bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Player</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">Matches</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">Wins</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">Losses</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">Points</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">Games</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {standings.map((player, index) => (
                    <tr key={player.playerId} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-sm font-medium text-cyan-300">{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`}</td>
                      <td className="px-4 py-3 text-sm">
                        <Link to={`/profile/${player.playerId}`} className="font-medium text-cyan-300 hover:text-white hover:underline">{player.playerName}</Link>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-400">{player.matchesPlayed}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-cyan-300">{player.wins}</td>
                      <td className="px-4 py-3 text-sm text-center text-red-400 font-medium">{player.losses}</td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-cyan-300">{player.points}</td>
                      <td className="px-4 py-3 text-center text-sm text-slate-400">{player.gamesWon} - {player.gamesLost}</td>
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
