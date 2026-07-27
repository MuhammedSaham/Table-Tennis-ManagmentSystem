import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, CalendarDaysIcon, MapPinIcon, UserGroupIcon, FlagIcon, ClockIcon, PlusIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

interface Tournament {
  id: string;
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  tournamentType?: string;
  status: string;
  _count: {
    registrations: number;
  };
}

const Tournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await api.get("/tournaments");
        setTournaments(response.data.data);
      } catch {
        toast.error("Failed to fetch tournaments");
      } finally {
        // Fixed the typo here: changed from loading.setLoading(false) to setLoading(false)
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const getCardBorder = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "border-cyan-500/40 hover:border-cyan-400/70";
      case "ONGOING":
        return "border-emerald-500/40 hover:border-emerald-400/70";
      case "COMPLETED":
        return "border-slate-500/40 hover:border-slate-400/70";
      case "CANCELLED":
        return "border-rose-500/40 hover:border-rose-400/70";
      default:
        return "border-slate-500/40 hover:border-slate-400/70";
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/20";
      case "ONGOING":
        return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/20";
      case "COMPLETED":
        return "bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/20";
      case "CANCELLED":
        return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/20";
      default:
        return "bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/20";
    }
  };

  const statusOptions = ["ALL", "UPCOMING", "ONGOING", "COMPLETED"];

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");

  const tournamentTypes = useMemo(
    () =>
      Array.from(new Set(tournaments.map((t) => t.tournamentType).filter(Boolean))) as string[],
    [tournaments],
  );

  const tournamentYears = useMemo(
    () =>
      Array.from(
        new Set(
          tournaments
            .map((t) => new Date(t.startDate).getFullYear().toString())
            .filter(Boolean),
        ),
      ).sort((a, b) => Number(b) - Number(a)),
    [tournaments],
  );

  const summaryStats = useMemo(() => {
    const upcoming = tournaments.filter((t) => t.status === "UPCOMING").length;
    const ongoing = tournaments.filter((t) => t.status === "ONGOING").length;
    const completed = tournaments.filter((t) => t.status === "COMPLETED").length;
    const registeredPlayers = tournaments.reduce(
      (sum, tournament) => sum + tournament._count.registrations,
      0,
    );

    return {
      total: tournaments.length,
      upcoming,
      ongoing,
      completed,
      registeredPlayers,
    };
  }, [tournaments]);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((tournament) => {
      if (statusFilter !== "ALL" && tournament.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== "ALL" && tournament.tournamentType !== typeFilter) {
        return false;
      }

      if (
        yearFilter !== "ALL" &&
        new Date(tournament.startDate).getFullYear().toString() !== yearFilter
      ) {
        return false;
      }

      return true;
    });
  }, [tournaments, statusFilter, typeFilter, yearFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-cyan-400 font-medium">
        Loading tournaments...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(7,19,31,0.85) 0%, rgba(11,61,89,0.75) 40%, rgba(13,94,130,0.7) 100%), url('/bg1.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-white">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20 mb-8 relative">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_20%)]" />
          <div className="absolute left-0 top-0 h-2 w-28 rounded-br-3xl bg-cyan-400/60 blur-xl" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] items-center">
            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center gap-3 rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-sm shadow-cyan-500/10">
                <SparklesIcon className="h-5 w-5 text-cyan-300" />
                Dashboard overview
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                Tournaments
              </h1>
              <p className="max-w-2xl mt-3 text-base leading-7 text-slate-300">
                Create, manage and monitor university table tennis tournaments with a modern sports dashboard experience.
              </p>
            </div>

            {user?.role === "ADMIN" && (
              <Link
                to="/app/create-tournament"
                className="relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-cyan-400/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              >
                <PlusIcon className="h-5 w-5 animate-pulse" />
                Create Tournament
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/85 p-6 shadow-xl shadow-black/15 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/15">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total tournaments</p>
                <p className="mt-4 text-4xl font-extrabold text-white">{summaryStats.total}</p>
              </div>
              <FlagIcon className="h-9 w-9 rounded-2xl bg-cyan-500/15 p-2 text-cyan-300" />
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-slate-950/85 p-6 shadow-xl shadow-black/15 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/15">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Upcoming</p>
                <p className="mt-4 text-4xl font-extrabold text-white">{summaryStats.upcoming}</p>
              </div>
              <CalendarDaysIcon className="h-9 w-9 rounded-2xl bg-cyan-500/15 p-2 text-cyan-300" />
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-slate-950/85 p-6 shadow-xl shadow-black/15 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/15">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Ongoing</p>
                <p className="mt-4 text-4xl font-extrabold text-white">{summaryStats.ongoing}</p>
              </div>
              <SparklesIcon className="h-9 w-9 rounded-2xl bg-emerald-500/15 p-2 text-emerald-300" />
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-slate-950/85 p-6 shadow-xl shadow-black/15 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/15">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Completed</p>
                <p className="mt-4 text-4xl font-extrabold text-white">{summaryStats.completed}</p>
              </div>
              <UserGroupIcon className="h-9 w-9 rounded-2xl bg-slate-500/15 p-2 text-slate-200" />
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-slate-950/85 p-6 shadow-xl shadow-black/15 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/15">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Registered players</p>
                <p className="mt-4 text-4xl font-extrabold text-white">{summaryStats.registeredPlayers}</p>
              </div>
              <UserGroupIcon className="h-9 w-9 rounded-2xl bg-cyan-500/15 p-2 text-cyan-300" />
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 mb-8 shadow-2xl shadow-black/20">
          <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr] items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Filter tournaments</p>
              <p className="mt-2 text-lg font-semibold text-white">Refine the tournament list by status, type, or year.</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-start xl:justify-end">
              {statusOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatusFilter(option)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    statusFilter === option
                      ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                      : "bg-slate-900/80 text-slate-200 border border-white/10 hover:bg-slate-900/95"
                  }`}
                >
                  {option === "ALL" ? "All" : option.charAt(0) + option.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition"
            >
              <option value="ALL">All tournament types</option>
              {tournamentTypes.map((type) => (
                <option key={type} value={type} className="bg-slate-950 text-white">
                  {type}
                </option>
              ))}
            </select>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition"
            >
              <option value="ALL">All years</option>
              {tournamentYears.map((year) => (
                <option key={year} value={year} className="bg-slate-950 text-white">
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredTournaments.map((tournament) => (
            <Link key={tournament.id} to={`/tournaments/${tournament.id}`}>
              <div
                className={`relative overflow-hidden rounded-[32px] border bg-white/5 p-6 shadow-2xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/10 hover:shadow-cyan-500/20 ${getCardBorder(
                  tournament.status,
                )}`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(74,222,255,0.14),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.05),_transparent_20%)] opacity-90" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                        <FlagIcon className="h-4 w-4 text-cyan-300" /> Tournament
                      </p>
                      <h3 className="mt-3 text-2xl font-bold text-white tracking-tight">
                        {tournament.name}
                      </h3>
                    </div>
                    <span className={`mt-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${getStatusBadge(
                      tournament.status,
                    )}`}>
                      {tournament.status}
                    </span>
                  </div>

                  <p className="text-slate-300 mb-5 text-sm leading-6 line-clamp-3">
                    {tournament.description || "No description provided."}
                  </p>

                  <div className="grid gap-3 pb-5 border-b border-white/10 text-sm text-slate-300">
                    <div className="flex items-center gap-3">
                      <MapPinIcon className="h-5 w-5 text-cyan-300" />
                      <span>{tournament.venue}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CalendarDaysIcon className="h-5 w-5 text-cyan-300" />
                      <span>{formatDate(tournament.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <UserGroupIcon className="h-5 w-5 text-cyan-300" />
                      <span>{tournament._count.registrations} participants</span>
                    </div>
                    {tournament.tournamentType && (
                      <div className="flex items-center gap-3">
                        <ClockIcon className="h-5 w-5 text-cyan-300" />
                        <span>{tournament.tournamentType}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
                      <SparklesIcon className="h-4 w-4 text-cyan-300" /> More details
                    </span>

                    <div className="ml-auto flex gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/10 hover:text-white">
                        View Details
                        <ArrowRightIcon className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-20 rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl mt-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-200 shadow-lg shadow-cyan-500/10">
              <span className="text-4xl">🏓</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No tournaments available.</h2>
            <p className="max-w-xl mx-auto text-slate-400 mb-6">
              Create your first tournament to get started and build your next university table tennis event.
            </p>
            {user?.role === "ADMIN" && (
              <Link
                to="/app/create-tournament"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:shadow-2xl"
              >
                <PlusIcon className="h-5 w-5" /> Create Tournament
              </Link>
            )}
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-20 rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl mt-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-200 shadow-lg shadow-cyan-500/10">
              <span className="text-4xl">🔍</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No tournaments match your filters.</h2>
            <p className="max-w-xl mx-auto text-slate-400">
              Try adjusting the search, status, type, or year filters to find the right tournament.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Tournaments;