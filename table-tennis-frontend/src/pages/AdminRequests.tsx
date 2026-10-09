import React, { useEffect, useState } from "react";
import api, { getProfileImageUrl } from "../services/api";
import toast from "react-hot-toast";
import {
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  EnvelopeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

interface ClubMembershipRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  rejectionReason: string | null;
  playerProfile: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
    };
  };
}
interface PaymentProofRequest {
  id: string;
  tournamentId: string;
  playerId: string;
  registrationIds: string | null;
  proofUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;

  tournament: {
    id: string;
    name: string;
    registrationFee: string | null;
  };

  player: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    playerProfile?: {
      isClubMember: boolean;
    } | null;
  };

  registrations: Array<{
    id: string;
    status: string;
    category: {
      id: string;
      name: string;
      type: string;
    } | null;
  }>;
}

const AdminRequests: React.FC = () => {
  const { user } = useAuth();

  const [paymentProofRequests, setPaymentProofRequests] = useState<
    PaymentProofRequest[]
  >([]);

  const [paymentProofLoading, setPaymentProofLoading] = useState(true);

  const [paymentProcessingId, setPaymentProcessingId] = useState<string | null>(
    null,
  );

  const [showPaymentRejectModal, setShowPaymentRejectModal] = useState(false);

  const [selectedPaymentProofId, setSelectedPaymentProofId] = useState<
    string | null
  >(null);

  const [paymentRejectionReason, setPaymentRejectionReason] = useState("");

  const [membershipRequests, setMembershipRequests] = useState<
    ClubMembershipRequest[]
  >([]);
  const [selectedMembershipIds, setSelectedMembershipIds] = useState<string[]>(
    [],
  );

  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [membershipProcessingId, setMembershipProcessingId] = useState<
    string | null
  >(null);
  const [showMembershipRejectModal, setShowMembershipRejectModal] =
    useState(false);

  const [selectedMembershipRequestId, setSelectedMembershipRequestId] =
    useState<string | null>(null);

  const [membershipRejectionReason, setMembershipRejectionReason] =
    useState("");

  useEffect(() => {
    fetchMembershipRequests();
    fetchPaymentProofRequests();
  }, []);

  const fetchMembershipRequests = async () => {
    try {
      const response = await api.get("/club-membership/requests");
      setMembershipRequests(response.data.data);
    } catch (error) {
      console.error("Failed to fetch club membership requests", error);
      toast.error("Failed to fetch club membership requests");
    } finally {
      setMembershipLoading(false);
    }
  };

  const fetchPaymentProofRequests = async () => {
    try {
      setPaymentProofLoading(true);

      const response = await api.get("/payment-proofs/pending");

      setPaymentProofRequests(response.data.data);
    } catch (error: any) {
      console.error(
        "Failed to fetch payment proof requests:",
        error.response?.data || error,
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to fetch payment proof requests",
      );
    } finally {
      setPaymentProofLoading(false);
    }
  };
  const handlePaymentApprove = async (proofId: string) => {
    setPaymentProcessingId(proofId);

    try {
      await api.patch(`/payment-proofs/${proofId}/process`, {
        action: "APPROVE",
      });

      toast.success("Payment proof approved successfully!");

      // Refresh the list.
      // The approved proof should disappear from pending requests.
      await fetchPaymentProofRequests();
    } catch (error: any) {
      console.error(
        "Approve payment proof error:",
        error.response?.status,
        error.response?.data,
      );

      toast.error(
        error.response?.data?.message || "Failed to approve payment proof",
      );
    } finally {
      setPaymentProcessingId(null);
    }
  };
  const openPaymentRejectModal = (proofId: string) => {
    setSelectedPaymentProofId(proofId);
    setPaymentRejectionReason("");
    setShowPaymentRejectModal(true);
  };

  const handlePaymentReject = async () => {
    if (!selectedPaymentProofId) return;

    if (!paymentRejectionReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    setPaymentProcessingId(selectedPaymentProofId);

    try {
      await api.patch(`/payment-proofs/${selectedPaymentProofId}/process`, {
        action: "REJECT",
        rejectionReason: paymentRejectionReason.trim(),
      });

      toast.success("Payment proof rejected successfully");

      setShowPaymentRejectModal(false);
      setSelectedPaymentProofId(null);
      setPaymentRejectionReason("");

      // Rejected proof is no longer pending,
      // so refresh the pending list.
      await fetchPaymentProofRequests();
    } catch (error: any) {
      console.error(
        "Reject payment proof error:",
        error.response?.status,
        error.response?.data,
      );

      toast.error(
        error.response?.data?.message || "Failed to reject payment proof",
      );
    } finally {
      setPaymentProcessingId(null);
    }
  };

  const handleMembershipApprove = async (requestId: string) => {
    setMembershipProcessingId(requestId);

    try {
      await api.patch(`/club-membership/requests/${requestId}/approve`);
      toast.success("Club membership approved successfully!");
      await fetchMembershipRequests();
    } catch (error: any) {
      console.error(
        "Approve membership request error:",
        error.response?.status,
        error.response?.data,
      );
      toast.error(
        error.response?.data?.message ||
          "Failed to approve club membership request",
      );
    } finally {
      setMembershipProcessingId(null);
    }
  };

  const handleMembershipReject = async () => {
    if (!selectedMembershipRequestId) return;

    setMembershipProcessingId(selectedMembershipRequestId);

    try {
      await api.patch(
        `/club-membership/requests/${selectedMembershipRequestId}/reject`,
        {
          reason: membershipRejectionReason.trim() || "No reason provided",
        },
      );

      toast.success("Club membership request rejected");

      setShowMembershipRejectModal(false);
      setMembershipRejectionReason("");
      setSelectedMembershipRequestId(null);

      await fetchMembershipRequests();
    } catch (error: any) {
      console.error(
        "Reject membership request error:",
        error.response?.status,
        error.response?.data,
      );
      toast.error(
        error.response?.data?.message ||
          "Failed to reject club membership request",
      );
    } finally {
      setMembershipProcessingId(null);
    }
  };

  const openMembershipRejectModal = (requestId: string) => {
    setSelectedMembershipRequestId(requestId);
    setMembershipRejectionReason("");
    setShowMembershipRejectModal(true);
  };

  const toggleMembershipSelection = (requestId: string) => {
    setSelectedMembershipIds((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId],
    );
  };

  const toggleSelectAllMembership = () => {
    if (selectedMembershipIds.length === membershipRequests.length) {
      setSelectedMembershipIds([]);
    } else {
      setSelectedMembershipIds(membershipRequests.map((request) => request.id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedMembershipIds.length === 0 || bulkProcessing) return;

    setBulkProcessing(true);

    try {
      const results = await Promise.allSettled(
        selectedMembershipIds.map((id) =>
          api.patch(`/club-membership/requests/${id}/approve`),
        ),
      );

      const succeeded = results.filter(
        (result) => result.status === "fulfilled",
      ).length;

      const failed = results.length - succeeded;

      if (succeeded > 0) {
        toast.success(`${succeeded} request(s) approved successfully`);
      }

      if (failed > 0) {
        toast.error(`${failed} request(s) could not be approved`);
      }

      setSelectedMembershipIds([]);
      await fetchMembershipRequests();
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedMembershipIds.length === 0 || bulkProcessing) return;

    setBulkProcessing(true);

    try {
      const results = await Promise.allSettled(
        selectedMembershipIds.map((id) =>
          api.patch(`/club-membership/requests/${id}/reject`, {
            reason: bulkRejectionReason.trim() || "No reason provided",
          }),
        ),
      );

      const succeeded = results.filter(
        (result) => result.status === "fulfilled",
      ).length;

      const failed = results.length - succeeded;

      if (succeeded > 0) {
        toast.success(`${succeeded} request(s) rejected successfully`);
      }

      if (failed > 0) {
        toast.error(`${failed} request(s) could not be rejected`);
      }

      setShowBulkRejectModal(false);
      setBulkRejectionReason("");
      setSelectedMembershipIds([]);

      await fetchMembershipRequests();
    } finally {
      setBulkProcessing(false);
    }
  };

  const wrapInBaseLayout = (children: React.ReactNode) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
      {/* BG.PNG FIXED FULL-BLEED BACKGROUND */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      <div className="fixed inset-0 bg-[#061D23]/25" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-6 p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );

  return wrapInBaseLayout(
    <>
      {/* GLASS HEADER */}
      <header className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-8">
        <div className="mb-4 h-[3px] w-16 bg-[#4AEEFF]" />
        <h1 className="mb-2 text-2xl font-black uppercase tracking-[0.2em] text-[#FFFFFF] sm:text-4xl">
          Pending Requests
        </h1>
        <p className="text-xs uppercase tracking-[0.3em] text-[#4AEEFF]/90">
          Review and manage player requests for official club membership
        </p>
      </header>

      {/* CLUB MEMBERSHIP REQUESTS MAIN CONTAINER */}
      <section className="rounded-[16px] border border-white/20 bg-[#061D23]/10 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-[#4AEEFF]/20 p-2 text-[#4AEEFF]">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">
              Pending  Membership Requests
            </h2>
            <p className="text-xs text-white/60">
              Select individual or bulk options to process membership requests
            </p>
          </div>
        </div>

        {!membershipLoading && membershipRequests.length > 0 && (
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-[#061D23]/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  membershipRequests.length > 0 &&
                  selectedMembershipIds.length === membershipRequests.length
                }
                onChange={toggleSelectAllMembership}
                disabled={bulkProcessing}
                className="h-4 w-4 cursor-pointer accent-[#4AEEFF]"
              />
              <span className="text-sm font-bold text-white">Select All</span>
              <span className="text-xs text-white/60">
                ({selectedMembershipIds.length} selected)
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleBulkApprove}
                disabled={selectedMembershipIds.length === 0 || bulkProcessing}
                className="rounded-lg bg-[#4AEEFF] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#061D23] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {bulkProcessing ? "Processing..." : "Approve Selected"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setBulkRejectionReason("");
                  setShowBulkRejectModal(true);
                }}
                disabled={selectedMembershipIds.length === 0 || bulkProcessing}
                className="rounded-lg border border-red-400/50 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reject Selected
              </button>
            </div>
          </div>
        )}

        {membershipLoading ? (
          <div className="rounded-[12px] border border-white/10 bg-[#061D23]/40 p-12 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-[#4AEEFF]" />
            <p className="text-xs font-black uppercase tracking-wider text-[#4AEEFF]">
              Loading membership requests...
            </p>
          </div>
        ) : membershipRequests.length === 0 ? (
          <div className="rounded-[12px] border border-white/10 bg-[#061D23]/40 p-12 text-center">
            <CheckCircleIcon className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
            <h3 className="text-base font-bold uppercase tracking-wider text-white">
              No Pending Membership Requests
            </h3>
            <p className="mt-2 text-xs text-white/60">
              There are currently no players waiting for club membership
              approval.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {membershipRequests.map((request) => {
              const player = request.playerProfile.user;
              const isProcessing = membershipProcessingId === request.id;

              return (
                <div
                  key={request.id}
                  className="rounded-[12px] border border-white/10 bg-[#061D23]/40 p-5 transition-all duration-300 hover:border-[#4AEEFF]/40"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedMembershipIds.includes(request.id)}
                        onChange={() => toggleMembershipSelection(request.id)}
                        disabled={bulkProcessing || isProcessing}
                        className="mt-4 h-4 w-4 shrink-0 cursor-pointer accent-[#4AEEFF]"
                      />
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#061D23]/70 text-sm font-black text-[#4AEEFF]">
                        {player.firstName?.[0]?.toUpperCase()}
                        {player.lastName?.[0]?.toUpperCase()}
                      </div>

                      <div>
                        <h3 className="font-bold uppercase tracking-wide text-white">
                          {player.firstName} {player.lastName}
                        </h3>

                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-white/60">
                            <EnvelopeIcon className="h-4 w-4 text-[#4AEEFF]" />
                            <span>{player.email}</span>
                          </div>

                          {player.phone && (
                            <p className="text-xs text-white/50 font-mono">
                              Phone: {player.phone}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <ClockIcon className="h-4 w-4 text-[#4AEEFF]" />
                            <span>
                              Requested on{" "}
                              {new Date(request.requestedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full gap-3 lg:w-auto">
                      <button
                        type="button"
                        onClick={() => handleMembershipApprove(request.id)}
                        disabled={isProcessing}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#4AEEFF] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#061D23] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 lg:flex-none"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        {isProcessing ? "Processing..." : "Approve"}
                      </button>

                      <button
                        type="button"
                        onClick={() => openMembershipRejectModal(request.id)}
                        disabled={isProcessing}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#4AEEFF] transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 lg:flex-none"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* PAYMENT PROOF REQUESTS */}
      <section className="rounded-[16px] border border-white/20 bg-[#061D23]/10 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-[#4AEEFF]/20 p-2 text-[#4AEEFF]">
            <CheckCircleIcon className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">
              Pending Payment Verifications
            </h2>

            <p className="text-xs text-white/60">
              Review player payment proofs before approving tournament
              registrations
            </p>
          </div>
        </div>

        {paymentProofLoading ? (
          <div className="rounded-[12px] border border-white/10 bg-[#061D23]/40 p-12 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-[#4AEEFF]" />

            <p className="text-xs font-black uppercase tracking-wider text-[#4AEEFF]">
              Loading payment proofs...
            </p>
          </div>
        ) : paymentProofRequests.length === 0 ? (
          <div className="rounded-[12px] border border-white/10 bg-[#061D23]/40 p-12 text-center">
            <CheckCircleIcon className="mx-auto mb-3 h-10 w-10 text-emerald-400" />

            <h3 className="text-base font-bold uppercase tracking-wider text-white">
              No Pending Payment Proofs
            </h3>

            <p className="mt-2 text-xs text-white/60">
              There are currently no payment proofs waiting for verification.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentProofRequests.map((proof) => {
              const isProcessing = paymentProcessingId === proof.id;

              return (
                <div
                  key={proof.id}
                  className="rounded-[12px] border border-white/10 bg-[#061D23]/40 p-5 transition-all duration-300 hover:border-[#4AEEFF]/40"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                    {/* LEFT SIDE */}
                    <div className="flex-1">
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-[#061D23]/70 text-sm font-black text-[#4AEEFF]">
                          {proof.player.firstName?.[0]?.toUpperCase()}
                          {proof.player.lastName?.[0]?.toUpperCase()}
                        </div>

                        <div>
                          <h3 className="font-bold uppercase tracking-wide text-white">
                            {proof.player.firstName} {proof.player.lastName}
                          </h3>

                          <p className="text-xs text-white/60">
                            {proof.player.email}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                            proof.player.playerProfile?.isClubMember
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {proof.player.playerProfile?.isClubMember
                            ? "Club Member"
                            : "Guest"}
                        </span>
                      </div>

                      {/* Tournament */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-white/40">
                            Tournament
                          </p>

                          <p className="mt-1 text-sm font-bold text-white">
                            {proof.tournament.name}
                          </p>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-white/40">
                            Registration Fee
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#4AEEFF]">
                            {proof.tournament.registrationFee
                              ? `LKR ${proof.tournament.registrationFee}`
                              : "Not specified"}
                          </p>
                        </div>
                      </div>

                      {/* Categories */}
                      <div className="mt-4">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-white/40">
                          Registered Categories
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {proof.registrations.map((registration) => (
                            <span
                              key={registration.id}
                              className="rounded-lg border border-[#4AEEFF]/20 bg-[#4AEEFF]/10 px-3 py-1.5 text-xs font-bold text-[#4AEEFF]"
                            >
                              {registration.category?.name ||
                                "Unknown Category"}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Submitted Date */}
                      <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
                        <ClockIcon className="h-4 w-4 text-[#4AEEFF]" />

                        <span>
                          Submitted{" "}
                          {new Date(proof.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="flex flex-col gap-3 lg:w-56">
                      <a
                        href={getProfileImageUrl(proof.proofUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center rounded-lg border border-[#4AEEFF]/40 bg-[#4AEEFF]/10 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#4AEEFF] transition-all hover:bg-[#4AEEFF]/20"
                      >
                        View Payment Proof
                      </a>

                      <button
                        type="button"
                        onClick={() => handlePaymentApprove(proof.id)}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 rounded-lg bg-[#4AEEFF] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#061D23] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4" />

                        {isProcessing ? "Processing..." : "Approve"}
                      </button>

                      <button
                        type="button"
                        onClick={() => openPaymentRejectModal(proof.id)}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 rounded-lg border border-red-400/50 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-red-300 transition-all hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* BULK MEMBERSHIP REJECTION MODAL */}
      {showBulkRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[16px] border border-white/20 bg-[#061D23] p-6 shadow-2xl">
            <div className="mb-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-red-500/20 p-2 text-red-400">
                  <XCircleIcon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold uppercase tracking-wider text-white">
                  Reject Selected Requests
                </h2>
              </div>

              <p className="text-sm text-white/60">
                You are rejecting {selectedMembershipIds.length} membership
                request(s). Please provide a reason.
              </p>
            </div>

            <textarea
              value={bulkRejectionReason}
              onChange={(e) => setBulkRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              disabled={bulkProcessing}
              className="w-full resize-none rounded-lg border border-white/10 bg-[#0A2A32] p-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#4AEEFF]/50"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkRejectModal(false)}
                disabled={bulkProcessing}
                className="rounded-lg border border-white/20 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white/70 hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleBulkReject}
                disabled={bulkProcessing}
                className="rounded-lg bg-red-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-red-400 disabled:opacity-50"
              >
                {bulkProcessing ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE MEMBERSHIP REJECTION MODAL */}
      {showMembershipRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[16px] border border-white/20 bg-[#061D23] p-6 shadow-2xl">
            <div className="mb-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-red-500/20 p-2 text-red-400">
                  <XCircleIcon className="h-5 w-5" />
                </div>

                <h2 className="text-lg font-bold uppercase tracking-wider text-white">
                  Reject Membership Request
                </h2>
              </div>

              <p className="text-sm text-white/60">
                Please provide a reason for rejecting this club membership
                request.
              </p>
            </div>

            <textarea
              value={membershipRejectionReason}
              onChange={(e) => setMembershipRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full resize-none rounded-lg border border-white/10 bg-[#0A2A32] p-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#4AEEFF]/50"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowMembershipRejectModal(false);
                  setMembershipRejectionReason("");
                  setSelectedMembershipRequestId(null);
                }}
                disabled={membershipProcessingId !== null}
                className="rounded-lg border border-white/20 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white/70 transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleMembershipReject}
                disabled={membershipProcessingId !== null}
                className="rounded-lg bg-red-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {membershipProcessingId !== null
                  ? "Rejecting..."
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT PROOF REJECTION MODAL */}
      {showPaymentRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[16px] border border-white/20 bg-[#061D23] p-6 shadow-2xl">
            <div className="mb-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-red-500/20 p-2 text-red-400">
                  <XCircleIcon className="h-5 w-5" />
                </div>

                <h2 className="text-lg font-bold uppercase tracking-wider text-white">
                  Reject Payment Proof
                </h2>
              </div>

              <p className="text-sm text-white/60">
                Please explain why this payment proof is being rejected. The
                player will see this reason and can upload a new proof.
              </p>
            </div>

            <textarea
              value={paymentRejectionReason}
              onChange={(e) => setPaymentRejectionReason(e.target.value)}
              placeholder="Example: Payment receipt is unclear. Please upload a clearer receipt."
              rows={4}
              disabled={paymentProcessingId !== null}
              className="w-full resize-none rounded-lg border border-white/10 bg-[#0A2A32] p-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#4AEEFF]/50"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPaymentRejectModal(false);
                  setSelectedPaymentProofId(null);
                  setPaymentRejectionReason("");
                }}
                disabled={paymentProcessingId !== null}
                className="rounded-lg border border-white/20 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white/70 transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePaymentReject}
                disabled={
                  paymentProcessingId !== null || !paymentRejectionReason.trim()
                }
                className="rounded-lg bg-red-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paymentProcessingId !== null
                  ? "Rejecting..."
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
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
    </>,
  );
};

export default AdminRequests;
