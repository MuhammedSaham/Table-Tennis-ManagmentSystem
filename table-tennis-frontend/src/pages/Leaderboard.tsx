import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { TrophyIcon, CalendarIcon } from "@heroicons/react/24/outline";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      setSelectedCategory("ALL");
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-4 sm:space-y-6 p-3.5 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return wrapInBaseLayout(
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-white/20 border-t-[#4AEEFF] rounded-full animate-spin" />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
          Loading tournaments...
        </p>
      </div>
    );
  }

  const selectedTourneyObj = tournaments.find((t) => t.id === selectedTournament);
  const displayedStandings =
    selectedCategory === "ALL"
      ? standings
      : standings.filter((cat) => cat.categoryId === selectedCategory);

  return wrapInBaseLayout(
    <>
      {/* HEADER MODULE */}
      <header className="flex flex-col justify-between gap-3 rounded-[16px] border border-white/20 bg-[#061D23]/15 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 sm:mb-3 h-[3px] w-12 sm:w-16 bg-[#4AEEFF]" />
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 align-middle mb-1.5">
            Tournament Standings
          </span>
          <h1 className="text-2xl font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white sm:text-4xl">
            Leaderboard
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.15em] sm:tracking-[0.3em] text-[#4AEEFF]/90">
            Official results and match performance per tournament
          </p>
        </div>
        {selectedTourneyObj && (
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 px-4 py-2.5 sm:px-5 sm:py-3 text-left sm:text-right">
            <span className="inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/30 mb-1">
              {selectedTourneyObj.status}
            </span>
            <p className="text-sm sm:text-base font-black text-white">{selectedTourneyObj.name}</p>
          </div>
        )}
      </header>

      {/* TOURNAMENT & CATEGORY SELECTOR MODULE */}
      <section className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
        <div className="mb-3 sm:mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-[#4AEEFF]" />
          <h2 className="text-xs font-black uppercase tracking-widest text-[#4AEEFF]">
            Select Tournament
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full max-w-md rounded-xl border border-white/20 bg-[#061D23]/80 px-4 py-2.5 sm:py-3 text-sm font-medium text-white shadow-inner focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
          >
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id} className="bg-[#061D23] text-white">
                {tournament.name} ({tournament.status})
              </option>
            ))}
          </select>
          <span className="text-xs font-mono uppercase tracking-wider text-white/60">
            {standings.length} {standings.length === 1 ? "category" : "categories"} available
          </span>
        </div>

        {/* ─── CATEGORY SELECTOR PILLS ─── */}
        {standings.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-white/10">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/60">
                Filter by Category:
              </span>
              {selectedCategory !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className="text-[11px] text-[#4AEEFF] hover:underline"
                >
                  Show All ({standings.length})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 focus:outline-none ${
                  selectedCategory === "ALL"
                    ? "bg-[#4AEEFF] text-[#061D23] shadow-md shadow-[#4AEEFF]/25 scale-[1.01]"
                    : "bg-[#061D23]/50 text-white/70 border border-white/15 hover:border-[#4AEEFF]/40 hover:text-white"
                }`}
              >
                <span>All Categories</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    selectedCategory === "ALL"
                      ? "bg-[#061D23]/25 text-[#061D23]"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {standings.length}
                </span>
              </button>

              {standings.map((cat) => (
                <button
                  key={cat.categoryId}
                  type="button"
                  onClick={() => setSelectedCategory(cat.categoryId)}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 focus:outline-none ${
                    selectedCategory === cat.categoryId
                      ? "bg-[#4AEEFF] text-[#061D23] shadow-md shadow-[#4AEEFF]/25 scale-[1.01]"
                      : "bg-[#061D23]/50 text-white/70 border border-white/15 hover:border-[#4AEEFF]/40 hover:text-white"
                  }`}
                >
                  <span>{cat.categoryName}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      selectedCategory === cat.categoryId
                        ? "bg-[#061D23]/25 text-[#061D23]"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {cat.totalPlayers}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* CATEGORY STANDINGS */}
      {loadingStandings ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-white/20 border-t-[#4AEEFF] rounded-full animate-spin" />
          <p className="mt-3 text-xs font-black uppercase tracking-widest text-[#4AEEFF]">
            Loading standings...
          </p>
        </div>
      ) : standings.length === 0 ? (
        <section className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-8 sm:p-12 text-center shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <TrophyIcon className="mx-auto mb-3 h-10 w-10 text-white/20" />
          <p className="text-base font-bold text-white">
            No standings available for this tournament yet.
          </p>
          <p className="mt-1 text-xs text-white/60">
            Complete matches to generate standings and calculate points.
          </p>
        </section>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {displayedStandings.map((category) => (
            <section
              key={category.categoryId}
              className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl"
            >
              <div className="mb-4 sm:mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <span>🏆</span>
                  <span>{category.categoryName}</span>
                </h2>
                <div className="flex gap-2">
                  <span className="rounded-md border border-white/10 bg-[#061D23]/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {category.totalPlayers} Players
                  </span>
                  <span className="rounded-md border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#4AEEFF]">
                    {category.completedMatches} Matches Completed
                  </span>
                </div>
              </div>

              {category.standings.length === 0 ? (
                <p className="text-xs text-white/50 font-mono py-4">No completed fixtures in this category yet.</p>
              ) : (
                <>
                  {/* Mobile Standings Cards */}
                  <div className="space-y-2.5 sm:hidden">
                    {category.standings.map((player, index) => (
                      <div
                        key={player.playerId}
                        className="rounded-xl border border-white/10 bg-[#061D23]/60 p-3.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-black text-sm">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                            </div>
                            <Link
                              to={`/profile/${player.playerId}`}
                              className="truncate font-sans font-bold text-sm text-white capitalize hover:text-[#4AEEFF] transition-colors"
                            >
                              {player.playerName}
                            </Link>
                          </div>
                          <div className="shrink-0 rounded-lg border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 px-2.5 py-1 text-right">
                            <span className="font-mono text-sm font-black text-[#4AEEFF]">{player.points}</span>
                            <span className="ml-1 text-[9px] font-bold uppercase tracking-wider text-[#4AEEFF]/70">PTS</span>
                          </div>
                        </div>

                        <div className="mt-2.5 grid grid-cols-3 gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-center font-mono text-xs">
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-white/50">Played</span>
                            <span className="font-semibold text-white/90">{player.matchesPlayed}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-white/50">W - L</span>
                            <span className="font-semibold">
                              <span className="text-emerald-400">{player.wins}</span>
                              <span className="text-white/40"> - </span>
                              <span className="text-rose-400">{player.losses}</span>
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-white/50">Games</span>
                            <span className="font-semibold text-white/80">{player.gamesWon}-{player.gamesLost}</span>
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
                          <th className="px-5 py-3.5">Player</th>
                          <th className="px-5 py-3.5 text-center">Played</th>
                          <th className="px-5 py-3.5 text-center">Won</th>
                          <th className="px-5 py-3.5 text-center">Lost</th>
                          <th className="px-5 py-3.5 text-center">Points</th>
                          <th className="px-5 py-3.5 text-center">Games</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-sm">
                        {category.standings.map((player, index) => (
                          <tr key={player.playerId} className="hover:bg-white/5 transition-colors">
                            <td className="px-5 py-4 text-center font-black">
                              {index === 0 ? (
                                <span className="text-xl">🥇</span>
                              ) : index === 1 ? (
                                <span className="text-xl">🥈</span>
                              ) : index === 2 ? (
                                <span className="text-xl">🥉</span>
                              ) : (
                                <span className="text-white/60 font-bold">{index + 1}</span>
                              )}
                            </td>
                            <td className="px-5 py-4 font-sans font-bold capitalize">
                              <Link
                                to={`/profile/${player.playerId}`}
                                className="text-white hover:text-[#4AEEFF] transition-colors"
                              >
                                {player.playerName}
                              </Link>
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
          ))}
        </div>
      )}
    </>
  );
};

export default Leaderboard;
