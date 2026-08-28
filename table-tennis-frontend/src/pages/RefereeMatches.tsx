import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { UmpireSheet } from "../components/GroupStandings";
import type { GroupMatch, GameScore } from "../components/GroupStandings";
import { UmpireSheet as KnockoutUmpireSheet } from "../components/KnockoutBracket";

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
        return "bg-sky-500/10 text-sky-300 border-sky-500/20";
      case "ONGOING":
        return "bg-amber-500/10 text-amber-300 border-amber-500/20";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-300 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/20";
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
      <div
        className="relative min-h-[60vh] bg-cover bg-fixed bg-center"
        style={{ backgroundImage: "url('/bg1.png')" }}
      >
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="relative z-10 flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-500/20 border-t-cyan-400" />
          <p className="mt-4 font-semibold text-slate-300">Loading assigned matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-fixed bg-center pb-12 animate-in fade-in duration-300"
      style={{ backgroundImage: "url('/bg1.png')" }}
    >
      <div className="absolute inset-0 bg-slate-950/70" />

      {/* Shared Container for All Cards */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Header Card */}
        <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-[#0c3942]/50 p-6 backdrop-blur-md">
          <div className="absolute right-0 top-0 flex h-full items-center justify-center pr-10 text-8xl opacity-10 pointer-events-none select-none sm:text-9xl">
            🏓
          </div>
          <div className="relative z-10 space-y-2">
            <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
              MATCH OFFICIAL PORTAL
            </span>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Referee Dashboard</h1>
            <p className="max-w-xl text-sm font-medium text-slate-300 sm:text-base">
              Manage your assigned tournament matches and record official game scores.
            </p>
          </div>
        </div>

        {/* Filter Controls Card */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-teal-500/20 bg-teal-950/30 p-4 backdrop-blur-md sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMatchType("knockout")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                matchType === "knockout"
                  ? "border border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Knockout Stage
            </button>
            <button
              onClick={() => setMatchType("group")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                matchType === "group"
                  ? "border border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Group Stage
            </button>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              onClick={() => setFilter("pending")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                filter === "pending"
                  ? "border border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                  : "border border-teal-500/20 bg-slate-950/30 text-slate-400 hover:text-white"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                filter === "completed"
                  ? "border border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                  : "border border-teal-500/20 bg-slate-950/30 text-slate-400 hover:text-white"
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Match Content Area (Now safely inside max-w-7xl) */}
        <div className="grid gap-4 sm:gap-6">
          {filteredMatches.length === 0 ? (
            <div className="rounded-2xl border border-teal-500/20 bg-teal-950/30 p-12 text-center backdrop-blur-md">
              <div className="mb-4 text-5xl text-cyan-300">📭</div>
              <h3 className="mb-2 text-xl font-bold text-white">No Matches Found</h3>
              <p className="mx-auto max-w-md text-slate-300">
                You don't have any matches in this category right now.
              </p>
            </div>
          ) : (
            filteredMatches.map((match) => (
              <div
                key={match.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-white shadow-sm backdrop-blur-md transition hover:border-cyan-500/40 sm:flex-row sm:items-center"
              >
                <div>
                  <span className={`${getStatusBadgeClass(match.status)} px-2.5 py-1 rounded-lg text-xs font-bold border`}>{match.status}</span>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="font-bold text-white">{match.player1 ? `${match.player1.firstName} ${match.player1.lastName}` : "TBD"}</div>
                    <span className="text-xs font-bold text-slate-400">VS</span>
                    <div className="font-bold text-white">{match.player2 ? `${match.player2.firstName} ${match.player2.lastName}` : "TBD"}</div>
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-400">
                    {match.category?.name} • {match.round} • Match #{match.matchNumber}
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => setSelectedMatch(match)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-5 py-2 text-sm font-bold text-white transition hover:border-cyan-500/40 hover:bg-slate-900 sm:w-auto"
                  >
                    Manage Score
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
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