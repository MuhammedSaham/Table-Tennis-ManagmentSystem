import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  TrophyIcon,
  CalendarIcon,
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
  const { user } = useAuth();
  const [newTournaments, setNewTournaments] = useState<Tournament[]>([]);
  const [doublesInvites, setDoublesInvites] = useState<DoublesInvite[]>([]);
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null);
  const isPlayer = user?.role === "PLAYER";

  useEffect(() => {
    fetchNewTournaments();
    if (isPlayer) {
      fetchDoublesInvites();
    }
  }, [user]);

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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-6 p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );

  return wrapInBaseLayout(
    <>
      {/* PREMIUM HEADER CONTROLS MODULE */}
      <header className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
        <div className="mb-3 h-[3px] w-16 bg-[#4AEEFF]" />
        <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white sm:text-4xl">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-xs uppercase tracking-[0.3em] text-[#4AEEFF]/90 mt-1">
          Your tournament hub
        </p>
      </header>

      {/* PENDING DOUBLES INVITATIONS ACTION BANNER */}
      {doublesInvites.length > 0 && (
        <section className="rounded-[18px] border border-cyan-400/40 bg-gradient-to-r from-[#072d36]/90 via-[#062027]/95 to-[#04151a] p-6 shadow-[0_20px_50px_-10px_rgba(74,238,255,0.25)] backdrop-blur-xl animate-in fade-in">
          <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-cyan-500/20 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4AEEFF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4AEEFF]"></span>
              </span>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
                Action Required • Doubles Partner Invitations ({doublesInvites.length})
              </h2>
            </div>
            <span className="text-[11px] font-mono text-cyan-200/70">
              ⚡ International Partnership Request
            </span>
          </div>

          <div className="space-y-3">
            {doublesInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-cyan-500/25 transition-all hover:border-cyan-400/50"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-cyan-500/20 flex-shrink-0">
                    {inv.inviter?.firstName?.[0]?.toUpperCase() || "P"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                      <span className="text-[#4AEEFF] font-black text-base">
                        {inv.inviter?.firstName} {inv.inviter?.lastName}
                      </span>
                      <span className="text-white/80 text-xs">
                        invited you to partner with them for this tournament!
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-white/60 flex-wrap">
                      <span>Event: <strong className="text-white">{inv.tournament?.name}</strong></span>
                      <span>•</span>
                      <span>Division: <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase">{inv.category?.name}</span></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-auto flex-shrink-0">
                  <Link
                    to={`/app/tournaments/${inv.tournament?.id || inv.tournamentId}`}
                    className="px-3 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
                  >
                    View Event
                  </Link>
                  <button
                    onClick={() => handleAcceptInvite(inv.id)}
                    disabled={respondingInviteId === inv.id}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_4px_14px_rgba(74,238,255,0.3)] hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {respondingInviteId === inv.id ? "Confirming..." : "✓ Accept & Confirm Team"}
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(inv.id)}
                    disabled={respondingInviteId === inv.id}
                    className="px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    ✕ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* NEW TOURNAMENTS MODULE */}
      {newTournaments.length > 0 && (
        <section className="rounded-[16px] border border-white/20 bg-[#061D23]/10 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-[#4AEEFF]" />
            <h2 className="text-xs font-black uppercase tracking-widest text-[#4AEEFF]">
              New Tournaments Available!
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {newTournaments.map((tournament) => (
              <Link
                key={tournament.id}
                to={`/app/tournaments/${tournament.id}`}
                className="group rounded-lg border border-white/10 bg-[#061D23]/40 p-4 transition-all hover:border-[#4AEEFF] hover:text-[#4AEEFF]"
              >
                <h3 className="font-bold text-white group-hover:text-[#4AEEFF] transition-colors">
                  {tournament.name}
                </h3>
                <p className="mt-2 text-xs text-white/70 font-mono">
                  📍 {tournament.venue}
                </p>
                <p className="mt-2 text-xs text-white/50 font-mono">
                  Register by:{" "}
                  {new Date(tournament.registrationDeadline).toLocaleDateString(
                    undefined,
                    { year: "numeric", month: "short", day: "numeric" },
                  )}
                </p>
                <span className="mt-3 inline-block rounded-lg bg-[#4AEEFF] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#061D23] transition-all group-hover:bg-white">
                  {user?.role === "ADMIN" ? "Manage Tournament →" : user?.role === "REFEREE" ? "View Tournament →" : "Register Now →"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ACCOUNT STATUS MODULE */}
      <section className="rounded-[16px] border border-white/20 bg-[#061D23]/10 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
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
    </>
  );
};

export default Dashboard;