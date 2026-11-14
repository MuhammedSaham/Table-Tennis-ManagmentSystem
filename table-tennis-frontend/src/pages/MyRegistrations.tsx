import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import BackButton from "../components/BackButton";
import ConfirmModal from "../components/ConfirmModal";
import {
  TrophyIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

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
  team?: {
    id: string;
    name: string;
    members?: Array<{
      player?: {
        firstName: string;
        lastName: string;
        email: string;
      };
    }>;
  } | null;
}

const MyRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalRegistration, setCancelModalRegistration] =
    useState<Registration | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "CANCELLED">(
    "ALL",
  );

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await api.get("/registrations/my-registrations");
      setRegistrations(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalRegistration) return;
    try {
      setIsCancelling(true);
      await api.delete(`/registrations/${cancelModalRegistration.id}/cancel`);
      toast.success("Registration cancelled successfully");
      setCancelModalRegistration(null);
      fetchRegistrations();
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsCancelling(false);
    }
  };

  const wrapInBaseLayout = (children: React.ReactNode) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
      {/* ─── BG.PNG FIXED FULL-BLEED BACKGROUND ─── */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      <div className="fixed inset-0 bg-[#061D23]/25 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35 pointer-events-none" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col space-y-6 px-4 sm:px-6 lg:px-10 xl:px-14 py-4 sm:py-6 lg:py-8">
        {children}
      </div>
    </div>
  );

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Approved Entry
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Pending Approval
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Rejected
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white/60 border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white/70 border border-white/20">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return wrapInBaseLayout(
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#4AEEFF]" />
        <div className="text-sm font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
          Loading your registrations...
        </div>
      </div>,
    );
  }

  const totalCount = registrations.length;
  const approvedCount = registrations.filter((r) => r.status === "APPROVED").length;
  const pendingCount = registrations.filter((r) => r.status === "PENDING").length;

  const filteredRegistrations = registrations.filter((r) => {
    if (filter === "ALL") return true;
    return r.status === filter;
  });

  return wrapInBaseLayout(
    <>
      {/* ─── HEADER MODULE ─── */}
      <header className="rounded-2xl border border-white/20 bg-[#061D23]/25 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <BackButton to="/app/dashboard" label="Back to Dashboard" className="mb-3" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">
            My Registrations
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-cyan-200/80 max-w-xl">
            Track your tournament entries, review category placements, and check approval statuses.
          </p>
        </div>

        <Link
          to="/app/tournaments"
          className="rounded-xl bg-[#4AEEFF] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#061D23] transition-all hover:bg-white shadow-md shadow-[#4AEEFF]/20 active:scale-95 flex items-center gap-2 self-start md:self-center shrink-0"
        >
          <SparklesIcon className="w-4 h-4" />
          <span>Browse Tournaments</span>
        </Link>
      </header>

      {/* ─── METRIC STATS STRIP ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-white/15 bg-[#061D23]/30 p-4 sm:p-5 shadow-lg backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
              Total Registrations
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">
              {totalCount}
            </p>
            <span className="text-[10px] text-[#4AEEFF] font-medium">Tournament Entries</span>
          </div>
          <div className="p-3 rounded-xl bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 text-[#4AEEFF]">
            <TrophyIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 shadow-lg backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 block">
              Approved Entries
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {approvedCount}
            </p>
            <span className="text-[10px] text-emerald-300/60 font-medium">Confirmed & Ready</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 shadow-lg backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/70 block">
              Pending Approval
            </span>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              {pendingCount}
            </p>
            <span className="text-[10px] text-amber-300/60 font-medium">Awaiting Admin Review</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <ClockIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── FILTER TABS ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "ALL", label: `All (${totalCount})` },
          { id: "APPROVED", label: `Approved (${approvedCount})` },
          { id: "PENDING", label: `Pending (${pendingCount})` },
          { id: "CANCELLED", label: `Cancelled (${registrations.filter((r) => r.status === "CANCELLED").length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
              filter === tab.id
                ? "bg-[#4AEEFF] text-[#061D23] shadow-md shadow-[#4AEEFF]/20"
                : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── REGISTRATIONS LIST ─── */}
      {filteredRegistrations.length === 0 ? (
        <div className="rounded-2xl border border-white/15 bg-[#061D23]/30 p-12 text-center backdrop-blur-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 text-[#4AEEFF] flex items-center justify-center mx-auto">
            <TrophyIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Tournament Registrations Found</h3>
            <p className="text-xs text-white/50 max-w-md mx-auto">
              {filter === "ALL"
                ? "You haven't registered for any tournaments yet. Explore open championships and register to start competing!"
                : `You don't have any registrations matching status "${filter}".`}
            </p>
          </div>
          <Link
            to="/app/tournaments"
            className="inline-flex items-center gap-2 rounded-xl bg-[#4AEEFF] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#061D23] transition-all hover:bg-white shadow-md shadow-[#4AEEFF]/20 active:scale-95"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Browse Tournaments</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((registration) => (
            <div
              key={registration.id}
              className="rounded-2xl border border-white/15 bg-[#061D23]/35 p-5 sm:p-6 shadow-[0_20px_50px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl transition-all hover:border-[#4AEEFF]/40 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/30 font-mono">
                      {registration.category?.type || "Singles"}
                    </span>
                    <span className="text-xs text-white/50 font-mono">
                      Registered: {new Date(registration.registeredAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  </div>
                  <Link to={`/app/tournaments/${registration.tournament.id}`}>
                    <h3 className="text-lg sm:text-xl font-heading font-black text-white hover:text-[#4AEEFF] transition-colors">
                      {registration.tournament.name}
                    </h3>
                  </Link>
                </div>
                <div>{renderStatusBadge(registration.status)}</div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
                  <TrophyIcon className="w-4 h-4 text-[#4AEEFF] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Category</p>
                    <p className="font-bold text-white text-xs mt-0.5 truncate">
                      {registration.category?.name || "Open Singles"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
                  <MapPinIcon className="w-4 h-4 text-[#4AEEFF] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Venue</p>
                    <p className="font-bold text-white text-xs mt-0.5 truncate">
                      {registration.tournament.venue || "Main Sports Hall"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
                  <CalendarIcon className="w-4 h-4 text-[#4AEEFF] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Tournament Date</p>
                    <p className="font-bold text-white text-xs mt-0.5">
                      {new Date(registration.tournament.startDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Doubles Partner Section (if team exists) */}
              {registration.team && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-xs">
                  <UserGroupIcon className="w-4 h-4 text-[#4AEEFF] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4AEEFF] block">
                      Doubles Team: {registration.team.name || "Doubles Pair"}
                    </span>
                    <p className="text-white font-medium text-xs truncate mt-0.5">
                      {registration.team.members && registration.team.members.length > 0
                        ? registration.team.members
                            .map(
                              (m: any) =>
                                `${m.player?.firstName || ""} ${m.player?.lastName || ""}`.trim(),
                            )
                            .filter(Boolean)
                            .join(" & ")
                        : "Team Registered"}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                <Link
                  to={`/app/tournaments/${registration.tournament.id}`}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#4AEEFF] hover:text-white transition-colors"
                >
                  <span>View Tournament Fixtures & Schedule</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>

                {registration.status === "PENDING" && (
                  <button
                    onClick={() => setCancelModalRegistration(registration)}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white px-3.5 py-1.5 text-xs font-bold text-rose-300 transition-all active:scale-95"
                  >
                    Cancel Registration
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Registration Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(cancelModalRegistration)}
        onClose={() => {
          if (!isCancelling) setCancelModalRegistration(null);
        }}
        onConfirm={handleConfirmCancel}
        title="Cancel Registration"
        message="Are you sure you want to cancel your tournament registration?"
        itemName={cancelModalRegistration?.tournament.name}
        itemBadge="PENDING"
        details="Your entry will be cancelled and your reserved slot will be released."
        confirmText="Yes, Cancel Registration"
        cancelText="Keep Registration"
        variant="warning"
        isLoading={isCancelling}
      />
    </>,
  );
};

export default MyRegistrations;
