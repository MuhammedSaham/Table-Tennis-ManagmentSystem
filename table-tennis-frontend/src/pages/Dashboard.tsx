import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Link } from "react-router-dom";
import {
  TrophyIcon,
  CalendarIcon,
  ChartBarIcon,
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

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[linear-gradient(180deg,#061D23_0%,#123B4A_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col space-y-6">
        <div className="rounded-[24px] border border-[#12679E] bg-[linear-gradient(135deg,#123B4A_0%,#061D23_100%)] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
          <div className="mb-4 h-1 w-24 rounded-full bg-[#CFF9FF]" />
          <h1 className="mb-2 text-3xl font-black uppercase tracking-[0.2em] text-white">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-sm uppercase tracking-[0.25em] text-[#D8FBFF]">
            Your tournament hub
          </p>
        </div>

        {newTournaments.length > 0 && (
          <div className="rounded-[24px] border border-[#4AEEFF] bg-[linear-gradient(135deg,#12679E_0%,#123B4A_100%)] p-6 shadow-[0_14px_50px_rgba(0,0,0,0.2)]">
            <div className="mb-4 flex items-center gap-2">
              <TrophyIcon className="h-6 w-6 text-[#4AEEFF]" />
              <h2 className="text-lg font-semibold text-white">
                New Tournaments Available!
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {newTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  to={`/tournaments/${tournament.id}`}
                  className="rounded-[18px] border border-[#12679E] bg-[linear-gradient(145deg,#123B4A_0%,#061D23_100%)] p-4 transition hover:border-[#4AEEFF] hover:shadow-[0_10px_30px_rgba(74,238,255,0.12)]"
                >
                  <h3 className="font-semibold text-white">{tournament.name}</h3>
                  <p className="mt-2 text-sm text-[#D8FBFF]">📍 {tournament.venue}</p>
                  <p className="mt-2 text-xs text-[#D8FBFF]">
                    Register by: {new Date(tournament.registrationDeadline).toLocaleDateString()}
                  </p>
                  <span className="mt-3 inline-block rounded-full bg-[#FFFFFF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#061D23]">
                    Register Now →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-[24px] border border-[#12679E] bg-[linear-gradient(145deg,#123B4A_0%,#061D23_100%)] p-6 shadow-[0_14px_50px_rgba(0,0,0,0.2)]">
          <p className="text-[#D8FBFF]">
            You are logged in as <strong className="text-[#4AEEFF]">{user?.role}</strong>
          </p>
          <p className="mt-2 text-[#D8FBFF]">Email: {user?.email}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/tournaments"
            className="group rounded-[20px] border border-[#12679E] bg-[linear-gradient(160deg,#12679E_0%,#061D23_100%)] p-6 transition hover:border-[#4AEEFF] hover:shadow-[0_12px_35px_rgba(74,238,255,0.12)]"
          >
            <TrophyIcon className="mb-3 h-8 w-8 text-[#4AEEFF]" />
            <h3 className="mb-2 font-semibold text-white">Tournaments</h3>
            <p className="text-[#D8FBFF]">View and manage tournaments</p>
          </Link>

          {isPlayer && (
            <Link
              to="/app/my-matches"
              className="group rounded-[20px] border border-[#12679E] bg-[linear-gradient(160deg,#12679E_0%,#123B4A_100%)] p-6 transition hover:border-[#4AEEFF] hover:shadow-[0_12px_35px_rgba(74,238,255,0.12)]"
            >
              <CalendarIcon className="mb-3 h-8 w-8 text-[#4AEEFF]" />
              <h3 className="mb-2 font-semibold text-white">My Matches</h3>
              <p className="text-[#D8FBFF]">Check your upcoming matches</p>
            </Link>
          )}

          <Link
            to="/leaderboard"
            className="group rounded-[20px] border border-[#12679E] bg-[linear-gradient(160deg,#12679E_0%,#061D23_100%)] p-6 transition hover:border-[#4AEEFF] hover:shadow-[0_12px_35px_rgba(74,238,255,0.12)]"
          >
            <ChartBarIcon className="mb-3 h-8 w-8 text-[#4AEEFF]" />
            <h3 className="mb-2 font-semibold text-white">Leaderboard</h3>
            <p className="text-[#D8FBFF]">See tournament rankings</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
