import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { UmpireSheet } from "../components/GroupStandings";
import type { GroupMatch, GameScore } from "../components/GroupStandings";
import { UmpireSheet as KnockoutUmpireSheet } from "../components/KnockoutBracket";
import { TrophyIcon } from "@heroicons/react/24/outline";

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
    const isDoubles = match?.category?.type === "DOUBLES" || (!!match?.team1 && !match?.player1);

    const slot1Filled = isDoubles ? !!match?.team1 : !!match?.player1?.id;
    const slot2Filled = isDoubles ? !!match?.team2 : !!match?.player2?.id;
    if (!slot1Filled || !slot2Filled) {
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

    const winnerId = !isDoubles
      ? p1W > p2W
        ? match!.player1!.id
        : match!.player2!.id
      : undefined;

    const winnerTeamId = isDoubles
      ? p1W > p2W
        ? match!.team1!.id
        : match!.team2!.id
      : undefined;

    try {
      await api.patch(`/matches/${matchId}`, {
        score: parts.join(", "),
        winnerId,
        winnerTeamId,
        status: "COMPLETED",
        endTime: new Date().toISOString(),
        resultDetails: { bestOf },
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
        return "bg-sky-500/20 text-sky-300 border border-sky-400/30";
      case "ONGOING":
        return "bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-pulse";
      case "COMPLETED":
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
      case "CANCELLED":
      case "WALKOVER":
        return "bg-rose-500/20 text-rose-300 border border-rose-400/30";
      default:
        return "bg-white/10 text-white/80 border border-white/20";
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (filter === "pending" && (m.status !== "SCHEDULED" && m.status !== "ONGOING")) return false;
    if (filter === "completed" && m.status !== "COMPLETED") return false;
    
    if (matchType === "knockout" && m.isGroupMatch) return false;
    if (matchType === "group" && !m.isGroupMatch) return false;

    return true;
  });

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
          Loading assigned matches...
        </p>
      </div>
    );
  }

  const pendingCount = matches.filter(
    (m) => m.status === "SCHEDULED" || m.status === "ONGOING"
  ).length;
  const completedCount = matches.filter((m) => m.status === "COMPLETED").length;

  return wrapInBaseLayout(
    <>
      {/* HEADER MODULE */}
      <header className="flex flex-col justify-between gap-4 rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:flex-row sm:items-center">
        <div>
          <div className="mb-3 h-[3px] w-16 bg-[#4AEEFF]" />
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 align-middle mb-2">
            Match Official Portal
          </span>
          <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white sm:text-4xl">
            Referee Dashboard
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#4AEEFF]/90">
            Manage your assigned tournament matches and record official game scores
          </p>
        </div>
        <div className="flex gap-3 sm:gap-4">
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 px-4 py-3 text-right">
            <p className="text-xl font-black text-[#4AEEFF]">{matches.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Total</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 px-4 py-3 text-right">
            <p className="text-xl font-black text-amber-400">{pendingCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Pending</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 px-4 py-3 text-right">
            <p className="text-xl font-black text-emerald-400">{completedCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Completed</p>
          </div>
        </div>
      </header>

      {/* FILTER & STAGE CONTROLS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[16px] border border-white/20 bg-[#061D23]/15 p-4 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
        {/* Stage selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setMatchType("knockout")}
            className={`rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
              matchType === "knockout"
                ? "border-[#4AEEFF] bg-[#4AEEFF] text-[#061D23] shadow-md shadow-[#4AEEFF]/20"
                : "border-white/10 bg-[#061D23]/40 text-white/70 hover:border-[#4AEEFF] hover:text-[#4AEEFF]"
            }`}
          >
            Knockout Stage
          </button>
          <button
            onClick={() => setMatchType("group")}
            className={`rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
              matchType === "group"
                ? "border-[#4AEEFF] bg-[#4AEEFF] text-[#061D23] shadow-md shadow-[#4AEEFF]/20"
                : "border-white/10 bg-[#061D23]/40 text-white/70 hover:border-[#4AEEFF] hover:text-[#4AEEFF]"
            }`}
          >
            Group Stage
          </button>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-3">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
              filter === "all"
                ? "border-[#4AEEFF] bg-[#4AEEFF] text-[#061D23] shadow-md shadow-[#4AEEFF]/20"
                : "border-white/10 bg-[#061D23]/40 text-white/70 hover:border-[#4AEEFF] hover:text-[#4AEEFF]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
              filter === "pending"
                ? "border-[#4AEEFF] bg-[#4AEEFF] text-[#061D23] shadow-md shadow-[#4AEEFF]/20"
                : "border-white/10 bg-[#061D23]/40 text-white/70 hover:border-[#4AEEFF] hover:text-[#4AEEFF]"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
              filter === "completed"
                ? "border-[#4AEEFF] bg-[#4AEEFF] text-[#061D23] shadow-md shadow-[#4AEEFF]/20"
                : "border-white/10 bg-[#061D23]/40 text-white/70 hover:border-[#4AEEFF] hover:text-[#4AEEFF]"
            }`}
          >
            Completed
          </button>
        </div>
      </section>

      {/* MATCHES LIST */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <section className="rounded-[16px] border border-white/20 bg-[#061D23]/10 p-12 text-center shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
            <TrophyIcon className="mx-auto mb-3 h-10 w-10 text-white/20" />
            <h3 className="text-lg font-black uppercase tracking-wider text-white">
              No Matches Found
            </h3>
            <p className="mt-1 text-xs font-medium text-white/60">
              You don't have any assigned matches in this category right now.
            </p>
          </section>
        ) : (
          filteredMatches.map((match) => {
            const p1Name =
              match.team1?.name ||
              (match.player1
                ? `${match.player1.firstName} ${match.player1.lastName}`
                : "TBD");
            const p2Name =
              match.team2?.name ||
              (match.player2
                ? `${match.player2.firstName} ${match.player2.lastName}`
                : "TBD");

            return (
              <section
                key={match.id}
                className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all hover:border-[#4AEEFF]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusBadgeClass(
                        match.status
                      )}`}
                    >
                      {match.status}
                    </span>
                    <span className="text-xs font-mono uppercase tracking-wider text-white/60">
                      {match.tournament?.name} • {match.category?.name} • {match.round} • Match #{match.matchNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-base sm:text-lg font-black text-white">
                      {p1Name}
                    </div>
                    <span className="rounded bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 px-2 py-0.5 text-[10px] font-black text-[#4AEEFF]">
                      VS
                    </span>
                    <div className="text-base sm:text-lg font-black text-white">
                      {p2Name}
                    </div>
                  </div>

                  {match.score && (
                    <div className="text-sm font-black text-[#4AEEFF] font-mono">
                      Score: {match.score}
                    </div>
                  )}

                  {match.scheduledTime && (
                    <div className="text-xs font-mono text-white/50">
                      📍 {match.tournament?.venue} • 🕐{" "}
                      {new Date(match.scheduledTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => setSelectedMatch(match)}
                    className="w-full sm:w-auto rounded-xl bg-[#4AEEFF] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#061D23] shadow-md shadow-[#4AEEFF]/20 transition-all hover:bg-white hover:shadow-white/20 active:scale-95"
                  >
                    Manage Score →
                  </button>
                </div>
              </section>
            );
          })
        )}
      </div>

      {selectedMatch &&
        (selectedMatch.isGroupMatch ? (
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
        ))}
    </>
  );
};

export default RefereeMatches;
