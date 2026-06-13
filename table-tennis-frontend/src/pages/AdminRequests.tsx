import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

interface AdminRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  adminRequestedAt: string;
  adminRequest: {
    reason: string;
  };
}

const AdminRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  //const [currentUser, setCurrentUser] = useState<any>(null);

  const isSuperAdmin = (user as any)?.isSuperAdmin ?? false;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get("/admin-requests/pending");
      setRequests(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch admin requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      await api.patch(`/auth/admin-requests/${userId}/approve`);
      toast.success("Admin request approved successfully!");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedUserId) return;

    setProcessingId(selectedUserId);
    try {
      await api.patch(`/auth/admin-requests/${selectedUserId}/reject`, {
        reason: rejectionReason || "No reason provided",
      });
      toast.success("Admin request rejected");
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedUserId(null);
      fetchRequests();
    } catch (error) {
      toast.error("Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (userId: string) => {
    setSelectedUserId(userId);
    setShowRejectModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Requests</h1>
        <p className="text-gray-600 mt-2">
          Review and manage requests from users who want to become
          administrators
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="card text-center py-16">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Pending Requests
          </h3>
          <p className="text-gray-500">
            There are no admin requests waiting for review at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold">
                        {request.firstName[0]}
                        {request.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.firstName} {request.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{request.email}</p>
                    </div>
                  </div>

                  <div className="mt-3 bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Reason for request:
                    </p>
                    <p className="text-sm text-gray-600">
                      {request.adminRequest?.reason || "No reason provided"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-400">
                      Requested on:{" "}
                      {new Date(request.adminRequestedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  {isSuperAdmin ? (
                    <>
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                        {processingId === request.id
                          ? "Processing..."
                          : "Approve"}
                      </button>
                      <button
                        onClick={() => openRejectModal(request.id)}
                        disabled={processingId === request.id}
                        className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircleIcon className="w-5 h-5" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      🔒 Super admin only
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Reject Admin Request
            </h2>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this admin request:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="input-field mb-4"
              placeholder="e.g., We currently have enough administrators..."
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setSelectedUserId(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
