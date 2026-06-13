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
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await api.get("/tournaments");
      setTournaments(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch tournaments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-100 text-blue-800";
      case "ONGOING":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading tournaments...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tournaments</h1>
        {user?.role === "ADMIN" && (
          <Link to="/app/create-tournament" className="btn-primary">
            + Create Tournament
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <Link key={tournament.id} to={`/tournaments/${tournament.id}`}>
            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  {tournament.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tournament.status)}`}
                >
                  {tournament.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {tournament.description || "No description"}
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>📍 {tournament.venue}</p>
                <p>📅 {new Date(tournament.startDate).toLocaleDateString()}</p>
                <p>👥 {tournament._count.registrations} participants</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {tournaments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tournaments found.</p>
          {user?.role === "ADMIN" && (
            <Link
              to="/app/create-tournament"
              className="btn-primary mt-4 inline-block"
            >
              Create your first tournament
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Tournaments;
