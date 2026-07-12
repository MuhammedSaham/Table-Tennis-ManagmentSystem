import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  EnvelopeIcon,
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

  if (loading) {
    return wrapInBaseLayout(
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#4AEEFF]"></div>
        <div className="text-sm font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
          Loading admin requests...
        </div>
      </div>
    );
  }

  return wrapInBaseLayout(
    <>
      {/* ─── PREMIUM TRANSPARENT GLASS HEADER ─── */}
      <header className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-8">
        <div className="mb-4 h-[3px] w-16 bg-[#4AEEFF]" />
        <h1 className="mb-2 text-2xl font-black uppercase tracking-[0.2em] text-[#FFFFFF] sm:text-4xl">
          Admin Requests
        </h1>
        <p className="text-xs uppercase tracking-[0.3em] text-[#4AEEFF]/90">
          Review and handle privilege escalation workflows
        </p>
      </header>

      {/* ─── MAIN CONTENT UI MODULES ─── */}
      {requests.length === 0 ? (
        <section className="rounded-[16px] border border-white/20 bg-[#061D23]/10 p-6 py-16 text-center shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <div className="mb-4 flex justify-center">
            <div className="rounded-lg bg-[#4AEEFF]/20 p-3 text-[#4AEEFF]">
              <CheckCircleIcon className="h-8 w-8" />
            </div>
          </div>
          <h3 className="mb-2 text-lg font-bold uppercase tracking-wider text-white">
            No Pending Requests
          </h3>
          <p className="text-sm text-white/70 max-w-md mx-auto">
            There are no admin requests waiting for review at this time.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="group rounded-[16px] border border-white/20 bg-[#061D23]/10 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-[#4AEEFF] hover:bg-[#12679E]/10"
            >
              <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="flex-1 w-full">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#061D23]/60 font-bold text-[#4AEEFF] tracking-tighter">
                      {request.firstName[0].toUpperCase()}
                      {request.lastName[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white uppercase tracking-wide group-hover:text-[#4AEEFF] transition-colors">
                        {request.firstName} {request.lastName}
                      </h3>
                      <p className="text-xs text-white/70 break-all">{request.email}</p>
                    </div>
                  </div>

                  {/* Shaded Request Body Panel */}
                  <div className="mt-4 rounded-[12px] border border-white/10 bg-[#061D23]/40 p-4">
                    <p className="mb-1.5 text-xs font-black uppercase tracking-widest text-[#4AEEFF]">
                      Reason for request:
                    </p>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {request.adminRequest?.reason || "No reason provided"}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-white/60">
                    <ClockIcon className="h-4 w-4 text-[#4AEEFF]" />
                    <p className="text-xs">
                      Requested on: {new Date(request.adminRequestedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Control Actions Section */}
                <div className="flex w-full gap-3 md:w-auto md:flex-col lg:flex-row">
                  {isSuperAdmin ? (
                    <>
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#4AEEFF] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#061D23] transition-all duration-200 hover:bg-white disabled:opacity-50 md:flex-none"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        {processingId === request.id ? "Processing..." : "Approve"}
                      </button>
                      <button
                        onClick={() => openRejectModal(request.id)}
                        disabled={processingId === request.id}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#4AEEFF] transition-all duration-200 hover:bg-white/5 disabled:opacity-50 md:flex-none"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className="rounded-lg border border-white/10 bg-[#061D23]/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#4AEEFF]/60 whitespace-nowrap">
                      🔒 Super Admin Restricted
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── MODAL DIALOG PRESET ─── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[16px] border border-white/20 bg-[#061D23]/30 p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
            <h2 className="mb-2 text-lg font-black uppercase tracking-widest text-white">
              Reject Admin Request
            </h2>
            <p className="mb-4 text-xs text-white/70 uppercase tracking-wider">
              Please declare a reasoning context down below:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="mb-4 w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-3 text-sm text-white placeholder-white/30 focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
              placeholder="e.g., We currently have enough administrators..."
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-red-600"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setSelectedUserId(null);
                }}
                className="flex-1 rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#4AEEFF] transition-all hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SHADED DEEP NAVY TRANSPARENT FOOTER ─── */}
      <footer className="mt-auto rounded-[16px] border border-white/10 bg-[#061D23]/25 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-[#FFFFFF]/80">
            <UserIcon className="h-4 w-4 text-[#4AEEFF]" />
            <span>Logged in as:</span>
            <span className="rounded bg-[#4AEEFF]/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[#4AEEFF]">
              {user?.role || "GUEST"}
            </span>
          </div>
          {user?.email && (
            <div className="flex items-center gap-2 text-sm text-[#FFFFFF]/70">
              <EnvelopeIcon className="h-4 w-4 text-[#4AEEFF]/80" />
              <span>{user.email}</span>
            </div>
          )}
        </div>
      </footer>
    </>
  );
};

export default AdminRequests;