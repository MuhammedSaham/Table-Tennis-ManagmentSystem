import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

interface Registration {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  registeredAt: string;
  tournament: {
    id: string;
    name: string;
    venue: string;
    startDate: string;
    status: string;
  };
  category: {
    id: string;
    name: string;
    type: string;
  };
}

const MyRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await api.get("/registrations/my-registrations");
      setRegistrations(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (registrationId: string) => {
    if (window.confirm("Are you sure you want to cancel this registration?")) {
      try {
        await api.delete(`/registrations/${registrationId}/cancel`);
        toast.success("Registration cancelled successfully");
        fetchRegistrations();
      } catch (error) {
        // Error handled by interceptor
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "✅ Approved";
      case "PENDING":
        return "⏳ Pending Approval";
      case "REJECTED":
        return "❌ Rejected";
      case "CANCELLED":
        return "🚫 Cancelled";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading your registrations...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        My Tournament Registrations
      </h1>

      {registrations.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            You haven't registered for any tournaments yet.
          </p>
          <Link to="/tournaments" className="btn-primary inline-block">
            Browse Tournaments
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((registration) => (
            <div key={registration.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link to={`/tournaments/${registration.tournament.id}`}>
                    <h3 className="text-xl font-semibold text-gray-900 hover:text-primary-600">
                      {registration.tournament.name}
                    </h3>
                  </Link>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Category</p>
                      <p className="font-medium">
                        {registration.category?.name || "General"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Venue</p>
                      <p className="font-medium">
                        {registration.tournament.venue}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Start Date</p>
                      <p className="font-medium">
                        {new Date(
                          registration.tournament.startDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Registered On</p>
                      <p className="font-medium">
                        {new Date(
                          registration.registeredAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(registration.status)}`}
                  >
                    {getStatusText(registration.status)}
                  </span>
                  {registration.status === "PENDING" && (
                    <button
                      onClick={() => handleCancel(registration.id)}
                      className="block mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Cancel Registration
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;
