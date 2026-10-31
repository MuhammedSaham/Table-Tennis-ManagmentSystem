import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { TrophyIcon, CalendarIcon, MapPinIcon, UserGroupIcon, PlusIcon } from "@heroicons/react/24/outline";
import ScrollReveal from "../components/ScrollReveal";

interface Tournament {
  id: string;
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: string;
  _count: {
    registrations: number;
  };
}

const Tournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [pendingTournamentIds, setPendingTournamentIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user, hasPermission } = useAuth();
  const canManageTournaments = user?.role === "SUPER_ADMIN" || hasPermission("MANAGE_TOURNAMENTS");
  const location = useLocation();
  const isAppScope = location.pathname.startsWith("/app") || !!user;

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await api.get("/tournaments");
        setTournaments(response.data.data);

        if (user?.role === "PLAYER") {
          try {
            const invitesRes = await api.get("/teams/invites/my-invites");
            const ids = new Set<string>(
              (invitesRes.data.data || [])
                .map((i: any) => i.tournamentId || i.tournament?.id)
                .filter(Boolean)
            );
            setPendingTournamentIds(ids);
          } catch {
            // Ignored
          }
        }
      } catch {
        toast.error("Failed to fetch tournaments");
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-sky-500/20 text-sky-300 border border-sky-400/30";
      case "ONGOING":
        return "bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-pulse";
      case "COMPLETED":
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
      case "CANCELLED":
        return "bg-rose-500/20 text-rose-300 border border-rose-400/30";
      default:
        return "bg-white/10 text-white/80 border border-white/20";
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-5 sm:space-y-6 p-3.5 sm:p-6 lg:p-8">
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

  return wrapInBaseLayout(
    <>
      {/* HEADER MODULE */}
      <header className="animate-fade-up-1 flex flex-col justify-between gap-4 rounded-2xl border border-white/20 bg-[#061D23]/15 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:flex-row sm:items-center">
        <div>
          <div className="mb-2.5 h-[3px] w-12 sm:w-16 bg-[#4AEEFF] animate-laser-flow" />
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 align-middle mb-2">
            Competition Portal
          </span>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] text-white">
            Tournaments
          </h1>
          <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#4AEEFF]/90">
            Browse upcoming, active, and completed tournaments
          </p>
        </div>

        {canManageTournaments && (
          <Link
            to="/app/create-tournament"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#4AEEFF] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#061D23] shadow-md shadow-[#4AEEFF]/20 transition-all hover:bg-white hover:shadow-white/20 active:scale-95 w-full sm:w-auto"
          >
            <PlusIcon className="w-4 h-4 stroke-[3]" />
            Create Tournament
          </Link>
        )}
      </header>

      {/* TOURNAMENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {tournaments.map((tournament, idx) => (
          <ScrollReveal key={tournament.id} delay={Math.min(idx * 75, 450)} className="h-full">
            <Link
              to={isAppScope ? `/app/tournaments/${tournament.id}` : `/tournaments/${tournament.id}`}
              className="group flex flex-col justify-between h-full rounded-2xl border border-white/20 bg-[#061D23]/20 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all duration-200 hover:border-[#4AEEFF]/60 hover:-translate-y-1"
            >
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#4AEEFF] transition-colors line-clamp-2 leading-snug">
                    {tournament.name}
                  </h3>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${getStatusBadge(
                        tournament.status
                      )}`}
                    >
                      {tournament.status}
                    </span>
                    {pendingTournamentIds.has(tournament.id) && (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-cyan-400/20 text-[#4AEEFF] border border-cyan-400/40 shadow-[0_0_10px_rgba(74,238,255,0.3)] animate-pulse flex items-center gap-1">
                        <span>⚡</span> Partner Request
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-white/70 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed">
                  {tournament.description || "No description provided"}
                </p>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4 text-xs font-mono text-white/60">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-[#4AEEFF] shrink-0" />
                  <span className="truncate">{tournament.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#4AEEFF] shrink-0" />
                  <span>
                    {new Date(tournament.startDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-[#4AEEFF] shrink-0" />
                  <span className="text-[#4AEEFF] font-bold">
                    {tournament._count.registrations} participants
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end text-xs font-black uppercase tracking-wider text-[#4AEEFF] group-hover:translate-x-1 transition-transform">
                  View Tournament →
                </div>
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>

      {tournaments.length === 0 && (
        <section className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-12 text-center shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <TrophyIcon className="mx-auto mb-3 h-10 w-10 text-white/20" />
          <h3 className="text-lg font-black uppercase tracking-wider text-white">
            No Tournaments Found
          </h3>
          <p className="mt-1 text-xs text-white/60">
            There are currently no tournaments available.
          </p>
          {canManageTournaments && (
            <Link
              to="/app/create-tournament"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#4AEEFF] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#061D23] shadow-md shadow-[#4AEEFF]/20 hover:bg-white transition-all"
            >
              <PlusIcon className="w-4 h-4 stroke-[3]" />
              Create your first tournament
            </Link>
          )}
        </section>
      )}
    </>
  );
};

export default Tournaments;