import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { UmpireSheet } from "../components/GroupStandings";
import type { GroupMatch, GameScore } from "../components/GroupStandings";
import { UmpireSheet as KnockoutUmpireSheet } from "../components/KnockoutBracket";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
}

interface Team {
  id: string;
  name: string;
  members?: {
    player: Player;
  }[];
}

const getParticipantName = (
  player?: Player | null,
  team?: Team | null,
): string => {
  if (team) {
    const memberNames = team.members
      ?.map((member) =>
        `${member.player.firstName} ${member.player.lastName}`.trim(),
      )
      .filter(Boolean)
      .join(" / ");

    return memberNames || team.name || "TBD";
  }

  return player ? `${player.firstName} ${player.lastName}`.trim() : "TBD";
};

interface RefereeStatistics {
  groupStageMinutes: number;
  knockoutStageMinutes: number;
  totalWorkingMinutes: number;
  totalWorkingTime: string;
}

interface Match {
  id: string;
  round: string;
  matchNumber: number;
  scheduledTime: string;
  startTime?: string | null;
  endTime?: string | null;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "WALKOVER";
  score: string | null;
  winnerId: string | null;
  player1: Player | null;
  player2: Player | null;
  player1Id: string | null;
  player2Id: string | null;
  team1?: Team | null;
  team2?: Team | null;
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

const getMatchDurationMinutes = (match: Match): number | null => {
  if (!match.startTime || !match.endTime) return null;

  const start = new Date(match.startTime).getTime();
  const end = new Date(match.endTime).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return Math.round((end - start) / 60000);
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} hr`;

  return `${hours} hr ${remainingMinutes} min`;
};

const RefereeMatches: React.FC = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [refereeStats, setRefereeStats] = useState<RefereeStatistics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">(
    "pending",
  );
  const [matchType, setMatchType] = useState<"knockout" | "group">("knockout");
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    fetchAssignedMatches();
  }, []);

  const fetchAssignedMatches = async () => {
    try {
      const [matchesResponse, dashboardResponse] = await Promise.all([
        api.get("/matches/my-assigned-matches"),
        api.get("/dashboard/referee"),
      ]);

      setMatches(matchesResponse.data.data || []);
      setRefereeStats(dashboardResponse.data.data.statistics);
    } catch (error) {
      console.error("Failed to load referee dashboard", error);
      toast.error("Failed to load referee dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupMatchSave = async (
    matchId: string,
    games: GameScore[],
    bestOf: 3 | 5,
    startTime?: string,
    endTime?: string,
  ) => {
    try {
      const toDateTime = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);

        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        return date;
      };

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (startTime && endTime) {
        startDate = toDateTime(startTime);
        endDate = toDateTime(endTime);

        // Handle matches that finish after midnight
        if (endDate <= startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
      }
      const gamesPayload = games.map((game) => ({
        p1: game.p1 === "" || game.p1 == null ? null : Number(game.p1),
        p2: game.p2 === "" || game.p2 == null ? null : Number(game.p2),
      }));

      console.log("Converted games:", gamesPayload);
      console.log("Best of:", bestOf);

      await api.patch(`/groups/group-matches/${matchId}`, {
        games,
        bestOf,
        ...(startDate && {
          startTime: startDate.toISOString(),
        }),
        ...(endDate && {
          endTime: endDate.toISOString(),
        }),
      });

      console.log("Games sent to backend:", games);
      console.log("Best of:", bestOf);

      toast.success("Score recorded successfully");
      await fetchAssignedMatches();
      setSelectedMatch(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record score");
    }
  };

  const handleKnockoutMatchSave = async (
    matchId: string,
    games: GameScore[],
    bestOf: 3 | 5,
    startTime?: string,
    endTime?: string,
  ) => {
    const match = matches.find((m) => m.id === matchId);
    const isDoubles =
      match?.category?.type === "DOUBLES" ||
      (!!match?.team1 && !match?.player1);

    const slot1Filled = isDoubles ? !!match?.team1 : !!match?.player1?.id;
    const slot2Filled = isDoubles ? !!match?.team2 : !!match?.player2?.id;
    if (!slot1Filled || !slot2Filled) {
      toast.error("Both players required");
      return;
    }

    const wn = Math.ceil(bestOf / 2);
    let p1W = 0,
      p2W = 0;
    const parts: string[] = [];
    for (const g of games) {
      if (!g.p1 || !g.p2) continue;
      const a = parseInt(g.p1),
        b = parseInt(g.p2);
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

    const matchDate = match?.scheduledTime
      ? new Date(match.scheduledTime)
      : new Date();

    const toDateTime = (time?: string) => {
      if (!time) return undefined;

      const [hours, minutes] = time.split(":").map(Number);
      const date = new Date(matchDate);
      date.setHours(hours, minutes, 0, 0);

      return date;
    };

    const startDate = toDateTime(startTime);
    const endDate = toDateTime(endTime);

    if (startDate && endDate && endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const durationMinutes =
      startDate && endDate
        ? Math.round((endDate.getTime() - startDate.getTime()) / 60000)
        : null;

    try {
      await api.patch(`/matches/${matchId}`, {
        score: parts.join(", "),
        winnerId,
        winnerTeamId,
        status: "COMPLETED",
        ...(startDate ? { startTime: startDate.toISOString() } : {}),
        ...(endDate ? { endTime: endDate.toISOString() } : {}),
        resultDetails: {
          bestOf,
          ...(durationMinutes !== null ? { durationMinutes } : {}),
        },
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
    if (
      filter === "pending" &&
      m.status !== "SCHEDULED" &&
      m.status !== "ONGOING"
    )
      return false;
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col space-y-6 px-4 sm:px-6 lg:px-10 xl:px-14 py-4 sm:py-6 lg:py-8">
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
      </div>,
    );
  }

  const getInitials = (name?: string | null) => {
    if (!name || name === "TBD") return "TT";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const pendingCount = matches.filter(
    (m) => m.status === "SCHEDULED" || m.status === "ONGOING",
  ).length;
  const completedCount = matches.filter((m) => m.status === "COMPLETED").length;

  const totalOfficiatingMinutes = matches.reduce((total, match) => {
    if (match.status !== "COMPLETED") return total;

    const duration = getMatchDurationMinutes(match);

    return total + (duration ?? 0);
  }, 0);

  const nextPendingMatch =
    matches.find((m) => m.status === "ONGOING") ||
    matches.find((m) => m.status === "SCHEDULED");

  const nextP1Name = getParticipantName(
    nextPendingMatch?.player1,
    nextPendingMatch?.team1,
  );

  const nextP2Name = getParticipantName(
    nextPendingMatch?.player2,
    nextPendingMatch?.team2,
  );

  return wrapInBaseLayout(
    <>
      {/* HEADER MODULE */}
      <div className="pt-6 sm:pt-8 -mb-3">
        <header className="flex flex-col gap-3 rounded-[20px] border border-white/20 bg-[#061D23]/35 p-4 sm:p-5 lg:p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="w-2 h-5 bg-[#4AEEFF] rounded-full shadow-[0_0_10px_#4AEEFF]"></span>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/30">
                Official Match Portal
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                On Duty
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white break-words">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="mt-1.5 text-xs text-slate-300 max-w-xl">
              Inspect your assigned matches, manage court schedules, and enter
              official set scores.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRulesModal(true)}
                className="rounded-xl border border-white/20 bg-white/5 px-3.5 py-3 text-xs font-bold text-white hover:bg-white/10 hover:border-[#4AEEFF]/40 transition-all flex items-center gap-2 shadow-sm"
                title="ITTF Official Rules Quick Reference"
              >
                <span>📖</span>
                <span className="hidden sm:inline">ITTF Rules</span>
              </button>
              <button
                onClick={fetchAssignedMatches}
                className="rounded-xl border border-white/20 bg-white/5 p-3 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all shadow-sm"
                title="Refresh Assigned Matches"
              >
                🔄
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
              <div className="rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-center min-w-0">
                <p className="text-lg sm:text-xl font-black text-[#4AEEFF]">
                  {matches.length}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Total
                </p>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-3.5 py-2.5 text-center min-w-0">
                <p className="text-lg sm:text-xl font-black text-amber-400">
                  {pendingCount}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-amber-300/70">
                  Pending
                </p>
              </div>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3.5 py-2.5 text-center min-w-0">
                <p className="text-lg sm:text-xl font-black text-emerald-400">
                  {completedCount}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300/70">
                  Completed
                </p>
              </div>

              <div className="rounded-xl border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 px-3.5 py-2.5 text-center min-w-0">
                <p className="text-lg sm:text-xl font-black text-[#4AEEFF]">
                  {refereeStats
                    ? formatDuration(refereeStats.totalWorkingMinutes)
                    : formatDuration(totalOfficiatingMinutes)}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#4AEEFF]/80">
                  Officiating Time
                </p>
                {refereeStats && (
                  <p className="mt-1 text-[9px] text-[#4AEEFF]/70">
                    Group: {formatDuration(refereeStats.groupStageMinutes)}
                    {" | "}
                    Knockout:{" "}
                    {formatDuration(refereeStats.knockoutStageMinutes)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* ─── NEXT MATCH ON COURT SPOTLIGHT HERO ─── */}
      {nextPendingMatch && (
        <section className="relative -mt-3 overflow-hidden rounded-[20px] border border-[#4AEEFF]/40 bg-gradient-to-r from-[#061D23]/95 via-[#0A2E36]/85 to-[#061D23]/95 p-6 shadow-[0_20px_50px_-10px_rgba(74,238,255,0.2)] backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#4AEEFF] to-transparent shadow-[0_0_10px_#4AEEFF]" />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4AEEFF] text-[#061D23] font-black text-[10px] uppercase tracking-wider shadow-[0_0_15px_rgba(74,238,255,0.5)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#061D23] animate-ping"></span>
                  Next To Officiate
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                  Match #{nextPendingMatch.matchNumber} •{" "}
                  {nextPendingMatch.round}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#4AEEFF]/15 text-[#4AEEFF] text-[10px] font-black uppercase tracking-wider border border-[#4AEEFF]/30">
                  {nextPendingMatch.tournament?.name}
                </span>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#4AEEFF]/20 border border-[#4AEEFF]/40 flex items-center justify-center font-black text-xs text-[#4AEEFF]">
                    {getInitials(nextP1Name)}
                  </div>
                  <span className="text-lg sm:text-xl font-black text-white">
                    {nextP1Name}
                  </span>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-black text-[#4AEEFF]">
                  VS
                </span>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-black text-xs text-white">
                    {getInitials(nextP2Name)}
                  </div>
                  <span className="text-lg sm:text-xl font-black text-white">
                    {nextP2Name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-300 font-mono flex-wrap">
                <span>
                  📍 {nextPendingMatch.tournament?.venue || "Main Court"}
                </span>
                {nextPendingMatch.category && (
                  <>
                    <span>•</span>
                    <span>
                      {nextPendingMatch.category.name} (
                      {nextPendingMatch.category.type})
                    </span>
                  </>
                )}
                {nextPendingMatch.scheduledTime && (
                  <>
                    <span>•</span>
                    <span>
                      🕐 Scheduled:{" "}
                      {new Date(
                        nextPendingMatch.scheduledTime,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div>
              <button
                onClick={() => setSelectedMatch(nextPendingMatch)}
                className="w-full sm:w-auto rounded-xl bg-[#4AEEFF] hover:bg-white text-[#061D23] px-6 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg shadow-[#4AEEFF]/30 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>▶</span>
                <span>Open Scorecard & Record</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* FILTER & STAGE CONTROLS */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-[16px] border border-white/20 bg-[#061D23]/25 p-4 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
        {/* Stage selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setMatchType("knockout")}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              matchType === "knockout"
                ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            Knockout Stage
          </button>
          <button
            onClick={() => setMatchType("group")}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              matchType === "group"
                ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            Group Stage
          </button>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 border-t lg:border-t-0 lg:border-l border-white/10 pt-3 lg:pt-0 lg:pl-3 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filter === "all"
                ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filter === "pending"
                ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filter === "completed"
                ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            Completed
          </button>
        </div>
      </section>

      {/* MATCHES LIST */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <section className="rounded-[20px] border border-white/15 bg-[#061D23]/30 p-6 sm:p-8 lg:p-10 text-center shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
              🏓
            </div>
            <span className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-2">
              ● Official Standby
            </span>
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">
              No Matches in this Category
            </h3>
            <p className="mt-2 text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              {matches.length === 0
                ? "You do not have any matches assigned to your referee account yet. Once the tournament administrator assigns you a fixture, it will appear here instantly."
                : `You have no ${filter !== "all" ? filter : ""} matches for ${matchType === "knockout" ? "Knockout" : "Group"} stage right now.`}
            </p>

            {matches.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {filter !== "all" && (
                  <button
                    onClick={() => setFilter("all")}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition-all"
                  >
                    View All Stages
                  </button>
                )}
                <button
                  onClick={() =>
                    setMatchType(
                      matchType === "knockout" ? "group" : "knockout",
                    )
                  }
                  className="rounded-xl border border-[#4AEEFF]/30 bg-[#4AEEFF]/15 px-4 py-2 text-xs font-bold text-[#4AEEFF] hover:bg-[#4AEEFF] hover:text-[#061D23] transition-all"
                >
                  Switch to{" "}
                  {matchType === "knockout" ? "Group Stage" : "Knockout Stage"}
                </button>
              </div>
            )}
          </section>
        ) : (
          filteredMatches.map((match) => {
            const p1Name = getParticipantName(match.player1, match.team1);
            const p2Name = getParticipantName(match.player2, match.team2);

            const isP1Winner =
              match.status === "COMPLETED" &&
              (match.winnerId === match.player1?.id ||
                match.winnerId === match.team1?.id);
            const isP2Winner =
              match.status === "COMPLETED" &&
              (match.winnerId === match.player2?.id ||
                match.winnerId === match.team2?.id);

            const scoreParts = match.score
              ? match.score.split(",").map((s) => s.trim())
              : [];

            return (
              <section
                key={match.id}
                className="group rounded-[18px] border border-white/15 bg-[#061D23]/30 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all hover:border-[#4AEEFF]/40 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${getStatusBadgeClass(
                        match.status,
                      )}`}
                    >
                      {match.status}
                    </span>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                      {match.tournament?.name}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      {match.category?.name} ({match.category?.type})
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-[#4AEEFF] font-mono font-bold">
                      {match.round} • Match #{match.matchNumber}
                    </span>
                  </div>

                  {/* Competitor Matchup */}
                  <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                          isP1Winner
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                            : "bg-white/5 border-white/15 text-slate-300"
                        }`}
                      >
                        {getInitials(p1Name)}
                      </div>
                      <span
                        className={`text-base sm:text-lg font-black ${
                          isP1Winner ? "text-emerald-300" : "text-white"
                        }`}
                      >
                        {p1Name}
                      </span>
                      {isP1Winner && <span className="text-xs">👑</span>}
                    </div>

                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black text-slate-400">
                      VS
                    </span>

                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
                          isP2Winner
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                            : "bg-white/5 border-white/15 text-slate-300"
                        }`}
                      >
                        {getInitials(p2Name)}
                      </div>
                      <span
                        className={`text-base sm:text-lg font-black ${
                          isP2Winner ? "text-emerald-300" : "text-white"
                        }`}
                      >
                        {p2Name}
                      </span>
                      {isP2Winner && <span className="text-xs">👑</span>}
                    </div>
                  </div>

                  {/* Set-by-Set Score Pill Display */}
                  {scoreParts.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 font-mono">
                        Sets:
                      </span>
                      {scoreParts.map((setStr, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-black/40 border border-[#4AEEFF]/30 text-xs font-mono font-bold text-[#4AEEFF]"
                        >
                          {setStr}
                        </span>
                      ))}
                    </div>
                  )}

                  {match.status === "COMPLETED" &&
                    (() => {
                      const duration = getMatchDurationMinutes(match);

                      return (
                        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                          <span className="text-[#4AEEFF] font-bold">
                            ⏱ Officiating Duration:
                          </span>

                          <span className="rounded-md border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 px-2.5 py-1 text-[#4AEEFF] font-bold">
                            {duration !== null
                              ? formatDuration(duration)
                              : "Not recorded"}
                          </span>
                        </div>
                      );
                    })()}

                  {match.scheduledTime && (
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-2 flex-wrap">
                      <span>📍 {match.tournament?.venue || "Main Court"}</span>
                      <span>•</span>
                      <span>
                        🕐{" "}
                        {new Date(match.scheduledTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => setSelectedMatch(match)}
                    className={`w-full md:w-auto rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm ${
                      match.status === "COMPLETED"
                        ? "border border-white/20 bg-white/5 hover:bg-white/10 text-white"
                        : "bg-[#4AEEFF] hover:bg-white text-[#061D23] shadow-md shadow-[#4AEEFF]/20"
                    }`}
                  >
                    {match.status === "COMPLETED"
                      ? "View Score"
                      : "Manage Score →"}
                  </button>
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* ─── OFFICIAL ITTF RULES MODAL ─── */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#061D23]/95 border border-[#4AEEFF]/30 rounded-2xl max-w-2xl w-full p-6 sm:p-7 text-white shadow-2xl space-y-5 custom-scrollbar max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-5 bg-[#4AEEFF] rounded-full shadow-[0_0_10px_#4AEEFF]"></span>
                <h3 className="text-lg font-black uppercase tracking-wider">
                  ITTF Table Tennis Umpire Regulations
                </h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <p className="font-bold text-white uppercase text-[11px] text-[#4AEEFF]">
                  1. The Service (ITTF Law 2.6)
                </p>
                <p>
                  The ball must rest freely on the palm of the free hand (above
                  table level and behind the end line). It must be thrown near
                  vertically upwards at least 16 cm without adding spin, and
                  struck as it descends.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <p className="font-bold text-white uppercase text-[11px] text-[#4AEEFF]">
                  2. Scoring & Deuce (ITTF Law 2.11)
                </p>
                <p>
                  A game is won by the first player scoring 11 points, unless
                  both players score 10 points (deuce). At 10-10, the server
                  alternates after every single point, and a player must achieve
                  a 2-point lead to win.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <p className="font-bold text-white uppercase text-[11px] text-[#4AEEFF]">
                  3. Change of Ends (ITTF Law 2.13)
                </p>
                <p>
                  Players swap sides after each game. In the deciding final game
                  (Game 3 in best of 3, or Game 5 in best of 5), players must
                  change ends immediately when either player reaches 5 points.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                <p className="font-bold text-white uppercase text-[11px] text-[#4AEEFF]">
                  4. Timeouts & Towelling
                </p>
                <p>
                  Each player is entitled to ONE 1-minute timeout per match.
                  Towelling is permitted only every 6 points from the start of
                  each game, and at the change of ends in the final game.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowRulesModal(false)}
                className="rounded-xl bg-[#4AEEFF] px-5 py-2 text-xs font-black uppercase tracking-wider text-[#061D23] hover:bg-white transition-all shadow-md"
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}

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
            isAdminOrReferee={selectedMatch.status !== "COMPLETED"}
          />
        ))}
    </>,
  );
};

export default RefereeMatches;
