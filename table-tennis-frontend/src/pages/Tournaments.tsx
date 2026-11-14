import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  TrophyIcon,
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  getEffectiveTournamentStatus,
  getTournamentStatusBadgeClass,
  type TournamentEffectiveStatus,
} from "../utils/tournamentStatus";

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
  const [pendingTournamentIds, setPendingTournamentIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchParams, setSearchParams] = useSearchParams();

  // Support ?status=UPCOMING, ?status=ONGOING, ?status=COMPLETED, ?view=upcoming3
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const s = searchParams.get("status") || searchParams.get("view");
    if (s) {
      const upper = s.toUpperCase();
      if (
        ["UPCOMING", "ONGOING", "COMPLETED"].includes(upper) ||
        upper === "UPCOMING3"
      ) {
        return "UPCOMING";
      }
    }
    return "ALL";
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { user, hasPermission } = useAuth();
  const canManageTournaments =
    user?.role === "SUPER_ADMIN" || hasPermission("MANAGE_TOURNAMENTS");
  const location = useLocation();
  const isAppScope = location.pathname.startsWith("/app") || !!user;

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await api.get("/tournaments");
        setTournaments(response.data.data || []);

        if (user?.role === "PLAYER") {
          try {
            const invitesRes = await api.get("/teams/invites/my-invites");
            const ids = new Set<string>(
              (invitesRes.data.data || [])
                .map((i: any) => i.tournamentId || i.tournament?.id)
                .filter(Boolean),
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

  const handleTabChange = (key: string) => {
    setStatusFilter(key);
    const updated = new URLSearchParams(searchParams);
    if (key === "ALL") {
      updated.delete("status");
      updated.delete("view");
    } else {
      updated.set("status", key);
      updated.delete("view");
    }
    setSearchParams(updated, { replace: true });
  };

  const formatTitle = (title: string) => {
    if (!title) return "";
    return title
      .split(" ")
      .map((w) => {
        if (/^u-\d+$/i.test(w)) return w.toUpperCase();
        if (w.length <= 2 && w === w.toUpperCase()) return w;
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(" ");
  };

  const formatDateRange = (startStr: string, endStr?: string) => {
    if (!startStr) return "";
    const start = new Date(startStr);
    if (isNaN(start.getTime())) return "";
    if (!endStr) {
      return start.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    const end = new Date(endStr);
    if (isNaN(end.getTime()) || start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.toLocaleDateString("en-GB", { month: "short" });
    const endMonth = end.toLocaleDateString("en-GB", { month: "short" });
    const year = start.getFullYear();

    if (startMonth === endMonth) {
      return `${startDay} – ${endDay} ${startMonth} ${year}`;
    }
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
  };

  // Compute dynamic date-aware effective status for each tournament
  const tournamentsWithEffectiveStatus = useMemo(() => {
    return tournaments.map((t) => ({
      ...t,
      effectiveStatus: getEffectiveTournamentStatus(t),
    }));
  }, [tournaments]);

  // Tab counts based on real-world effective status
  const upcomingCount = useMemo(
    () =>
      tournamentsWithEffectiveStatus.filter(
        (t) => t.effectiveStatus === "UPCOMING",
      ).length,
    [tournamentsWithEffectiveStatus],
  );

  const ongoingCount = useMemo(
    () =>
      tournamentsWithEffectiveStatus.filter(
        (t) => t.effectiveStatus === "ONGOING",
      ).length,
    [tournamentsWithEffectiveStatus],
  );

  const completedCount = useMemo(
    () =>
      tournamentsWithEffectiveStatus.filter(
        (t) => t.effectiveStatus === "COMPLETED",
      ).length,
    [tournamentsWithEffectiveStatus],
  );

  // Filter & sort tournaments
  const filteredTournaments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return tournamentsWithEffectiveStatus
      .filter((t) => {
        const matchesStatus =
          statusFilter === "ALL" || t.effectiveStatus === statusFilter;
        const matchesSearch =
          !q ||
          t.name.toLowerCase().includes(q) ||
          (t.venue && t.venue.toLowerCase().includes(q));
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (statusFilter === "UPCOMING" || statusFilter === "ONGOING") {
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        }
        if (statusFilter === "COMPLETED") {
          return (
            new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
          );
        }
        // ALL tab: prioritize ONGOING -> UPCOMING -> COMPLETED -> CANCELLED
        const priorityMap: Record<TournamentEffectiveStatus, number> = {
          ONGOING: 1,
          UPCOMING: 2,
          COMPLETED: 3,
          CANCELLED: 4,
        };
        const prioA = priorityMap[a.effectiveStatus] || 5;
        const prioB = priorityMap[b.effectiveStatus] || 5;
        if (prioA !== prioB) return prioA - prioB;

        if (a.effectiveStatus === "COMPLETED") {
          return (
            new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
          );
        }
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      });
  }, [tournamentsWithEffectiveStatus, statusFilter, searchQuery]);

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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-10 xl:px-14 py-6 sm:py-8">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return wrapInBaseLayout(
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-white/20 border-t-[#4AEEFF] rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-white/70">
          Loading tournaments...
        </p>
      </div>,
    );
  }

  return wrapInBaseLayout(
    <>
      {/* ─── COMPACT GLASS HEADER MODULE ─── */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-white/20 bg-[#061D23]/20 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
        {/* Left: Title + Status Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight leading-none">
              Tournaments
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white/80 border border-white/15">
              {statusFilter === "ALL"
                ? tournaments.length
                : filteredTournaments.length}
            </span>
          </div>

          {/* Status Filter Tabs (Segmented Capsule) */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md overflow-x-auto scrollbar-none">
            {[
              { key: "ALL", label: "All", count: tournaments.length },
              { key: "UPCOMING", label: "Upcoming", count: upcomingCount },
              { key: "ONGOING", label: "Ongoing", count: ongoingCount },
              { key: "COMPLETED", label: "Completed", count: completedCount },
            ].map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                      : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
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
        </div>

        {/* Right: Search Bar + Create Tournament Button */}
        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
          <div className="relative flex-1 lg:w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tournament by name..."
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#4AEEFF] focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1 rounded transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {canManageTournaments && (
            <Link
              to="/app/create-tournament"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#4AEEFF] hover:bg-white text-[#061D23] px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <PlusIcon className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Create Tournament</span>
              <span className="sm:hidden">New</span>
            </Link>
          )}
        </div>
      </header>

      {/* TOURNAMENTS GRID */}
      {filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTournaments.map((tournament) => (
            <div key={tournament.id} className="h-full">
              <Link
                to={
                  isAppScope
                    ? `/app/tournaments/${tournament.id}`
                    : `/tournaments/${tournament.id}`
                }
                className="group flex flex-col justify-between h-full rounded-2xl border border-white/20 bg-[#061D23]/20 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all duration-200 hover:border-[#4AEEFF]/60 hover:-translate-y-1"
              >
                <div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#4AEEFF] transition-colors line-clamp-2 leading-snug">
                      {formatTitle(tournament.name)}
                    </h3>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${getTournamentStatusBadgeClass(
                          tournament.effectiveStatus,
                        )}`}
                      >
                        {tournament.effectiveStatus}
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
                      {formatDateRange(
                        tournament.startDate,
                        tournament.endDate,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4 text-[#4AEEFF] shrink-0" />
                    <span className="text-[#4AEEFF] font-bold">
                      {tournament._count?.registrations ?? 0} participants
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-end text-xs font-black uppercase tracking-wider text-[#4AEEFF] group-hover:translate-x-1 transition-transform">
                    View Tournament →
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl border border-dashed border-white/15 bg-white/5 p-8">
          <TrophyIcon className="mx-auto mb-3 h-10 w-10 text-white/30" />
          <h3 className="text-lg font-semibold text-white">
            {searchQuery
              ? `No tournaments matching "${searchQuery}"`
              : statusFilter === "ALL"
                ? "No Tournaments Found"
                : `No ${statusFilter.toLowerCase()} tournaments`}
          </h3>
          <p className="mt-1 text-xs text-white/60">
            {searchQuery
              ? "Try checking for spelling errors or clearing your search filter."
              : statusFilter === "ALL"
                ? "There are currently no tournaments available."
                : `There are currently no tournaments in ${statusFilter.toLowerCase()} status.`}
          </p>
          {(searchQuery || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                handleTabChange("ALL");
              }}
              className="mt-4 px-4 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Reset filters & search
            </button>
          )}
          {canManageTournaments && !searchQuery && statusFilter === "ALL" && (
            <Link
              to="/app/create-tournament"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#4AEEFF] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#061D23] hover:bg-white transition-all shadow-sm"
            >
              <PlusIcon className="w-4 h-4 stroke-[3]" />
              Create your first tournament
            </Link>
          )}
        </div>
      )}
    </>,
  );
};

export default Tournaments;
