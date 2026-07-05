import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { TrophyIcon, ChartBarIcon } from "@heroicons/react/24/outline";

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
    if (selectedTournament) fetchStandings(); 
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const response = await api.get("/tournaments");
      const data = response.data.data;
      setTournaments(data);
      if (data.length > 0) setSelectedTournament(data[0].id);
    } catch { 
      toast.error("Failed to fetch tournaments"); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchStandings = async () => {
    setLoadingStandings(true);
    try {
      const response = await api.get(`/results/tournaments/${selectedTournament}/standings`);
      setStandings(response.data.data);
    } catch { 
      toast.error("Failed to fetch standings"); 
    } finally { 
      setLoadingStandings(false); 
    }
  };

  const getMedal = (i: number) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#061D23]">
      <p className="text-[#4AEEFF] text-lg font-bold uppercase tracking-[0.2em] animate-pulse">
        Loading...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#061D23] p-4 sm:p-6 lg:p-8 text-[#FFFFFF]">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col space-y-6">

        {/* Header */}
        <div className="rounded-[24px] border border-[#12679E] bg-gradient-to-br from-[#12679E]/20 to-[#061D23] p-6 shadow-[0_16px_60px_rgba(6,29,35,0.8)]">
          <div className="mb-4 h-1 w-24 rounded-full bg-[#4AEEFF]" />
          <div className="flex items-center gap-3">
            <TrophyIcon className="h-8 w-8 text-[#4AEEFF]" />
            <div>
              <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-[#FFFFFF]">Leaderboard</h1>
              <p className="text-sm uppercase tracking-[0.25em] text-[#4AEEFF]/70">Tournament standings & rankings</p>
            </div>
          </div>
        </div>

        {/* Tournament selector */}
<div className="rounded-[24px] border border-[#12679E]/40 bg-gradient-to-br from-[#061D23] to-[#12679E]/10 p-6 shadow-[inset_0_4px_12px_rgba(0,0,0,0.6),0_14px_50px_rgba(6,29,35,0.6)] transition-all duration-300 focus-within:border-[#4AEEFF] focus-within:shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_20px_rgba(74,238,255,0.25)]">
  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">
    Select Tournament
  </label>
  <select
    value={selectedTournament}
    onChange={(e) => setSelectedTournament(e.target.value)}
    className="w-full rounded-xl border border-[#12679E]/60 bg-[#061D23] px-4 py-3 text-[15px] text-[#FFFFFF] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all duration-300 focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF] sm:w-auto sm:min-w-[320px]"
  >
    {tournaments.map((t) => (
      <option key={t.id} value={t.id} className="bg-[#061D23] text-[#FFFFFF]">
        {t.name} ({t.status})
      </option>
    ))}
  </select>
</div>

        {/* Standings View */}
        {loadingStandings ? (
          <div className="rounded-[24px] border border-[#12679E] bg-gradient-to-br from-[#12679E]/10 to-[#061D23] p-12 text-center shadow-[0_14px_50px_rgba(6,29,35,0.6)]">
            <p className="text-[#4AEEFF] uppercase tracking-[0.2em] animate-pulse">Loading standings...</p>
          </div>
        ) : standings.length === 0 ? (
          <div className="rounded-[24px] border border-[#12679E] bg-gradient-to-br from-[#12679E]/10 to-[#061D23] p-12 text-center shadow-[0_14px_50px_rgba(6,29,35,0.6)]">
            <ChartBarIcon className="mx-auto mb-4 h-12 w-12 text-[#12679E]" />
            <p className="text-[#FFFFFF] text-lg font-medium">No standings available yet.</p>
            <p className="mt-2 text-sm text-[#4AEEFF]/60">Complete matches to generate rankings.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            {standings.map((category) => (
              <div
                key={category.categoryId}
                className="rounded-[24px] border border-[#12679E] bg-gradient-to-br from-[#12679E]/15 to-[#061D23] p-6 shadow-[0_14px_50px_rgba(6,29,35,0.6)]"
              >
                {/* Category header */}
                <div className="mb-2 h-1 w-16 rounded-full bg-[#4AEEFF]" />
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-black uppercase tracking-[0.15em] text-[#FFFFFF]">{category.categoryName}</h2>
                  <div className="flex gap-4 text-xs font-bold uppercase tracking-[0.15em] text-[#4AEEFF]/80">
                    <span>{category.totalPlayers} Players</span>
                    <span>·</span>
                    <span>{category.completedMatches} Matches</span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-[#12679E] bg-[#061D23]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[#12679E] bg-[#061D23]">
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Player</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Played</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Wins</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Losses</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Games W/L</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.standings.map((player, index) => (
                        <tr
                          key={player.playerId}
                          className={`border-b border-[#12679E]/30 transition-colors hover:bg-[#12679E]/20 ${
                            index === 0 ? "bg-[#4AEEFF]/10" : index === 1 ? "bg-[#4AEEFF]/5" : index === 2 ? "bg-[#4AEEFF]/2" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-[#FFFFFF] font-bold">{getMedal(index)}</td>
                          <td className="px-4 py-3">
                            <Link
                              to={`/profile/${player.playerId}`}
                              className="font-semibold text-[#4AEEFF] hover:text-[#FFFFFF] transition-colors"
                            >
                              {player.playerName}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-[#FFFFFF]/80">{player.matchesPlayed}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold text-[#4AEEFF]">{player.wins}</td>
                          <td className="px-4 py-3 text-center text-sm text-[#FFFFFF]/60">{player.losses}</td>
                          <td className="px-4 py-3 text-center text-sm text-[#FFFFFF]/80">{player.gamesWon} / {player.gamesLost}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="rounded-full bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 px-3 py-1 text-sm font-black text-[#4AEEFF]">
                              {player.points}
                            </span>
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