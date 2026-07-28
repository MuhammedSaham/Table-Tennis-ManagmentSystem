import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { UmpireSheet } from "../components/GroupStandings";
import type { GroupMatch, GameScore } from "../components/GroupStandings";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
}

interface Match {
  id: string;
  round: string;
  matchNumber: number;
  scheduledTime: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "WALKOVER";
  score: string | null;
  winnerId: string | null;
  player1: Player | null;
  player2: Player | null;
  player1Id: string | null;
  player2Id: string | null;
  team1?: { id: string; name: string } | null;
  team2?: { id: string; name: string } | null;
  tournament: {
    id: string;
    name: string;
    venue: string;
  };
  category: {
    name: string;
    type: string;
  };
  referee?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  isGroupMatch?: boolean;
}

import { UmpireSheet as KnockoutUmpireSheet } from "../components/KnockoutBracket";

const RefereeMatches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
  const [matchType, setMatchType] = useState<"knockout" | "group">("knockout");

  useEffect(() => {
    fetchAssignedMatches();
  }, []);

  const fetchAssignedMatches = async () => {
    try {
      const response = await api.get("/matches/my-assigned-matches");
      setMatches(response.data.data);
    } catch (error) {
      toast.error("Failed to load assigned matches");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupMatchSave = async (matchId: string, games: GameScore[], bestOf: 3 | 5) => {
    try {
      await api.patch(`/groups/group-matches/${matchId}`, { games, bestOf });
      toast.success("Score recorded successfully");
      fetchAssignedMatches();
      setSelectedMatch(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record score");
    }
  };

  const handleKnockoutMatchSave = async (matchId: string, games: GameScore[], bestOf: 3 | 5) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match?.player1?.id || !match?.player2?.id) {
      toast.error("Both players required");
      return;
    }

    const wn = Math.ceil(bestOf / 2);
    let p1W = 0, p2W = 0;
    const parts: string[] = [];
    for (const g of games) {
      if (!g.p1 || !g.p2) continue;
      const a = parseInt(g.p1), b = parseInt(g.p2);
      parts.push(`${a}-${b}`);
      if (a > b) p1W++;
      else p2W++;
    }
    if (p1W < wn && p2W < wn) {
      toast.error(`Need ${wn} wins`);
      return;
    }

    const winnerId = p1W > p2W ? match.player1.id : match.player2.id;
    try {
      await api.patch(`/matches/${matchId}`, {
        score: parts.join(", "),
        winnerId,
        status: "COMPLETED",
        endTime: new Date().toISOString(),
      });
      toast.success("Score saved successfully!");
      fetchAssignedMatches();
      setSelectedMatch(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record score");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "ONGOING":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (filter === "pending" && (m.status !== "SCHEDULED" && m.status !== "ONGOING")) return false;
    if (filter === "completed" && m.status !== "COMPLETED") return false;
    
    if (matchType === "knockout" && m.isGroupMatch) return false;
    if (matchType === "group" && !m.isGroupMatch) return false;

    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-semibold mt-4">Loading assigned matches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center pr-12 text-9xl pointer-events-none select-none">🏓</div>
        <div className="relative z-10 space-y-2">
          <span className="inline-block bg-primary-500/25 border border-primary-400/30 text-primary-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Match Official Portal</span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Referee Dashboard</h1>
          <p className="text-slate-300 max-w-xl text-sm sm:text-base font-medium">Manage your assigned tournament matches and record official game scores.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex gap-2">
          <button onClick={() => setMatchType("knockout")} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${matchType === "knockout" ? "bg-slate-900 text-white shadow-md shadow-slate-900/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>Knockout Stage</button>
          <button onClick={() => setMatchType("group")} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${matchType === "group" ? "bg-slate-900 text-white shadow-md shadow-slate-900/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>Group Stage</button>
        </div>
        <div className="flex gap-2 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-3">
          <button onClick={() => setFilter("pending")} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${filter === "pending" ? "bg-primary-600 text-white shadow-md shadow-primary-600/15" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>Pending</button>
          <button onClick={() => setFilter("completed")} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${filter === "completed" ? "bg-primary-600 text-white shadow-md shadow-primary-600/15" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>Completed</button>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 mt-6">
        {filteredMatches.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Matches Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">You don't have any matches in this category right now.</p>
          </div>
        ) : (
          filteredMatches.map((match) => (
            <div key={match.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className={`${getStatusBadgeClass(match.status)} px-2.5 py-1 rounded-lg text-xs font-bold border`}>{match.status}</span>
                <div className="mt-3 flex items-center gap-3">
                  <div className="font-bold text-gray-900">{match.player1 ? `${match.player1.firstName} ${match.player1.lastName}` : "TBD"}</div>
                  <span className="text-gray-400 font-bold text-xs">VS</span>
                  <div className="font-bold text-gray-900">{match.player2 ? `${match.player2.firstName} ${match.player2.lastName}` : "TBD"}</div>
                </div>
                <div className="mt-1 text-sm text-gray-500 font-medium">{match.category?.name} • {match.round} • Match #{match.matchNumber}</div>
              </div>
              <div>
                <button onClick={() => setSelectedMatch(match)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-sm w-full sm:w-auto">Manage Score</button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedMatch && (
        selectedMatch.isGroupMatch ? (
          <UmpireSheet
            match={selectedMatch as unknown as GroupMatch}
            onClose={() => setSelectedMatch(null)}
            onSave={handleGroupMatchSave}
            isAdminOrReferee={true}
            categoryName={selectedMatch.category?.name}
          />
        ) : (
          <KnockoutUmpireSheet 
            match={selectedMatch as any} 
            onClose={() => setSelectedMatch(null)} 
            onSave={handleKnockoutMatchSave}
            isAdminOrReferee={true}
          />
        )
      )}
    </div>
  );
};

export default RefereeMatches;
