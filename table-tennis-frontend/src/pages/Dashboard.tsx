import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  TrophyIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  InboxStackIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface Tournament {
  id: string;
  name: string;
  venue: string;
  startDate: string;
  registrationDeadline: string;
  status: string;
}

interface DoublesInvite {
  id: string;
  tournamentId: string;
  categoryId: string;
  inviter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tournament: {
    id: string;
    name: string;
    venue?: string;
    startDate?: string;
    registrationDeadline?: string;
  };
  category: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [newTournaments, setNewTournaments] = useState<Tournament[]>([]);
  const [doublesInvites, setDoublesInvites] = useState<DoublesInvite[]>([]);
  const [pendingMembershipCount, setPendingMembershipCount] =
    useState<number>(0);
  const [pendingPaymentCount, setPendingPaymentCount] = useState<number>(0);
  const [pendingAdminCount, setPendingAdminCount] = useState<number>(0);

  const isPlayer = user?.role === "PLAYER";
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.isSuperAdmin;
  const isAdmin = isSuperAdmin || user?.role === "ADMIN";

  const totalPendingRequests =
    pendingMembershipCount +
    pendingPaymentCount +
    (isSuperAdmin ? pendingAdminCount : 0);

  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    fetchNewTournaments();
    if (isPlayer) {
      fetchDoublesInvites();
    }
    if (
      isSuperAdmin ||
      (isAdmin &&
        (hasPermission("MANAGE_CLUB_MEMBERSHIPS") ||
          hasPermission("MANAGE_REGISTRATIONS")))
    ) {
      fetchPendingRequestsCount();
    }
  }, [user]);

  const fetchPendingRequestsCount = async () => {
    try {
      const canManageMemberships =
        isSuperAdmin ||
        hasPermission("MANAGE_CLUB_MEMBERSHIPS") ||
        hasPermission("MANAGE_PLAYERS");

      const canManagePayments =
        isSuperAdmin || hasPermission("MANAGE_REGISTRATIONS");

      const promises: Promise<any>[] = [];

      if (canManageMemberships) {
        promises.push(
          api
            .get("/club-membership/requests")
            .then((res) => {
              const pendingMembership =
                res.data?.data?.filter(
                  (req: any) => req.status === "PENDING",
                ) || [];
              setPendingMembershipCount(pendingMembership.length);
            })
            .catch((err) => {
              console.error("Failed to fetch membership requests count", err);
              setPendingMembershipCount(0);
            }),
        );
      } else {
        setPendingMembershipCount(0);
      }

      if (canManagePayments) {
        promises.push(
          api
            .get("/payment-proofs/pending")
            .then((res) => {
              const pendingPayments = res.data?.data || [];
              setPendingPaymentCount(pendingPayments.length);
            })
            .catch((err) => {
              console.error("Failed to fetch payment requests count", err);
              setPendingPaymentCount(0);
            }),
        );
      } else {
        setPendingPaymentCount(0);
      }

      if (isSuperAdmin) {
        promises.push(
          api
            .get("/admin-requests/pending")
            .then((res) => {
              const pendingAdmins = res.data?.data || [];
              setPendingAdminCount(pendingAdmins.length);
            })
            .catch((err) => {
              console.error("Failed to fetch admin requests count", err);
              setPendingAdminCount(0);
            }),
        );
      } else {
        setPendingAdminCount(0);
      }

      await Promise.all(promises);
    } catch (err) {
      console.error("Failed to fetch pending requests count", err);
    }
  };

  const fetchDoublesInvites = async () => {
    if (!isPlayer) return;
    try {
      const res = await api.get("/teams/invites/my-invites");
      setDoublesInvites(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch doubles invites", err);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    setRespondingInviteId(inviteId);
    try {
      await api.post(`/teams/invites/${inviteId}/accept`);
      toast.success("Doubles partner invite accepted! Team confirmed 🎉");
      setDoublesInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to accept invite");
    } finally {
      setRespondingInviteId(null);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    setRespondingInviteId(inviteId);
    try {
      await api.post(`/teams/invites/${inviteId}/decline`);
      toast.success("Invite declined");
      setDoublesInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to decline invite");
    } finally {
      setRespondingInviteId(null);
    }
  };

  const fetchNewTournaments = async () => {
    try {
      const response = await api.get("/tournaments");
      // Get upcoming tournaments
      const upcoming = response.data.data.filter(
        (t: Tournament) => t.status === "UPCOMING",
      );
      // Show only first 3
      setNewTournaments(upcoming.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch tournaments");
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-5 p-3.5 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );

  return wrapInBaseLayout(
    <>
      {/* PREMIUM HEADER CONTROLS MODULE */}
      <header className="rounded-2xl border border-white/20 bg-[#061D23]/15 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
        <div className="mb-2.5 h-[3px] w-12 sm:w-16 bg-[#4AEEFF]" />
        <h1 className="text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] text-white leading-tight">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#4AEEFF]/90 mt-1">
          Your tournament hub
        </p>
      </header>

      {/* ADMIN CONTROL HUB & BUTTONS (PROMINENT TOP POSITION FOR ADMIN) */}
      {isAdmin && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-[#4AEEFF] shrink-0" />
            <h2 className="text-xs font-black uppercase tracking-widest text-[#4AEEFF]">
              Admin Control Hub
            </h2>
          </div>

          <main className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Requests Button */}
            {(isSuperAdmin || hasPermission("MANAGE_CLUB_MEMBERSHIPS") || hasPermission("MANAGE_REGISTRATIONS")) && (
              <Link
                to="/app/admin-requests"
                className="group relative flex flex-col justify-between rounded-[16px] border border-white/20 bg-[#061D23]/10 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-[#4AEEFF] hover:bg-[#061D23]/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 text-[#4AEEFF] group-hover:scale-105 transition-transform duration-200">
                      <InboxStackIcon className="h-6 w-6" />
                    </div>
                    {totalPendingRequests > 0 ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4AEEFF] text-[#061D23] text-[10px] font-black uppercase tracking-wider shadow-md shadow-[#4AEEFF]/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#061D23] animate-ping"></span>
                        {totalPendingRequests} Pending
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/60 border border-white/10 text-[10px] font-mono">
                        0 Pending
                      </span>
                    )}
                  </div>

                  <h3 className="mb-2 font-black uppercase tracking-wider text-white transition-colors group-hover:text-[#4AEEFF] flex items-center justify-between">
                    <span>Pending Requests</span>
                    <span className="text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#4AEEFF]">
                      →
                    </span>
                  </h3>

                  <p className="text-xs text-white/70 leading-relaxed">
                    {isSuperAdmin
                      ? "Review membership requests, tournament payments, and admin access requests"
                      : "Review membership requests and tournament payment verifications"}
                  </p>
                  <div
                    className={`mt-4 grid gap-3 ${
                      isSuperAdmin ? "grid-cols-3" : "grid-cols-2"
                    }`}
                  >
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-white/50 truncate">
                        Membership
                      </p>
                      <p className="mt-1 text-lg font-black text-[#4AEEFF]">
                        {pendingMembershipCount}
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-white/50 truncate">
                        Payment
                      </p>
                      <p className="mt-1 text-lg font-black text-[#4AEEFF]">
                        {pendingPaymentCount}
                      </p>
                    </div>

                    {isSuperAdmin && (
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-white/50 truncate">
                          Admin
                        </p>
                        <p className="mt-1 text-lg font-black text-[#4AEEFF]">
                          {pendingAdminCount}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-[#4AEEFF]">
                  <span>Review Requests</span>
                  <ChevronRightIcon className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )}

            {/* Player Rankings Button */}
            {(isSuperAdmin || hasPermission("MANAGE_RANKINGS")) && (
              <Link
                to="/app/global-leaderboard"
                className="group relative flex flex-col justify-between rounded-[16px] border border-white/20 bg-[#061D23]/10 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-[#4AEEFF] hover:bg-[#061D23]/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 text-[#4AEEFF] group-hover:scale-105 transition-transform duration-200">
                      <ChartBarIcon className="h-6 w-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/30 text-[10px] font-mono">
                      Global Standings
                    </span>
                  </div>

                  <h3 className="mb-2 font-black uppercase tracking-wider text-white transition-colors group-hover:text-[#4AEEFF] flex items-center justify-between">
                    <span>Player Rankings</span>
                    <span className="text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#4AEEFF]">
                      →
                    </span>
                  </h3>

                  <p className="text-xs text-white/70 leading-relaxed">
                    Direct view of global player rankings, match stats, and
                    leaderboards
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-[#4AEEFF]">
                  <span>View Rankings</span>
                  <ChevronRightIcon className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )}

            {/* User Management Button */}
            {(isSuperAdmin || hasPermission("MANAGE_USERS")) && (
              <Link
                to="/app/users"
                className="group relative flex flex-col justify-between rounded-[16px] border border-white/20 bg-[#061D23]/10 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-[#4AEEFF] hover:bg-[#061D23]/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 text-[#4AEEFF] group-hover:scale-105 transition-transform duration-200">
                      <UserGroupIcon className="h-6 w-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/30 text-[10px] font-mono">
                      User Accounts
                    </span>
                  </div>

                  <h3 className="mb-2 font-black uppercase tracking-wider text-white transition-colors group-hover:text-[#4AEEFF] flex items-center justify-between">
                    <span>User Management</span>
                    <span className="text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#4AEEFF]">
                      →
                    </span>
                  </h3>

                  <p className="text-xs text-white/70 leading-relaxed">
                    Manage registered users, roles, player profiles, and assign
                    rankings
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-[#4AEEFF]">
                  <span>Manage Users & Ranks</span>
                  <ChevronRightIcon className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )}
          </main>
        </section>
      )}

      {/* PENDING DOUBLES INVITATIONS ACTION BANNER */}
      {doublesInvites.length > 0 && (
        <section className="rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-[#072d36]/90 via-[#062027]/95 to-[#04151a] p-4 sm:p-6 shadow-[0_20px_50px_-10px_rgba(74,238,255,0.25)] backdrop-blur-xl animate-in fade-in">
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-cyan-500/20 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4AEEFF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4AEEFF]"></span>
              </span>
              <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#4AEEFF]">
                Action Required • Doubles Partner Invitations (
                {doublesInvites.length})
              </h2>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-cyan-200/70">
              ⚡ Partnership Request
            </span>
          </div>

          <div className="space-y-3">
            {doublesInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-cyan-500/25 transition-all hover:border-cyan-400/50"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
                    {inv.inviter?.firstName?.[0]?.toUpperCase() || "P"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span className="text-[#4AEEFF] font-black">
                        {inv.inviter?.firstName} {inv.inviter?.lastName}
                      </span>
                      <span className="text-white/80 text-xs">
                        invited you to partner with them!
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-white/60 flex-wrap">
                      <span className="truncate">
                        Event:{" "}
                        <strong className="text-white">
                          {inv.tournament?.name}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Division:{" "}
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase">
                          {inv.category?.name}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t border-white/5 lg:border-t-0">
                  <Link
                    to={`/app/tournaments/${inv.tournament?.id || inv.tournamentId}`}
                    className="px-3 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-bold text-center transition-all"
                  >
                    View Event
                  </Link>
                  <button
                    onClick={() => handleAcceptInvite(inv.id)}
                    disabled={respondingInviteId === inv.id}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_4px_14px_rgba(74,238,255,0.3)] hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    {respondingInviteId === inv.id
                      ? "Confirming..."
                      : "✓ Accept & Confirm Team"}
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(inv.id)}
                    disabled={respondingInviteId === inv.id}
                    className="px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold text-center transition-all disabled:opacity-50"
                  >
                    ✕ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* NEW TOURNAMENTS MODULE (ONLY FOR PLAYERS / REFEREES) */}
      {!isAdmin && newTournaments.length > 0 && (
        <section className="rounded-2xl border border-white/20 bg-[#061D23]/10 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-[#4AEEFF] shrink-0" />
            <h2 className="text-xs font-black uppercase tracking-widest text-[#4AEEFF]">
              New Tournaments Available!
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {newTournaments.map((tournament) => (
              <Link
                key={tournament.id}
                to={`/app/tournaments/${tournament.id}`}
                className="group flex flex-col justify-between rounded-xl border border-white/10 bg-[#061D23]/40 p-4 sm:p-5 transition-all hover:border-[#4AEEFF]/60 hover:bg-[#061D23]/70 shadow-lg"
              >
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-[#4AEEFF] transition-colors line-clamp-2 leading-snug">
                    {tournament.name}
                  </h3>
                  <p className="mt-2 text-xs text-white/70 font-mono flex items-center gap-1.5 truncate">
                    <span>📍</span>{" "}
                    <span className="truncate">{tournament.venue}</span>
                  </p>
                  <p className="mt-1.5 text-xs text-white/50 font-mono">
                    Register by:{" "}
                    {new Date(
                      tournament.registrationDeadline,
                    ).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="w-full sm:w-auto text-center rounded-xl bg-[#4AEEFF] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#061D23] transition-all group-hover:bg-white shadow-md shadow-[#4AEEFF]/20">
                    {user?.role === "REFEREE"
                      ? "View Tournament →"
                      : "Register Now →"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ACCOUNT STATUS MODULE */}
      <section className="rounded-2xl border border-white/20 bg-[#061D23]/10 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
        <p className="text-sm text-white/80">
          You are logged in as{" "}
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 align-middle">
            {user?.role}
          </span>
        </p>
        <p className="mt-2 text-xs text-white/70 font-mono break-all">
          Email: {user?.email}
        </p>
      </section>

      {/* QUICK LINKS GRID */}
      {isPlayer && (
        <main className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/app/my-matches"
            className="group rounded-[16px] border border-white/20 bg-[#061D23]/10 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all hover:border-[#4AEEFF]"
          >
            <CalendarIcon className="mb-3 h-8 w-8 text-[#4AEEFF]" />
            <h3 className="mb-2 font-black uppercase tracking-wider text-white group-hover:text-[#4AEEFF] transition-colors">
              My Matches
            </h3>
            <p className="text-xs text-white/70">Check your upcoming matches</p>
          </Link>
        </main>
      )}
    </>,
  );
};

export default Dashboard;
