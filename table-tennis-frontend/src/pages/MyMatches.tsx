import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

interface Match {
  id: string;
  round: string;
  matchNumber: number;
  scheduledTime: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  score: string | null;
  winnerId: string | null;
  player1: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  player2: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  tournament: {
    id: string;
    name: string;
    venue: string;
  };
  category: {
    name: string;
    type: string;
  };
}

const MyMatches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await api.get("/matches/my-matches");
      setMatches(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "ONGOING":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "📅 Scheduled";
      case "ONGOING":
        return "🏃 Ongoing";
      case "COMPLETED":
        return "✅ Completed";
      case "CANCELLED":
        return "❌ Cancelled";
      default:
        return status;
    }
  };

  const filteredMatches = matches.filter((match) => {
    if (filter === "upcoming") {
      return match.status === "SCHEDULED";
    }
    if (filter === "completed") {
      return match.status === "COMPLETED";
    }
    return true;
  });

  // Calculate statistics
  const totalMatches = matches.length;
  const completedMatches = matches.filter(
    (m) => m.status === "COMPLETED",
  ).length;
  const wins = matches.filter(
    (m) =>
      (m.status === "COMPLETED" && m.winnerId === m.player1?.id) ||
      m.winnerId === m.player2?.id,
  ).length;
  const winRate =
    completedMatches > 0 ? ((wins / completedMatches) * 100).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading your matches...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Matches</h1>

      <div className="text-right">
        <p className="text-sm text-gray-600">Total: {totalMatches} matches</p>
        <p className="text-sm text-gray-600">Win Rate: {winRate}%</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-primary-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All Matches ({matches.length})
        </button>
        <button
          onClick={() => setFilter("upcoming")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "upcoming"
              ? "bg-primary-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Upcoming ({matches.filter((m) => m.status === "SCHEDULED").length})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "completed"
              ? "bg-primary-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Completed ({completedMatches})
        </button>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No matches found.</p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="btn-secondary mt-4 inline-block"
            >
              View All Matches
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <div key={match.id} className="card">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(match.status)}`}
                    >
                      {getStatusText(match.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {match.category.name} • {match.round}
                    </span>
                  </div>

                  <Link to={`/tournaments/${match.tournament.id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600">
                      {match.tournament.name}
                    </h3>
                  </Link>

                  <div className="mt-3 text-center">
                    <div className="flex items-center justify-center gap-8">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {match.player1?.firstName} {match.player1?.lastName}
                        </p>
                      </div>
                      <div className="text-xl font-bold text-gray-700">VS</div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {match.player2?.firstName} {match.player2?.lastName}
                        </p>
                      </div>
                    </div>

                    {match.score && (
                      <div className="mt-2 text-lg font-semibold text-primary-600">
                        Score: {match.score}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-sm text-gray-500 text-center">
                    📍 {match.tournament.venue} • 🕐{" "}
                    {new Date(match.scheduledTime).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMatches;
