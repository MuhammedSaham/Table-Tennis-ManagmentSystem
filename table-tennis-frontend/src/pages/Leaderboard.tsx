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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-6">
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

  return wrapInBaseLayout(
    <>
      {/* HEADER MODULE */}
      <header className="flex flex-col justify-between gap-4 rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:flex-row sm:items-center">
        <div>
          <div className="mb-3 h-[3px] w-16 bg-[#4AEEFF]" />
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 align-middle mb-2">
            Tournament Standings
          </span>
          <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white sm:text-4xl">
            Leaderboard
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#4AEEFF]/90">
            Official results and match performance per tournament
          </p>
        </div>
        {selectedTourneyObj && (
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 px-5 py-3 text-right">
            <span className="inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/30 mb-1">
              {selectedTourneyObj.status}
            </span>
            <p className="text-base font-black text-white">{selectedTourneyObj.name}</p>
          </div>
        )}
      </header>

      {/* TOURNAMENT SELECTOR MODULE */}
      <section className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-[#4AEEFF]" />
          <h2 className="text-xs font-black uppercase tracking-widest text-[#4AEEFF]">
            Select Tournament
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full max-w-md rounded-xl border border-white/20 bg-[#061D23]/80 px-4 py-3 text-sm font-medium text-white shadow-inner focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
          >
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id} className="bg-[#061D23] text-white">
                {tournament.name} ({tournament.status})
              </option>
            ))}
          </select>
          <span className="text-xs font-mono uppercase tracking-wider text-white/60">
            {standings.length} categories available
          </span>
        </div>
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
        <section className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-12 text-center shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <TrophyIcon className="mx-auto mb-3 h-10 w-10 text-white/20" />
          <p className="text-base font-bold text-white">
            No standings available for this tournament yet.
          </p>
          <p className="mt-1 text-xs text-white/60">
            Complete matches to generate standings and calculate points.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {standings.map((category) => (
            <section
              key={category.categoryId}
              className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl"
            >
              <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-lg font-black uppercase tracking-wider text-white">
                  {category.categoryName}
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
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#061D23]/30">
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
                          <td className="px-5 py-4 font-sans font-bold">
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
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
};

export default Leaderboard;
