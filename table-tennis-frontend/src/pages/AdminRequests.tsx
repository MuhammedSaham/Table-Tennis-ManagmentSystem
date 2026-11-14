import React, { useEffect, useState } from "react";
import api, { getProfileImageUrl } from "../services/api";
import toast from "react-hot-toast";
import GlassSelect from "../components/GlassSelect";
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

interface PendingAdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  adminRequestedAt: string;
}

const AVAILABLE_ADMIN_PERMISSIONS = [
  {
    id: "MANAGE_USERS",
    name: "Manage Users",
    desc: "View, update user accounts, roles & permissions",
  },
  {
    id: "MANAGE_PLAYERS",
    name: "Manage Players",
    desc: "Create, edit, rank, and manage player profiles",
  },
  {
    id: "MANAGE_REFEREES",
    name: "Manage Referees",
    desc: "Manage referee assignments and information",
  },
  {
    id: "MANAGE_TOURNAMENTS",
    name: "Manage Tournaments",
    desc: "Create, edit, and manage tournaments",
  },
  {
    id: "MANAGE_REGISTRATIONS",
    name: "Manage Registrations",
    desc: "Approve, reject, or modify tournament registrations",
  },
  {
    id: "MANAGE_MATCHES",
    name: "Manage Matches",
    desc: "Schedule matches, assign referees, and update scores",
  },
  {
    id: "MANAGE_RESULTS",
    name: "Manage Results",
    desc: "Record, verify, and publish tournament results",
  },
  {
    id: "MANAGE_RANKINGS",
    name: "Manage Rankings",
    desc: "Update official player rankings and points",
  },
  {
    id: "MANAGE_CLUB_MEMBERSHIPS",
    name: "Manage Club Memberships",
    desc: "Grant or revoke player club memberships",
  },
];
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
      gender: "MALE" | "FEMALE" | null;
    } | null;
  };

  registrations: Array<{
    id: string;
    status: string;

    verificationId: string;
    verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
    verificationPlayerId: string;

    category: {
      id: string;
      name: string;
      type: string;
    } | null;
  }>;
}

const AdminRequests: React.FC = () => {
  const { user, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<
    "ADMIN" | "MEMBERSHIP" | "PAYMENT"
  >(
    user?.role === "SUPER_ADMIN" || user?.isSuperAdmin
      ? "ADMIN"
      : hasPermission("MANAGE_CLUB_MEMBERSHIPS")
        ? "MEMBERSHIP"
        : "PAYMENT",
  );

  const [paymentProofRequests, setPaymentProofRequests] = useState<
    PaymentProofRequest[]
  >([]);

  const [paymentProofLoading, setPaymentProofLoading] = useState(true);

  const [paymentMembershipFilter, setPaymentMembershipFilter] = useState<
    "ALL" | "CLUB" | "GUEST"
  >("ALL");

  const [paymentGenderFilter, setPaymentGenderFilter] = useState<
    "ALL" | "MALE" | "FEMALE"
  >("ALL");

  const [paymentTournamentFilter, setPaymentTournamentFilter] =
    useState<string>("ALL");

  const [paymentEventFilter, setPaymentEventFilter] = useState<
    "ALL" | "SINGLES" | "DOUBLES" | "MIXED_DOUBLES"
  >("ALL");

  const [paymentProcessingId, setPaymentProcessingId] = useState<string | null>(
    null,
  );

  const [showPaymentRejectModal, setShowPaymentRejectModal] = useState(false);

  const [selectedPaymentProofId, setSelectedPaymentProofId] = useState<
    string | null
  >(null);

  const [selectedPaymentVerificationId, setSelectedPaymentVerificationId] =
    useState<string | null>(null);

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

  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.isSuperAdmin;

  const [adminRequests, setAdminRequests] = useState<PendingAdminUser[]>([]);
  const [adminRequestsLoading, setAdminRequestsLoading] = useState(false);
  const [adminProcessingId, setAdminProcessingId] = useState<string | null>(
    null,
  );
  const [showAdminRejectModal, setShowAdminRejectModal] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [adminRejectionReason, setAdminRejectionReason] = useState("");
  const [adminToApprove, setAdminToApprove] = useState<PendingAdminUser | null>(
    null,
  );
  const [selectedPermissionsToGrant, setSelectedPermissionsToGrant] = useState<
    string[]
  >([]);

  useEffect(() => {
    if (isSuperAdmin || hasPermission("MANAGE_CLUB_MEMBERSHIPS")) {
      fetchMembershipRequests();
    } else {
      setMembershipLoading(false);
    }

    if (isSuperAdmin || hasPermission("MANAGE_REGISTRATIONS")) {
      fetchPaymentProofRequests();
    } else {
      setPaymentProofLoading(false);
    }

    if (isSuperAdmin) {
      fetchAdminRequests();
    }
  }, [isSuperAdmin]);

  const fetchAdminRequests = async () => {
    try {
      setAdminRequestsLoading(true);
      const response = await api.get("/admin-requests/pending");
      setAdminRequests(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch admin requests", error);
    } finally {
      setAdminRequestsLoading(false);
    }
  };

  const openAdminApproveModal = (applicant: PendingAdminUser) => {
    setAdminToApprove(applicant);
    // Pre-select all permissions by default so SUPER_ADMIN has full control to check/uncheck
    setSelectedPermissionsToGrant(AVAILABLE_ADMIN_PERMISSIONS.map((p) => p.id));
  };

  const togglePermissionToGrant = (permId: string) => {
    setSelectedPermissionsToGrant((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId],
    );
  };

  const selectAllPermissions = () => {
    setSelectedPermissionsToGrant(AVAILABLE_ADMIN_PERMISSIONS.map((p) => p.id));
  };

  const clearAllPermissions = () => {
    setSelectedPermissionsToGrant([]);
  };

  const handleConfirmApproveAdmin = async () => {
    if (!adminToApprove) return;
    setAdminProcessingId(adminToApprove.id);
    try {
      await api.post(`/admin-requests/${adminToApprove.id}/approve`, {
        permissions: selectedPermissionsToGrant,
      });
      toast.success(
        `Admin request approved! ${selectedPermissionsToGrant.length} permission(s) granted.`,
      );
      setAdminToApprove(null);
      setSelectedPermissionsToGrant([]);
      await fetchAdminRequests();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to approve admin request",
      );
    } finally {
      setAdminProcessingId(null);
    }
  };

  const handleRejectAdmin = async () => {
    if (!selectedAdminId) return;
    setAdminProcessingId(selectedAdminId);
    try {
      await api.post(`/admin-requests/${selectedAdminId}/reject`, {
        reason: adminRejectionReason.trim() || undefined,
      });
      toast.success("Admin request rejected");
      setShowAdminRejectModal(false);
      setSelectedAdminId(null);
      setAdminRejectionReason("");
      await fetchAdminRequests();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to reject admin request",
      );
    } finally {
      setAdminProcessingId(null);
    }
  };

  const openAdminRejectModal = (userId: string) => {
    setSelectedAdminId(userId);
    setAdminRejectionReason("");
    setShowAdminRejectModal(true);
  };

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

  // Get unique tournaments from pending payment proofs
  const paymentTournaments = Array.from(
    new Map(
      paymentProofRequests.map((proof) => [
        proof.tournamentId,
        proof.tournament,
      ]),
    ).values(),
  );

  // Identify the event type for payment filtering.
  const getPaymentCategoryEventType = (
    category: PaymentProofRequest["registrations"][number]["category"],
  ): "SINGLES" | "DOUBLES" | "MIXED_DOUBLES" | null => {
    if (!category) return null;

    const type = category.type.toUpperCase().replace(/[\s-]+/g, "_");
    const name = category.name.toUpperCase();

    if (type === "MIXED_DOUBLES" || name.includes("MIXED")) {
      return "MIXED_DOUBLES";
    }

    if (type === "SINGLES") return "SINGLES";
    if (type === "DOUBLES") return "DOUBLES";

    return null;
  };

  // Filter both payment proof cards and their individual categories.
  const filteredPaymentProofRequests = paymentProofRequests
    .map((proof) => {
      const profile = proof.player.playerProfile;

      const matchesMembership =
        paymentMembershipFilter === "ALL" ||
        (paymentMembershipFilter === "CLUB" &&
          profile?.isClubMember === true) ||
        (paymentMembershipFilter === "GUEST" &&
          profile?.isClubMember === false);

      const matchesGender =
        paymentGenderFilter === "ALL" ||
        profile?.gender === paymentGenderFilter;

      const matchesTournament =
        paymentTournamentFilter === "ALL" ||
        proof.tournamentId === paymentTournamentFilter;

      if (!matchesMembership || !matchesGender || !matchesTournament) {
        return null;
      }

      const matchingRegistrations = proof.registrations.filter(
        (registration) =>
          registration.verificationStatus === "PENDING" &&
          (paymentEventFilter === "ALL" ||
            getPaymentCategoryEventType(registration.category) ===
              paymentEventFilter),
      );

      if (matchingRegistrations.length === 0) return null;

      return {
        ...proof,
        registrations: matchingRegistrations,
      };
    })
    .filter((proof): proof is PaymentProofRequest => proof !== null);

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
  const handlePaymentApprove = async (
    proofId: string,
    verificationId: string,
  ) => {
    setPaymentProcessingId(verificationId);

    try {
      await api.patch(`/payment-proofs/${proofId}/process`, {
        action: "APPROVE",
        verificationId,
      });

      toast.success("Category payment approved successfully!");
      await fetchPaymentProofRequests();
    } catch (error: any) {
      console.error("Approve category payment error:", error);

      toast.error(
        error.response?.data?.message || "Failed to approve category payment",
      );
    } finally {
      setPaymentProcessingId(null);
    }
  };
  const openPaymentRejectModal = (proofId: string, verificationId: string) => {
    setSelectedPaymentProofId(proofId);
    setSelectedPaymentVerificationId(verificationId);
    setPaymentRejectionReason("");
    setShowPaymentRejectModal(true);
  };

  const handlePaymentReject = async () => {
    if (!selectedPaymentProofId || !selectedPaymentVerificationId) {
      return;
    }

    if (!paymentRejectionReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    setPaymentProcessingId(selectedPaymentVerificationId);

    try {
      await api.patch(`/payment-proofs/${selectedPaymentProofId}/process`, {
        action: "REJECT",
        verificationId: selectedPaymentVerificationId,
        rejectionReason: paymentRejectionReason.trim(),
      });

      toast.success("Category payment rejected successfully");

      setShowPaymentRejectModal(false);
      setSelectedPaymentProofId(null);
      setSelectedPaymentVerificationId(null);
      setPaymentRejectionReason("");

      await fetchPaymentProofRequests();
    } catch (error: any) {
      console.error("Reject category payment error:", error);

      toast.error(
        error.response?.data?.message || "Failed to reject category payment",
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col space-y-6 px-4 sm:px-6 lg:px-10 xl:px-14 py-4 sm:py-6 lg:py-8">
        {children}
      </div>
    </div>
  );

  if (
    !isSuperAdmin &&
    !hasPermission("MANAGE_CLUB_MEMBERSHIPS") &&
    !hasPermission("MANAGE_REGISTRATIONS")
  ) {
    return wrapInBaseLayout(
      <div className="rounded-[16px] border border-red-500/30 bg-[#061D23]/40 p-12 text-center backdrop-blur-xl shadow-2xl">
        <p className="font-black uppercase tracking-widest text-red-400">
          Access denied. Permission required to view requests.
        </p>
      </div>,
    );
  }

  return wrapInBaseLayout(
    <>
      {/* GLASS HEADER */}
      <header className="rounded-2xl border border-white/20 bg-[#061D23]/20 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
        <h1 className="mb-2 text-xl font-black uppercase tracking-wider text-white sm:text-2xl">
          Pending Requests
        </h1>
        <p className="text-xs uppercase tracking-[0.2em] text-[#4AEEFF]">
          Review and manage administrative, player membership, and payment
          requests
        </p>
      </header>

      {/* ─── REQUEST CATEGORY TABS ─── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("ADMIN")}
            className={`rounded-xl border p-5 text-left transition-all duration-200 ${
              activeTab === "ADMIN"
                ? "border-[#4AEEFF] bg-[#4AEEFF]/20 text-[#4AEEFF]"
                : "border-white/20 bg-[#061D23]/30 text-white/70 hover:border-[#4AEEFF]/50"
            }`}
          >
            <p className="text-sm font-black uppercase tracking-wider">
              Admin Requests
            </p>
            <p className="mt-2 text-xs">{adminRequests.length} Pending</p>
          </button>
        )}

        {(isSuperAdmin || hasPermission("MANAGE_CLUB_MEMBERSHIPS")) && (
          <button
            type="button"
            onClick={() => setActiveTab("MEMBERSHIP")}
            className={`rounded-xl border p-5 text-left transition-all duration-200 ${
              activeTab === "MEMBERSHIP"
                ? "border-[#4AEEFF] bg-[#4AEEFF]/20 text-[#4AEEFF]"
                : "border-white/20 bg-[#061D23]/30 text-white/70 hover:border-[#4AEEFF]/50"
            }`}
          >
            <p className="text-sm font-black uppercase tracking-wider">
              Membership Requests
            </p>
            <p className="mt-2 text-xs">{membershipRequests.length} Pending</p>
          </button>
        )}

        {(isSuperAdmin || hasPermission("MANAGE_REGISTRATIONS")) && (
          <button
            type="button"
            onClick={() => setActiveTab("PAYMENT")}
            className={`rounded-xl border p-5 text-left transition-all duration-200 ${
              activeTab === "PAYMENT"
                ? "border-[#4AEEFF] bg-[#4AEEFF]/20 text-[#4AEEFF]"
                : "border-white/20 bg-[#061D23]/30 text-white/70 hover:border-[#4AEEFF]/50"
            }`}
          >
            <p className="text-sm font-black uppercase tracking-wider">
              Payment Verifications
            </p>
            <p className="mt-2 text-xs">
              {paymentProofRequests.length} Pending
            </p>
          </button>
        )}
      </div>

      {/* SUPER ADMIN: PENDING ADMIN ACCOUNT REQUESTS */}
      {isSuperAdmin && activeTab === "ADMIN" && (
        <section className="rounded-[16px] border border-amber-500/30 bg-[#061D23]/25 p-6 shadow-[0_25px_60px_-15px_rgba(245,158,11,0.2)] backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/20 p-2 text-amber-300 border border-amber-500/30">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black uppercase tracking-wider text-white">
                    Administrator Account Requests
                  </h2>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-black text-amber-300 border border-amber-500/30 font-mono">
                    SUPER ADMIN EXCLUSIVE
                  </span>
                </div>
                <p className="text-xs text-white/60">
                  Review and grant administrative roles to requested user
                  accounts
                </p>
              </div>
            </div>
            <span className="rounded-xl bg-[#061D23] px-3 py-1.5 text-xs font-mono font-bold text-amber-300 border border-amber-500/20">
              {adminRequests.length} Pending
            </span>
          </div>

          {adminRequestsLoading ? (
            <div className="py-8 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-400 mx-auto"></div>
              <p className="text-xs font-mono text-amber-300 mt-2">
                Loading admin requests...
              </p>
            </div>
          ) : adminRequests.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[#061D23]/40 p-8 text-center text-white/50 text-sm">
              No pending administrator requests at this time.
            </div>
          ) : (
            <div className="space-y-3">
              {adminRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#061D23]/60 p-4 transition-all hover:border-amber-500/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 font-bold text-amber-300 text-sm">
                      {req.firstName?.[0]?.toUpperCase()}
                      {req.lastName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">
                        {req.firstName} {req.lastName}
                      </p>
                      <p className="text-xs font-mono text-white/60">
                        {req.email}
                      </p>
                      <p className="text-[11px] text-white/40 font-mono mt-0.5">
                        Requested:{" "}
                        {new Date(req.adminRequestedAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => openAdminApproveModal(req)}
                      disabled={adminProcessingId === req.id}
                      className="rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 px-4 py-2 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      {adminProcessingId === req.id
                        ? "Approving..."
                        : "✓ Approve Admin"}
                    </button>
                    <button
                      onClick={() => openAdminRejectModal(req.id)}
                      disabled={adminProcessingId === req.id}
                      className="rounded-lg bg-red-500/15 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CLUB MEMBERSHIP REQUESTS MAIN CONTAINER */}
      {activeTab === "MEMBERSHIP" &&
        (isSuperAdmin || hasPermission("MANAGE_CLUB_MEMBERSHIPS")) && (
          <section className="rounded-[16px] border border-white/20 bg-[#061D23]/10 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-[#4AEEFF]/20 p-2 text-[#4AEEFF]">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold uppercase tracking-wider text-white">
                  Pending Membership Requests
                </h2>
                <p className="text-xs text-white/60">
                  Select individual or bulk options to process membership
                  requests
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
                  <span className="text-sm font-bold text-white">
                    Select All
                  </span>
                  <span className="text-xs text-white/60">
                    ({selectedMembershipIds.length} selected)
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleBulkApprove}
                    disabled={
                      selectedMembershipIds.length === 0 || bulkProcessing
                    }
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
                    disabled={
                      selectedMembershipIds.length === 0 || bulkProcessing
                    }
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
                            onChange={() =>
                              toggleMembershipSelection(request.id)
                            }
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
                                  {new Date(
                                    request.requestedAt,
                                  ).toLocaleString()}
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
                            onClick={() =>
                              openMembershipRejectModal(request.id)
                            }
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
        )}

      {/* PAYMENT PROOF REQUESTS */}
      {activeTab === "PAYMENT" &&
        (isSuperAdmin || hasPermission("MANAGE_REGISTRATIONS")) && (
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

            {/* PAYMENT VERIFICATION FILTERS */}
            <div className="mb-6 rounded-xl border border-white/10 bg-[#061D23]/40 p-4">
              <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-[#4AEEFF]">
                Filter Payment Verifications
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* MEMBERSHIP FILTER */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-white/70">
                    Membership
                  </label>
                  <GlassSelect
                    value={paymentMembershipFilter}
                    onChange={(e) =>
                      setPaymentMembershipFilter(
                        e.target.value as "ALL" | "CLUB" | "GUEST",
                      )
                    }
                    className="w-full"
                  >
                    <option value="ALL" className="bg-[#061D23] text-white">All Players</option>
                    <option value="CLUB" className="bg-[#061D23] text-white">Club Players</option>
                    <option value="GUEST" className="bg-[#061D23] text-white">Guest Players</option>
                  </GlassSelect>
                </div>

                {/* GENDER FILTER */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-white/70">
                    Gender
                  </label>
                  <GlassSelect
                    value={paymentGenderFilter}
                    onChange={(e) =>
                      setPaymentGenderFilter(
                        e.target.value as "ALL" | "MALE" | "FEMALE",
                      )
                    }
                    className="w-full"
                  >
                    <option value="ALL" className="bg-[#061D23] text-white">All Genders</option>
                    <option value="MALE" className="bg-[#061D23] text-white">Men</option>
                    <option value="FEMALE" className="bg-[#061D23] text-white">Women</option>
                  </GlassSelect>
                </div>

                {/* TOURNAMENT FILTER */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-white/70">
                    Tournament
                  </label>
                  <GlassSelect
                    value={paymentTournamentFilter}
                    onChange={(e) => setPaymentTournamentFilter(e.target.value)}
                    className="w-full"
                  >
                    <option value="ALL" className="bg-[#061D23] text-white">All Tournaments</option>
                    {paymentTournaments.map((tournament) => (
                      <option key={tournament.id} value={tournament.id} className="bg-[#061D23] text-white">
                        {tournament.name}
                      </option>
                    ))}
                  </GlassSelect>
                </div>

                {/* EVENT TYPE FILTER */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-white/70">
                    Event Type
                  </label>
                  <GlassSelect
                    value={paymentEventFilter}
                    onChange={(e) =>
                      setPaymentEventFilter(
                        e.target.value as
                          | "ALL"
                          | "SINGLES"
                          | "DOUBLES"
                          | "MIXED_DOUBLES",
                      )
                    }
                    className="w-full"
                  >
                    <option value="ALL" className="bg-[#061D23] text-white">All Events</option>
                    <option value="SINGLES" className="bg-[#061D23] text-white">Singles</option>
                    <option value="DOUBLES" className="bg-[#061D23] text-white">Doubles</option>
                    <option value="MIXED_DOUBLES" className="bg-[#061D23] text-white">Mixed Doubles</option>
                  </GlassSelect>
                </div>
              </div>

              {/* FILTER RESULTS AND RESET */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <p className="text-xs text-white/60">
                  Showing{" "}
                  <span className="font-bold text-[#4AEEFF]">
                    {filteredPaymentProofRequests.length}
                  </span>{" "}
                  of {paymentProofRequests.length} pending payment proofs
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMembershipFilter("ALL");
                    setPaymentGenderFilter("ALL");
                    setPaymentTournamentFilter("ALL");
                    setPaymentEventFilter("ALL");
                  }}
                  className="rounded-lg border border-[#4AEEFF]/40 px-4 py-2 text-xs font-bold text-[#4AEEFF] transition-colors hover:bg-[#4AEEFF]/10"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {paymentProofLoading ? (
              <div className="rounded-[12px] border border-white/10 bg-[#061D23]/40 p-12 text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-[#4AEEFF]" />

                <p className="text-xs font-black uppercase tracking-wider text-[#4AEEFF]">
                  Loading payment proofs...
                </p>
              </div>
            ) : filteredPaymentProofRequests.length === 0 ? (
              <div className="rounded-[12px] border border-white/10 bg-[#061D23]/40 p-12 text-center">
                <CheckCircleIcon className="mx-auto mb-3 h-10 w-10 text-emerald-400" />

                <h3 className="text-base font-bold uppercase tracking-wider text-white">
                  {paymentProofRequests.length === 0
                    ? "No Pending Payment Proofs"
                    : "No Payment Proofs Match Your Filters"}
                </h3>

                <p className="mt-2 text-xs text-white/60">
                  There are currently no payment proofs waiting for
                  verification.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPaymentProofRequests.map((proof) => {
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

                          {/* Categories - Individual Payment Verification */}
                          <div className="mt-4">
                            <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-white/40">
                              Registered Categories - Payment Verification
                            </p>

                            <div className="space-y-3">
                              {proof.registrations.map((registration) => {
                                const isCategoryProcessing =
                                  paymentProcessingId ===
                                  registration.verificationId;

                                return (
                                  <div
                                    key={registration.verificationId}
                                    className="rounded-lg border border-[#4AEEFF]/20 bg-[#061D23]/60 p-4"
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-sm font-bold text-white">
                                          {registration.category?.name ||
                                            "Unknown Category"}
                                        </p>

                                        <p className="mt-1 text-xs text-white/50">
                                          {registration.category?.type?.replace(
                                            /_/g,
                                            " ",
                                          )}
                                        </p>

                                        <p className="mt-2 text-xs font-bold text-amber-300">
                                          Payment:{" "}
                                          {registration.verificationStatus}
                                        </p>
                                      </div>

                                      {registration.verificationStatus ===
                                        "PENDING" && (
                                        <div className="flex flex-wrap gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handlePaymentApprove(
                                                proof.id,
                                                registration.verificationId,
                                              )
                                            }
                                            disabled={
                                              paymentProcessingId !== null
                                            }
                                            className="flex items-center gap-2 rounded-lg bg-[#4AEEFF] px-4 py-2 text-xs font-black uppercase text-[#061D23] hover:bg-white disabled:opacity-50"
                                          >
                                            <CheckCircleIcon className="h-4 w-4" />
                                            {isCategoryProcessing
                                              ? "Processing..."
                                              : "Approve"}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              openPaymentRejectModal(
                                                proof.id,
                                                registration.verificationId,
                                              )
                                            }
                                            disabled={
                                              paymentProcessingId !== null
                                            }
                                            className="flex items-center gap-2 rounded-lg border border-red-400/50 px-4 py-2 text-xs font-black uppercase text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                                          >
                                            <XCircleIcon className="h-4 w-4" />
                                            Reject
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

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
                  setSelectedPaymentVerificationId(null);
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

      {/* ADMIN REQUEST REJECT MODAL */}
      {showAdminRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#061D23]/95 p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-black uppercase tracking-wider text-white">
              Reject Admin Request
            </h3>
            <p className="text-xs text-white/70">
              Provide an optional reason explaining why this administrative
              access request is being rejected.
            </p>
            <textarea
              value={adminRejectionReason}
              onChange={(e) => setAdminRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (optional)..."
              rows={3}
              className="w-full rounded-xl border border-white/20 bg-[#061D23] p-3 text-sm text-white placeholder-white/30 focus:border-red-400 focus:outline-none"
            />
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAdminRejectModal(false);
                  setSelectedAdminId(null);
                  setAdminRejectionReason("");
                }}
                disabled={adminProcessingId !== null}
                className="flex-1 rounded-xl border border-white/20 py-2.5 text-xs font-black uppercase tracking-wider text-white/70 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectAdmin}
                disabled={adminProcessingId !== null}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
              >
                {adminProcessingId !== null ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE ADMIN WITH PERMISSIONS MODAL */}
      {adminToApprove && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-24 backdrop-blur-sm animate-fadeIn sm:pt-28">
          <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-[#061D23]/90 p-6 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="h-6 w-2.5 rounded-full bg-[#4AEEFF] shadow-[0_0_10px_#4AEEFF]" />
                <div>
                  <h3 className="text-xl font-black uppercase tracking-widest text-white sm:text-2xl">
                    Approve Admin Request
                  </h3>
                  <p className="text-xs text-emerald-300 font-mono mt-1">
                    Granting access to:{" "}
                    <span className="font-bold text-white">
                      {adminToApprove.firstName} {adminToApprove.lastName}
                    </span>{" "}
                    ({adminToApprove.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdminToApprove(null);
                  setSelectedPermissionsToGrant([]);
                }}
                disabled={adminProcessingId !== null}
                className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs text-white/80 uppercase tracking-wider font-bold">
                  Select module permissions to assign:
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllPermissions}
                    className="text-[11px] font-bold uppercase tracking-wider text-[#4AEEFF] hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-white/30 text-xs">|</span>
                  <button
                    type="button"
                    onClick={clearAllPermissions}
                    className="text-[11px] font-bold uppercase tracking-wider text-amber-400 hover:underline"
                  >
                    Clear All
                  </button>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-mono text-white/70 ml-1">
                    {selectedPermissionsToGrant.length} of{" "}
                    {AVAILABLE_ADMIN_PERMISSIONS.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {AVAILABLE_ADMIN_PERMISSIONS.map((perm) => {
                  const isChecked = selectedPermissionsToGrant.includes(
                    perm.id,
                  );
                  return (
                    <div
                      key={perm.id}
                      onClick={() => togglePermissionToGrant(perm.id)}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all ${
                        isChecked
                          ? "border-[#4AEEFF]/60 bg-[#4AEEFF]/10 text-white"
                          : "border-white/10 bg-[#061D23]/60 text-white/60 hover:border-[#4AEEFF]/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-white/20 bg-transparent accent-[#4AEEFF] focus:ring-0 focus:ring-offset-0"
                      />
                      <div>
                        <span className="font-bold text-sm block leading-tight text-white">
                          {perm.name}
                        </span>
                        <span className="text-xs text-white/50 block mt-0.5 font-mono">
                          {perm.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedPermissionsToGrant.length === 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  ⚠️ Note: No permissions selected. The user will be approved as
                  an ADMIN without module permissions until you grant
                  permissions in User Management.
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => {
                  setAdminToApprove(null);
                  setSelectedPermissionsToGrant([]);
                }}
                disabled={adminProcessingId !== null}
                className="flex-1 rounded-xl border border-white/20 py-2.5 text-xs font-black uppercase tracking-wider text-white/70 transition-all hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproveAdmin}
                disabled={adminProcessingId !== null}
                className="flex-1 rounded-xl bg-[#4AEEFF] py-2.5 text-xs font-black uppercase tracking-wider text-[#061D23] shadow-md shadow-[#4AEEFF]/20 transition-all hover:bg-white disabled:opacity-50"
              >
                {adminProcessingId !== null
                  ? "Approving & Saving..."
                  : "Confirm & Approve Admin"}
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
