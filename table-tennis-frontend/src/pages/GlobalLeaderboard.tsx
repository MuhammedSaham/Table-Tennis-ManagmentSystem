import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { TrophyIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import ScrollReveal from "../components/ScrollReveal";

interface Player {
  playerId: string;
  playerName: string;
  teamId?: string | null;
  participantType?: "PLAYER" | "TEAM";
  members?: {
    playerId: string;
    playerName: string;
  }[];
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
      const cats = Array.from(uniqueCategories.values());
      setCategories(cats);
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0].name);
      }
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

  const wrapInBaseLayout = (children: React.ReactNode) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
      {/* ─── BG.PNG FIXED FULL-BLEED BACKGROUND ─── */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      {/* Light overlay for text legibility over the paper-texture artwork */}
      <div className="fixed inset-0 bg-[#061D23]/25" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-6 p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );

  return wrapInBaseLayout(
    <>
      {/* HEADER MODULE */}
      <header className="animate-fade-up-1 flex flex-col justify-between gap-4 rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:flex-row sm:items-center">
        <div>
          <div className="mb-3 h-[3px] w-16 bg-[#4AEEFF] animate-laser-flow" />
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 align-middle mb-2">
            Official Rankings
          </span>
          <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white sm:text-4xl animate-light-sweep">
            Global Leaderboard
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#4AEEFF]/90">
            Player rankings and cross-tournament performance
          </p>
        </div>
        <div className="flex gap-4 text-left sm:text-right">
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 px-4 py-3">
            <p className="text-xl font-black text-[#4AEEFF]">
              {categories.length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              Categories
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 px-4 py-3">
            <p className="text-xl font-black text-[#4AEEFF]">
              {standings.length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              Ranked
            </p>
          </div>
        </div>
      </header>

      {/* CATEGORY SELECTOR MODULE */}
      <ScrollReveal delay={100}>
        <section className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-[#4AEEFF]" />
            <h2 className="text-xs font-black uppercase tracking-widest text-[#4AEEFF]">
              Filter Category
            </h2>
          </div>
          {loadingCategories ? (
            <p className="text-sm font-semibold text-[#4AEEFF] animate-pulse">
              Loading categories...
            </p>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full max-w-md rounded-xl border border-white/20 bg-[#061D23]/80 px-4 py-3 text-sm font-medium text-white shadow-inner focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
              >
                <option value="" className="bg-[#061D23] text-white">
                  -- Select a category --
                </option>
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.name}
                    className="bg-[#061D23] text-white"
                  >
                    {category.name} ({category.type})
                  </option>
                ))}
              </select>
              <p className="text-xs uppercase tracking-wider text-white/60 font-mono">
                Aggregated across all tournaments
              </p>
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* STANDINGS TABLE MODULE */}
      {selectedCategory && (
        <ScrollReveal delay={150}>
          <section className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
              {selectedCategory} — Overall Rankings
            </h2>
            <span className="self-start sm:self-auto rounded-md border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#4AEEFF]">
              {standings.length}{" "}
              {categories.find((category) => category.name === selectedCategory)
                ?.type === "DOUBLES" ||
              categories.find((category) => category.name === selectedCategory)
                ?.type === "MIXED_DOUBLES"
                ? "Teams"
                : "Players"}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-white/20 border-t-[#4AEEFF] rounded-full animate-spin" />
              <p className="mt-3 text-xs font-black uppercase tracking-widest text-[#4AEEFF]">
                Loading rankings...
              </p>
            </div>
          ) : standings.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#061D23]/30 p-12 text-center">
              <TrophyIcon className="mx-auto mb-3 h-10 w-10 text-white/20" />
              <p className="text-base font-bold text-white">
                No completed matches found for this category.
              </p>
              <p className="mt-1 text-xs text-white/60">
                Play and record tournament matches to generate rankings.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Standings Cards */}
              <div className="space-y-3 sm:hidden">
                {standings.map((player, index) => (
                  <div
                    key={player.playerId}
                    className="rounded-xl border border-white/10 bg-[#061D23]/60 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-black text-sm">
                          {index === 0
                            ? "🥇"
                            : index === 1
                              ? "🥈"
                              : index === 2
                                ? "🥉"
                                : `#${index + 1}`}
                        </div>
                        {player.participantType === "TEAM" ? (
                          <span className="font-sans font-bold text-white">
                            {player.playerName}
                          </span>
                        ) : (
                          <Link
                            to={`/profile/${player.playerId}`}
                            className="truncate font-sans font-bold text-white hover:text-[#4AEEFF] transition-colors"
                          >
                            {player.playerName}
                          </Link>
                        )}
                      </div>
                      <div className="shrink-0 rounded-lg border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 px-2.5 py-1 text-right">
                        <span className="font-mono text-sm font-black text-[#4AEEFF]">
                          {player.points}
                        </span>
                        <span className="ml-1 text-[9px] font-bold uppercase tracking-wider text-[#4AEEFF]/70">
                          PTS
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-center font-mono text-xs">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-white/50">
                          Matches
                        </span>
                        <span className="font-semibold text-white/90">
                          {player.matchesPlayed}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-white/50">
                          W - L
                        </span>
                        <span className="font-semibold">
                          <span className="text-emerald-400">
                            {player.wins}
                          </span>
                          <span className="text-white/40"> - </span>
                          <span className="text-rose-400">{player.losses}</span>
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-white/50">
                          Games
                        </span>
                        <span className="font-semibold text-white/80">
                          {player.gamesWon}-{player.gamesLost}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Standings Table */}
              <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/10 bg-[#061D23]/30">
                <table className="w-full">
                  <thead className="border-b border-white/15 bg-white/5 text-left text-xs font-black uppercase tracking-wider text-[#4AEEFF]">
                    <tr>
                      <th className="px-5 py-3.5 text-center w-16">Rank</th>
                      <th className="px-5 py-3.5">Player / Team</th>
                      <th className="px-5 py-3.5 text-center">Matches</th>
                      <th className="px-5 py-3.5 text-center">Wins</th>
                      <th className="px-5 py-3.5 text-center">Losses</th>
                      <th className="px-5 py-3.5 text-center">Points</th>
                      <th className="px-5 py-3.5 text-center">Games</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-sm">
                    {standings.map((player, index) => (
                      <tr
                        key={player.playerId}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-5 py-4 text-center font-black">
                          {index === 0 ? (
                            <span className="text-xl">🥇</span>
                          ) : index === 1 ? (
                            <span className="text-xl">🥈</span>
                          ) : index === 2 ? (
                            <span className="text-xl">🥉</span>
                          ) : (
                            <span className="text-white/60 font-bold">
                              {index + 1}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-sans font-bold">
                          <td className="px-5 py-4 font-sans font-bold">
                            {player.participantType === "TEAM" ? (
                              <span className="text-white">
                                {player.playerName}
                              </span>
                            ) : (
                              <Link
                                to={`/profile/${player.playerId}`}
                                className="text-white hover:text-[#4AEEFF] transition-colors"
                              >
                                {player.playerName}
                              </Link>
                            )}
                          </td>
                        </td>
                        <td className="px-5 py-4 text-center text-white/80">
                          {player.matchesPlayed}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-emerald-400">
                          {player.wins}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-rose-400">
                          {player.losses}
                        </td>
                        <td className="px-5 py-4 text-center font-black text-[#4AEEFF] text-base">
                          {player.points}
                        </td>
                        <td className="px-5 py-4 text-center text-white/70">
                          {player.gamesWon} - {player.gamesLost}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </ScrollReveal>
      )}
    </>,
  );
};

export default GlobalLeaderboard;
