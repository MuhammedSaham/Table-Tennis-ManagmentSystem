import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import BackButton from "../components/BackButton";
import { CalendarIcon, TrophyIcon } from "@heroicons/react/24/outline";

interface Match {
  id: string;
  round: string;
  matchNumber: number;
  scheduledTime: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  score: string | null;
  winnerId: string | null;
  player1: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  player2: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
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
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await api.get("/matches/my-matches");
      setMatches(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch matches");
    } finally {
      setLoading(false);
    }
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
      return match.status === "SCHEDULED";
    }
    if (filter === "completed") {
      return match.status === "COMPLETED";
    }
    return true;
  });

  // Calculate statistics
  const totalMatches = matches.length;
  const completedMatches = matches.filter(
    (m) => m.status === "COMPLETED",
  ).length;
  const wins = matches.filter(
    (m) =>
      (m.status === "COMPLETED" && m.winnerId === m.player1?.id) ||
      m.winnerId === m.player2?.id,
  ).length;
  const winRate =
    completedMatches > 0 ? ((wins / completedMatches) * 100).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/bg1.png')" }}
        />
        <div className="fixed inset-0 bg-[#061D23]/25" />
        <div className="relative z-10 flex min-h-screen items-center justify-center text-sm font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
          Loading your matches...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      <div className="fixed inset-0 bg-[#061D23]/25" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col space-y-6 px-4 sm:px-6 lg:px-10 xl:px-14 py-4 sm:py-6 lg:py-8">
        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-white/20 bg-[#061D23]/20 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:flex-row sm:items-center">
          <div>
            <BackButton to="/app/dashboard" label="Back to Dashboard" className="mb-3" />
            <h1 className="text-2xl font-black uppercase tracking-[0.15em] text-white sm:text-3xl lg:text-4xl">
              My Matches
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#4AEEFF]">
              Track your tournament fixtures and results
            </p>
          </div>
          <div className="flex gap-5 text-right">
            <div>
              <p className="text-2xl font-black text-[#4AEEFF]">{totalMatches}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Matches</p>
            </div>
            <div>
              <p className="text-2xl font-black text-[#4AEEFF]">{winRate}%</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Win Rate</p>
            </div>
          </div>
        </header>

        <section className="rounded-[16px] border border-white/20 bg-[#061D23]/10 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-[#4AEEFF]" />
            <h2 className="text-xs font-black uppercase tracking-widest text-[#4AEEFF]">Match Log</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Matches", count: matches.length },
              {
                key: "upcoming",
                label: "Upcoming",
                count: matches.filter((m) => m.status === "SCHEDULED").length,
              },
              { key: "completed", label: "Completed", count: completedMatches },
            ].map((tab) => {
              const isActive = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                      : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? "bg-[#4AEEFF]/25 text-[#4AEEFF]"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

      {filteredMatches.length === 0 ? (
        <section className="rounded-[16px] border border-white/20 bg-[#061D23]/10 p-12 text-center shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <TrophyIcon className="mx-auto mb-3 h-10 w-10 text-white/20" />
          <p className="text-sm font-semibold text-white/70">No matches found.</p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="mt-4 rounded-lg border border-[#4AEEFF]/40 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#4AEEFF] transition-all hover:bg-[#4AEEFF] hover:text-[#061D23]"
            >
              View All Matches
            </button>
          )}
        </section>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <section key={match.id} className="rounded-[16px] border border-white/20 bg-[#061D23]/10 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all hover:border-[#4AEEFF]/60">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusColor(match.status)}`}
                    >
                      {getStatusText(match.status)}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-white/50">
                      {match.category.name} • {match.round}
                    </span>
                  </div>

                  <Link to={`/app/tournaments/${match.tournament.id}`}>
                    <h3 className="text-lg font-black text-white transition-colors hover:text-[#4AEEFF]">
                      {match.tournament.name}
                    </h3>
                  </Link>

                  <div className="mt-4 text-center">
                    <div className="flex items-center justify-center gap-8">
                      <div className="text-right">
                        <p className="font-bold text-white">
                          {match.player1?.firstName} {match.player1?.lastName}
                        </p>
                      </div>
                      <div className="text-xl font-black text-[#4AEEFF]">VS</div>
                      <div className="text-left">
                        {match.player2 ? (
                          <p className="font-bold text-white">
                            {match.player2.firstName} {match.player2.lastName}
                          </p>
                        ) : (
                          <p className="text-sm font-semibold text-white/60">
                            Fixture not generated yet
                          </p>
                        )}
                      </div>
                    </div>

                    {match.score && (
                        <div className="mt-2 text-lg font-black text-[#4AEEFF]">
                        Score: {match.score}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs font-mono text-white/50">
                    📍 {match.tournament.venue} • 🕐{" "}
                    {new Date(match.scheduledTime).toLocaleString()}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
      </main>
    </div>
  );
};

export default MyMatches;
