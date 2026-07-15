import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  // Soft, transparent colors that stand out perfectly on a dark background
  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
      case "ONGOING":
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
      case "COMPLETED":
        return "bg-slate-500/20 text-slate-300 border border-slate-500/30";
      case "CANCELLED":
        return "bg-rose-500/20 text-rose-300 border border-rose-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border border-slate-500/30";
    }
  };

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-wide">Tournaments</h1>
          {user?.role === "ADMIN" && (
            <Link to="/app/create-tournament" className="btn-primary">
              + Create Tournament
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <Link key={tournament.id} to={`/tournaments/${tournament.id}`}>
              {/* Premium dark-theme card matching your layout */}
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] hover:border-cyan-500/40 transition-all duration-300 transform hover:-translate-y-1 shadow-xl cursor-pointer">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="text-xl font-bold text-slate-100 transition-colors">
                    {tournament.name}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${getStatusColor(
                      tournament.status
                    )}`}
                  >
                    {tournament.status}
                  </span>
                </div>
                
                <p className="text-slate-300 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                  {tournament.description || "No description provided."}
                </p>

                <div className="pt-3 border-t border-white/5 space-y-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-medium">Venue:</span> 
                    <span>{tournament.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-medium">Start Date:</span> 
                    <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-slate-200">
                      {tournament._count.registrations} participants
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {tournaments.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md mt-4">
            <p className="text-slate-300">No tournaments found.</p>
            {user?.role === "ADMIN" && (
              <Link
                to="/app/create-tournament"
                className="inline-block mt-4 rounded-lg bg-cyan-500/90 hover:bg-cyan-400 text-slate-900 font-semibold px-4 py-2 text-sm transition-colors"
              >
                Create your first tournament
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;