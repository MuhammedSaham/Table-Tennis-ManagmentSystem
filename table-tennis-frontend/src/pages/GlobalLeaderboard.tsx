import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import { ChartBarIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [standings, setStandings] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => { fetchAllCategories(); }, []);
  useEffect(() => { if (selectedCategory) fetchGlobalStandings(); }, [selectedCategory]);

  const fetchAllCategories = async () => {
    try {
      const response = await api.get("/tournaments");
      const uniqueCategories = new Map();
      for (const tournament of response.data.data)
        for (const category of tournament.categories ?? [])
          if (!uniqueCategories.has(category.name)) uniqueCategories.set(category.name, category);
      setCategories(Array.from(uniqueCategories.values()));
    } catch { console.error("Failed to fetch categories"); }
    finally { setLoadingCategories(false); }
  };

  const fetchGlobalStandings = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/results/global/${encodeURIComponent(selectedCategory)}`);
      setStandings(response.data.data.standings);
    } catch { console.error("Failed to fetch global standings"); }
    finally { setLoading(false); }
  };

  const getMedal = (i: number) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[linear-gradient(180deg,#061D23_0%,#123B4A_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col space-y-6">

        {/* Header */}
        <div className="rounded-[24px] border border-[#12679E] bg-[linear-gradient(135deg,#123B4A_0%,#061D23_100%)] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
          <div className="mb-4 h-1 w-24 rounded-full bg-[#CFF9FF]" />
          <div className="flex items-center gap-3">
            <GlobeAltIcon className="h-8 w-8 text-[#4AEEFF]" />
            <div>
              <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-white">Global Rankings</h1>
              <p className="text-sm uppercase tracking-[0.25em] text-[#D8FBFF]">Cross-tournament player standings</p>
            </div>
          </div>
        </div>

        {/* Category selector */}
        <div className="rounded-[24px] border border-[#12679E] bg-[linear-gradient(145deg,#123B4A_0%,#061D23_100%)] p-6 shadow-[0_14px_50px_rgba(0,0,0,0.2)]">
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">
            Select Category
          </label>
          {loadingCategories ? (
            <p className="text-sm text-[#D8FBFF]">Loading categories...</p>
          ) : (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-[#12679E] bg-[#061D23] px-4 py-3 text-[15px] text-white focus:border-[#4AEEFF] focus:outline-none sm:w-auto sm:min-w-[320px]"
            >
              <option value="">-- Select a category --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name} ({c.type})</option>
              ))}
            </select>
          )}
          <p className="mt-2 text-xs text-[#D8FBFF] opacity-60">
            Shows player rankings across all tournaments for the selected category
          </p>
        </div>

        {/* Standings */}
        {selectedCategory && (
          loading ? (
            <div className="rounded-[24px] border border-[#12679E] bg-[linear-gradient(145deg,#123B4A_0%,#061D23_100%)] p-12 text-center shadow-[0_14px_50px_rgba(0,0,0,0.2)]">
              <p className="text-[#4AEEFF] uppercase tracking-[0.2em]">Loading rankings...</p>
            </div>
          ) : standings.length === 0 ? (
            <div className="rounded-[24px] border border-[#12679E] bg-[linear-gradient(145deg,#123B4A_0%,#061D23_100%)] p-12 text-center shadow-[0_14px_50px_rgba(0,0,0,0.2)]">
              <ChartBarIcon className="mx-auto mb-4 h-12 w-12 text-[#12679E]" />
              <p className="text-lg text-[#D8FBFF]">No completed matches found for this category.</p>
              <p className="mt-2 text-sm text-[#D8FBFF] opacity-60">Play and complete matches to see rankings.</p>
            </div>
          ) : (
            <div className="rounded-[24px] border border-[#12679E] bg-[linear-gradient(145deg,#123B4A_0%,#061D23_100%)] p-6 shadow-[0_14px_50px_rgba(0,0,0,0.2)]">
              <div className="mb-2 h-1 w-16 rounded-full bg-[#4AEEFF]" />
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-black uppercase tracking-[0.15em] text-white">
                  {selectedCategory} — Overall Rankings
                </h2>
                <span className="text-xs uppercase tracking-[0.15em] text-[#D8FBFF]">
                  {standings.length} Players
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#12679E]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#12679E] bg-[#061D23]">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Player</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Matches</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Wins</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Losses</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Games W/L</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((player, index) => (
                      <tr
                        key={player.playerId}
                        className={`border-b border-[#12679E]/40 transition hover:bg-[#12679E]/20 ${index === 0 ? "bg-[#12679E]/25" : index === 1 ? "bg-[#12679E]/15" : index === 2 ? "bg-[#12679E]/10" : ""}`}
                      >
                        <td className="px-4 py-3 text-sm font-bold text-[#D8FBFF]">{getMedal(index)}</td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/profile/${player.playerId}`}
                            className="font-semibold text-[#4AEEFF] transition hover:text-[#CFF9FF]"
                          >
                            {player.playerName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-[#D8FBFF]">{player.matchesPlayed}</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-[#4AEEFF]">{player.wins}</td>
                        <td className="px-4 py-3 text-center text-sm text-[#D8FBFF]">{player.losses}</td>
                        <td className="px-4 py-3 text-center text-sm text-[#D8FBFF]">{player.gamesWon} - {player.gamesLost}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-[#4AEEFF]/20 px-3 py-1 text-sm font-black text-[#4AEEFF]">
                            {player.points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

      </div>
    </div>
  );
};

export default GlobalLeaderboard;