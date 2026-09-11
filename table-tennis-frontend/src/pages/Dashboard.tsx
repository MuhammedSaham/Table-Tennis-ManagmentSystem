import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
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

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [newTournaments, setNewTournaments] = useState<Tournament[]>([]);
  const isPlayer = user?.role === "PLAYER";

  useEffect(() => {
    fetchNewTournaments();
  }, []);

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
                  Register Now →
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