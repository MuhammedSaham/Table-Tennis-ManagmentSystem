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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Welcome back, {user?.firstName}! 👋
      </h1>

      {/* New Tournaments Alert Section */}
      {newTournaments.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrophyIcon className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-primary-800">
              New Tournaments Available!
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {newTournaments.map((tournament) => (
              <Link
                key={tournament.id}
                to={`/tournaments/${tournament.id}`}
                className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900">
                  {tournament.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  📍 {tournament.venue}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Register by:{" "}
                  {new Date(
                    tournament.registrationDeadline,
                  ).toLocaleDateString()}
                </p>
                <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Register Now →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Your existing dashboard content */}
      <div className="card">
        <p className="text-gray-600">
          You are logged in as{" "}
          <strong className="text-primary-600">{user?.role}</strong>
        </p>
        <p className="text-gray-600 mt-2">Email: {user?.email}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/tournaments"
          className="card hover:shadow-lg transition-shadow"
        >
          <TrophyIcon className="w-8 h-8 text-primary-600 mb-2" />
          <h3 className="font-semibold text-gray-900 mb-2">Tournaments</h3>
          <p className="text-gray-600">View and manage tournaments</p>
        </Link>

        {isPlayer && (
          <Link
            to="app/my-matches"
            className="card hover:shadow-lg transition-shadow"
          >
            <CalendarIcon className="w-8 h-8 text-primary-600 mb-2" />
            <h3 className="font-semibold text-gray-900 mb-2">My Matches</h3>
            <p className="text-gray-600">Check your upcoming matches</p>
          </Link>
        )}
        <Link
          to="/leaderboard"
          className="card hover:shadow-lg transition-shadow"
        >
          <ChartBarIcon className="w-8 h-8 text-primary-600 mb-2" />
          <h3 className="font-semibold text-gray-900 mb-2">Leaderboard</h3>
          <p className="text-gray-600">See tournament rankings</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
