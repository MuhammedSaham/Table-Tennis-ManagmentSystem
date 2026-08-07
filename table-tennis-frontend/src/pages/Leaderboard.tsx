import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { ChevronDownIcon, TrophyIcon } from "@heroicons/react/24/outline";

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

  

  const fetchTournaments = async () => {
    try {
      const response = await api.get("/tournaments");
      setTournaments(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedTournament(response.data.data[0].id);
      }
    } catch {
      toast.error("Failed to fetch tournaments");
    } finally {
      setLoading(false);
    }
  };

  

  useEffect(() => {
    (async () => {
      await fetchTournaments();
    })();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      (async () => {
        setLoadingStandings(true);
        try {
          const response = await api.get(
            `/results/tournaments/${selectedTournament}/standings`,
          );
          setStandings(response.data.data);
        } catch {
          toast.error("Failed to fetch standings");
        } finally {
          setLoadingStandings(false);
        }
      })();
    }
  }, [selectedTournament]);

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
              Tournament leaderboard
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Tournament Leaderboard</h1>
            <p className="max-w-2xl text-base leading-7 text-slate-400">
              View rankings and player performance across tournaments. Switch tournaments to inspect category standings.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 shadow-lg shadow-black/10">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Tournaments</div>
              <div className="text-lg font-semibold text-cyan-300">{tournaments.length}</div>
            </div>
            <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 shadow-lg shadow-black/10">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Selected</div>
              <div className="text-lg font-semibold text-cyan-300">{tournaments.find(t => t.id === selectedTournament)?.name ?? '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Selector */}
      <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/20">
        <label className="mb-3 block text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          Select Tournament
        </label>
        <div className="relative max-w-md">
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 pr-12 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
          >
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id} className="bg-slate-950 text-white">
                {tournament.name} ({tournament.status})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
            <ChevronDownIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      {!selectedTournament ? (
        <div className="rounded-[32px] border border-white/10 bg-white/5 px-6 py-16 text-center backdrop-blur-xl shadow-2xl shadow-black/10">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-200 shadow-lg shadow-cyan-500/10">
            <TrophyIcon className="h-10 w-10" />
          </div>
          <p className="text-lg font-semibold text-white">Select a tournament to view standings.</p>
          <p className="mt-2 text-sm text-slate-400">Choose an event from the dropdown to load the category tables.</p>
        </div>
      ) : loadingStandings ? (
        <div className="flex justify-center items-center h-64 text-[#4AEEFF]">
          Loading standings...
        </div>
      ) : standings.length === 0 ? (
        <div className="rounded-[32px] border border-white/10 bg-white/5 px-6 py-12 text-center backdrop-blur-xl shadow-2xl shadow-black/10">
          <p className="text-lg font-semibold text-white">No standings available for this tournament yet.</p>
          <p className="mt-2 text-sm text-slate-400">Complete matches to generate rankings.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {standings.map((category) => (
            <div key={category.categoryId} className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:shadow-cyan-500/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-10 rounded-full bg-gradient-to-b from-[#4AEEFF] to-[#0FB9CC] shadow-md"></div>
                  <h2 className="text-xl font-semibold text-white">{category.categoryName}</h2>
                </div>
                <div className="text-sm text-slate-400">{category.totalPlayers} Players • {category.completedMatches} Matches</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-cyan-400/20">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                        Player
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">
                        Played
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">
                        Wins
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">
                        Losses
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">
                        Games W/L
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {category.standings.map((player, index) => (
                      <tr key={player.playerId} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-sm font-medium text-cyan-300">{getMedalColor(index)}</td>
                        <td className="px-4 py-3 text-sm">
                          <Link to={`/profile/${player.playerId}`} className="font-medium text-cyan-300 hover:text-white hover:underline">
                            {player.playerName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-400">{player.matchesPlayed}</td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-cyan-300">{player.wins}</td>
                        <td className="px-4 py-3 text-sm text-red-400 font-medium text-center">{player.losses}</td>
                        <td className="px-4 py-3 text-sm text-center text-slate-400">{player.gamesWon} / {player.gamesLost}</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-cyan-300">{player.points}</td>
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
