import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { TrophyIcon, MapPinIcon, CalendarIcon, UserGroupIcon } from "@heroicons/react/24/outline";

interface Tournament {
  id: string;
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: string;
  _count: { registrations: number };
}

const statusStyles: Record<string, string> = {
  UPCOMING:  "bg-[#4AEEFF]/10 text-[#4AEEFF] border border-[#4AEEFF]/30",
  ONGOING:   "bg-green-500/20 text-green-400 border border-green-500/40",
  COMPLETED: "bg-white/10 text-[#D8FBFF] border border-white/20",
  CANCELLED: "bg-red-500/20 text-red-400 border border-red-500/40",
};

const Tournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { fetchTournaments(); }, []);

  const fetchTournaments = async () => {
    try {
      const response = await api.get("/tournaments");
      setTournaments(response.data.data);
    } catch { toast.error("Failed to fetch tournaments"); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#061D23_0%,#123B4A_100%)]">
      <p className="text-[#4AEEFF] text-lg uppercase tracking-[0.2em]">Loading tournaments...</p>
    </div>
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[linear-gradient(180deg,#061D23_0%,#123B4A_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col space-y-6">

        {/* Header */}
        <div className="rounded-[24px] border border-[#12679E] bg-[linear-gradient(135deg,#123B4A_0%,#061D23_100%)] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
          <div className="mb-4 h-1 w-24 rounded-full bg-[#CFF9FF]" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrophyIcon className="h-8 w-8 text-[#4AEEFF]" />
              <div>
                <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-white">Tournaments</h1>
                <p className="text-sm uppercase tracking-[0.25em] text-[#D8FBFF]">{tournaments.length} tournaments found</p>
              </div>
            </div>
            {user?.role === "ADMIN" && (
              <Link
                to="/app/create-tournament"
                className="rounded-full bg-[#FFFFFF] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#061D23] transition hover:bg-[#4AEEFF]"
              >
                + Create Tournament
              </Link>
            )}
          </div>
        </div>

        {/* Empty state */}
        {tournaments.length === 0 ? (
          <div className="rounded-[24px] border border-[#12679E] bg-[linear-gradient(145deg,#123B4A_0%,#061D23_100%)] p-12 text-center shadow-[0_14px_50px_rgba(0,0,0,0.2)]">
            <TrophyIcon className="mx-auto mb-4 h-12 w-12 text-[#12679E]" />
            <p className="text-lg text-[#D8FBFF]">No tournaments found.</p>
            {user?.role === "ADMIN" && (
              <Link
                to="/app/create-tournament"
                className="mt-4 inline-block rounded-full bg-[#FFFFFF] px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#061D23] transition hover:bg-[#4AEEFF]"
              >
                Create your first tournament
              </Link>
            )}
          </div>
        ) : (
          /* Tournament cards — exact Dashboard quick-nav card style */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                to={`/tournaments/${tournament.id}`}
                className="group rounded-[20px] border border-[#12679E] bg-[linear-gradient(160deg,#12679E_0%,#061D23_100%)] p-6 transition hover:border-[#4AEEFF] hover:shadow-[0_12px_35px_rgba(74,238,255,0.12)]"
              >
                {/* Status + name */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white transition group-hover:text-[#CFF9FF]">
                    {tournament.name}
                  </h3>
                  <span className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-[0.1em] ${statusStyles[tournament.status] ?? statusStyles.COMPLETED}`}>
                    {tournament.status}
                  </span>
                </div>

                {/* Description */}
                {tournament.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-[#D8FBFF]">
                    {tournament.description}
                  </p>
                )}

                {/* Meta */}
                <div className="mt-4 space-y-2 border-t border-[#12679E] pt-4">
                  <div className="flex items-center gap-2 text-sm text-[#D8FBFF]">
                    <MapPinIcon className="h-4 w-4 shrink-0 text-[#4AEEFF]" />
                    <span className="truncate">{tournament.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#D8FBFF]">
                    <CalendarIcon className="h-4 w-4 shrink-0 text-[#4AEEFF]" />
                    <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#D8FBFF]">
                    <UserGroupIcon className="h-4 w-4 shrink-0 text-[#4AEEFF]" />
                    <span>{tournament._count.registrations} participants</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Tournaments;