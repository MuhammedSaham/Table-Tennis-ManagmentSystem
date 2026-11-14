import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import BackButton from "../components/BackButton";
import { useAuth } from "../context/AuthContext";
import {
  CalendarIcon,
  TrophyIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

interface MatchParticipant {
  id: string;
  firstName: string;
  lastName: string;
}

interface MatchTeam {
  id: string;
  name?: string;
  members?: Array<{
    player?: MatchParticipant;
  }>;
}

interface Match {
  id: string;
  round: string;
  matchNumber: number;
  scheduledTime: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  score: string | null;
  winnerId: string | null;
  winnerTeamId?: string | null;
  player1: MatchParticipant | null;
  player2: MatchParticipant | null;
  team1?: MatchTeam | null;
  team2?: MatchTeam | null;
  tournament: {
    id: string;
    name: string;
    venue: string;
  };
  category: {
    name: string;
    type: string;
  };
}

const MyMatches: React.FC = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await api.get("/matches/my-matches");
      setMatches(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine if a match was won by the logged-in user
  const isMatchWonByUser = (match: Match, userId?: string): boolean => {
    if (match.status !== "COMPLETED" || !userId) return false;

    // 1. Direct Singles winner match
    if (match.winnerId && match.winnerId === userId) return true;

    // 2. Doubles/Team winnerTeamId match
    if (match.winnerTeamId) {
      if (match.team1 && match.team1.id === match.winnerTeamId) {
        return Boolean(
          match.team1.members?.some((m) => m.player?.id === userId),
        );
      }
      if (match.team2 && match.team2.id === match.winnerTeamId) {
        return Boolean(
          match.team2.members?.some((m) => m.player?.id === userId),
        );
      }
    }

    // 3. Fallback: winnerId is teammate
    if (match.winnerId) {
      if (match.team1 && match.team1.members?.some((m) => m.player?.id === userId)) {
        return Boolean(
          match.team1.members?.some((m) => m.player?.id === match.winnerId),
        );
      }
      if (match.team2 && match.team2.members?.some((m) => m.player?.id === userId)) {
        return Boolean(
          match.team2.members?.some((m) => m.player?.id === match.winnerId),
        );
      }
    }

    return false;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-500/20 text-blue-300 border border-blue-400/30";
      case "ONGOING":
        return "bg-amber-500/20 text-amber-300 border border-amber-400/30";
      case "COMPLETED":
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
      case "CANCELLED":
        return "bg-red-500/20 text-red-300 border border-red-400/30";
      default:
        return "bg-white/10 text-white/70 border border-white/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "📅 Scheduled";
      case "ONGOING":
        return "🏃 Ongoing";
      case "COMPLETED":
        return "✅ Completed";
      case "CANCELLED":
        return "❌ Cancelled";
      default:
        return status;
    }
  };

  const filteredMatches = matches.filter((match) => {
    if (filter === "upcoming") {
      return match.status === "SCHEDULED" || match.status === "ONGOING";
    }
    if (filter === "completed") {
      return match.status === "COMPLETED";
    }
    return true;
  });

  // Calculate statistics accurately for logged-in user
  const totalMatches = matches.length;
  const completedMatches = matches.filter((m) => m.status === "COMPLETED").length;
  const wins = matches.filter((m) => isMatchWonByUser(m, user?.id)).length;
  const losses = Math.max(0, completedMatches - wins);
  const winRate =
    completedMatches > 0 ? ((wins / completedMatches) * 100).toFixed(1) : "0";

  // Helper to render Side participant (Singles or Doubles with Partners)
  const renderParticipant = (
    team: MatchTeam | null | undefined,
    player: MatchParticipant | null | undefined,
    side: "left" | "right",
  ) => {
    const isCurrentUser = (id?: string) => Boolean(user?.id && id === user.id);

    // If Doubles / Team with members
    if (team?.members && team.members.length > 0) {
      const p1 = team.members[0]?.player;
      const p2 = team.members[1]?.player;

      return (
        <div className={`flex flex-col ${side === "left" ? "text-right" : "text-left"}`}>
          <div className="flex flex-col gap-0.5">
            <span
              className={`font-bold text-xs sm:text-sm truncate ${
                isCurrentUser(p1?.id) ? "text-[#4AEEFF] font-black" : "text-white"
              }`}
            >
              {p1 ? `${p1.firstName} ${p1.lastName}` : "TBD"}
              {isCurrentUser(p1?.id) && (
                <span className="text-[10px] ml-1 text-[#4AEEFF]/80 font-normal">
                  (You)
                </span>
              )}
            </span>
            {p2 && (
              <span
                className={`font-semibold text-xs truncate ${
                  isCurrentUser(p2?.id) ? "text-[#4AEEFF] font-black" : "text-cyan-200/80"
                }`}
              >
                & {p2.firstName} {p2.lastName}
                {isCurrentUser(p2?.id) && (
                  <span className="text-[10px] ml-1 text-[#4AEEFF]/80 font-normal">
                    (You)
                  </span>
                )}
              </span>
            )}
          </div>
          {team.name && (
            <span className="text-[10px] text-white/50 font-mono mt-1 truncate">
              Team: {team.name}
            </span>
          )}
        </div>
      );
    }

    // Singles Player
    if (player) {
      const isYou = isCurrentUser(player.id);
      return (
        <div className={side === "left" ? "text-right" : "text-left"}>
          <p
            className={`font-bold text-xs sm:text-base truncate ${
              isYou ? "text-[#4AEEFF] font-black" : "text-white"
            }`}
          >
            {player.firstName} {player.lastName}
            {isYou && (
              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-[#4AEEFF]/20 text-[#4AEEFF] font-bold uppercase tracking-wider">
                You
              </span>
            )}
          </p>
        </div>
      );
    }

    // Awaiting fixture
    return (
      <div className={side === "left" ? "text-right" : "text-left"}>
        <p className="text-xs sm:text-sm font-semibold text-white/50 italic">
          Fixture not generated yet
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('/bg1.png')" }}
        />
        <div className="fixed inset-0 bg-[#061D23]/25 pointer-events-none" />
        <div className="relative z-10 flex min-h-screen items-center justify-center text-sm font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
          Loading your matches...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
      {/* Background with texture & subtle gradient */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      <div className="fixed inset-0 bg-[#061D23]/25 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35 pointer-events-none" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col space-y-6 px-4 sm:px-6 lg:px-10 xl:px-14 py-4 sm:py-6 lg:py-8">
        {/* Header with accurate stats strip */}
        <header className="flex flex-col justify-between gap-5 rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl md:flex-row md:items-center">
          <div>
            <BackButton to="/app/dashboard" label="Back to Dashboard" className="mb-3" />
            <h1 className="text-2xl font-black uppercase tracking-[0.15em] text-white sm:text-3xl lg:text-4xl">
              My Matches
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#4AEEFF]">
              Track your tournament fixtures, partners and results
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
            <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xl sm:text-2xl font-black text-white">{totalMatches}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                Matches
              </p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xl sm:text-2xl font-black text-[#4AEEFF]">
                {wins}W <span className="text-xs text-white/50 font-normal">/ {losses}L</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                Record
              </p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-[#4AEEFF]/10 border border-[#4AEEFF]/30">
              <p className="text-xl sm:text-2xl font-black text-[#4AEEFF]">{winRate}%</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#4AEEFF]">
                Win Rate
              </p>
            </div>
          </div>
        </header>

        {/* Filter Controls */}
        <section className="rounded-2xl border border-white/20 bg-[#061D23]/25 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-[#4AEEFF]" />
              <h2 className="text-xs font-black uppercase tracking-widest text-[#4AEEFF]">
                Match Log
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All Matches", count: matches.length },
                {
                  key: "upcoming",
                  label: "Upcoming",
                  count: matches.filter(
                    (m) => m.status === "SCHEDULED" || m.status === "ONGOING",
                  ).length,
                },
                { key: "completed", label: "Completed", count: completedMatches },
              ].map((tab) => {
                const isActive = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? "bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/50 shadow-[0_0_15px_rgba(74,238,255,0.2)]"
                        : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? "bg-[#4AEEFF] text-[#061D23]"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Match List */}
        {filteredMatches.length === 0 ? (
          <section className="rounded-2xl border border-white/20 bg-[#061D23]/20 p-12 text-center shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
            <TrophyIcon className="mx-auto mb-3 h-12 w-12 text-white/20" />
            <h3 className="text-base font-bold text-white">No matches found</h3>
            <p className="text-xs text-white/60 mt-1">
              {filter === "upcoming"
                ? "You have no upcoming matches scheduled right now."
                : filter === "completed"
                ? "You haven't completed any tournament matches yet."
                : "You don't have any matches recorded in the system."}
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="mt-4 rounded-xl border border-[#4AEEFF]/40 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#4AEEFF] transition-all hover:bg-[#4AEEFF] hover:text-[#061D23]"
              >
                View All Matches
              </button>
            )}
          </section>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => {
              const isWon = isMatchWonByUser(match, user?.id);
              const isFinished = match.status === "COMPLETED";
              const isDoubles =
                (match.category.type || "").toUpperCase() === "DOUBLES" ||
                Boolean(match.team1 || match.team2);

              return (
                <section
                  key={match.id}
                  className="rounded-2xl border border-white/15 bg-[#061D23]/35 p-5 sm:p-6 shadow-[0_20px_50px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl transition-all hover:border-[#4AEEFF]/60 hover:bg-[#061D23]/50"
                >
                  <div className="flex flex-col gap-4">
                    {/* Top Meta Bar */}
                    <div className="flex items-center justify-between gap-3 flex-wrap border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusColor(
                            match.status,
                          )}`}
                        >
                          {getStatusText(match.status)}
                        </span>

                        {isFinished && (
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                              isWon
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            }`}
                          >
                            {isWon ? "🏆 Won" : "Lost"}
                          </span>
                        )}

                        <span className="text-xs uppercase tracking-wider text-white/60">
                          {match.category.name} • {match.round}
                        </span>

                        {isDoubles && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 font-bold uppercase">
                            <UserGroupIcon className="w-3 h-3" />
                            Doubles
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/app/tournaments/${match.tournament.id}`}
                        className="text-xs font-bold text-[#4AEEFF] hover:underline transition-colors truncate max-w-xs"
                      >
                        {match.tournament.name} →
                      </Link>
                    </div>

                    {/* Court Fixture Arena (Singles or Doubles with Partners) */}
                    <div className="py-2">
                      <div className="grid grid-cols-11 items-center gap-2">
                        {/* Side 1 (Player 1 or Team 1) */}
                        <div className="col-span-5 min-w-0">
                          {renderParticipant(match.team1, match.player1, "left")}
                        </div>

                        {/* VS / Score Divider */}
                        <div className="col-span-1 text-center flex flex-col items-center justify-center">
                          <span className="text-sm sm:text-base font-black text-[#4AEEFF]">
                            VS
                          </span>
                        </div>

                        {/* Side 2 (Player 2 or Team 2) */}
                        <div className="col-span-5 min-w-0">
                          {renderParticipant(match.team2, match.player2, "right")}
                        </div>
                      </div>

                      {/* Match Final Score */}
                      {match.score && (
                        <div className="mt-3 text-center">
                          <span className="inline-block px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-black font-mono text-[#4AEEFF]">
                            Score: {match.score}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Venue & Time Footer */}
                    <div className="flex items-center justify-center gap-4 text-xs font-mono text-white/50 border-t border-white/5 pt-3 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <MapPinIcon className="w-3.5 h-3.5 text-white/40" />
                        {match.tournament.venue}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5 text-white/40" />
                        {match.scheduledTime
                          ? new Date(match.scheduledTime).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Time TBD"}
                      </span>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyMatches;
