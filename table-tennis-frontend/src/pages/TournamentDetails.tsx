import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { getProfileImageUrl } from "../services/api";
import toast from "react-hot-toast";
import CreateGroupsModal from "../components/CreateGroupsModal";
import GroupStandings from "../components/GroupStandings";
import RecordGroupScoreModal from "../components/RecordGroupScoreModal";
import KnockoutBracket from "../components/KnockoutBracket";
import GuestRegistrationModal from "../components/GuestRegistrationModal";
import { Link } from "react-router-dom";
import BackButton from "../components/BackButton";
import GlassSelect from "../components/GlassSelect";
import ConfirmModal from "../components/ConfirmModal";
import CreateKnockoutModal from "../components/CreateKnockoutModal";
import DoublesPartnerModal from "../components/DoublesPartnerModal";
import { getEffectiveTournamentStatus } from "../utils/tournamentStatus";
import {
  CalendarIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const capitalizeWords = (str: string): string => {
  if (!str) return "";
  return str
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const formatDivisionName = (name?: string) => {
  if (!name) return "";
  const cleaned = name
    .replace(/\bsiingle\b/gi, "Single")
    .replace(/\s+(double|doubles|single|singles)?\s*group\s*stages?/gi, "")
    .trim();
  const target = cleaned || name;
  return target
    .split(" ")
    .map((w) => {
      if (/^u-\d+$/i.test(w)) return w.toUpperCase();
      if (w.length <= 2 && w === w.toUpperCase()) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
};

const WinnerAvatar: React.FC<{
  image?: string;
  name: string;
  initials: string;
  sizeClass: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = ({
  image,
  name,
  initials,
  sizeClass,
  bgClass,
  textClass,
  borderClass,
}) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [image]);

  return (
    <div
      className={`${sizeClass} rounded-full ${bgClass} border ${borderClass} flex items-center justify-center ${textClass} font-bold shadow-inner relative overflow-hidden shrink-0 select-none`}
    >
      {image && !error ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

interface Category {
  id: string;
  name: string;
  type: string;
  maxParticipants: number;
  currentParticipants: number;
  minAge?: number;
  maxAge?: number;
  gender?: "MALE" | "FEMALE" | "MIXED";
  stageFormat?: "KNOCKOUT" | "GROUP_KNOCKOUT";
  _count?: {
    registrations: number;
  };
}

interface Match {
  id: string;
  round: string;
  matchNumber: number;
  scheduledTime: string;
  status: string;
  score?: string;
  player1: { firstName: string; lastName: string } | null;
  player2: { firstName: string; lastName: string } | null;
}

interface Registration {
  id: string;
  playerId: string;
  categoryId?: string;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  teamId?: string;
  team?: {
    id: string;
    name: string;
    members?: Array<{
      playerId: string;
      player?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    }>;
  } | null;
  category?: {
    id: string;
    name: string;
    type: string;
  };
  status: string;
  registeredAt: string;
}

interface PaymentProofInfo {
  paymentProofRequired: boolean;
  isClubMember: boolean;
  registrationFee: string | null;
  paymentInstructions: string | null;

  paymentProof: {
    id: string;
    proofUrl: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    submittedAt: string;
    verifiedAt: string | null;
    rejectionReason: string | null;
    registrationId: string | null;
    playerId: string | null;
  } | null;

  categoryPayments: Array<{
    verificationId: string;
    registrationId: string;
    categoryId: string;
    categoryName: string;
    categoryType: string;

    registrationStatus: string;
    paymentStatus: "PENDING" | "APPROVED" | "REJECTED";

    rejectionReason: string | null;
    verifiedAt: string | null;

    proofId: string | null;
    proofUrl: string | null;
    submittedAt: string | null;

    canResubmit: boolean;
  }>;
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: string;
  maxPlayers: number;
  tournamentType?: string;
  registrationFee?: string | number | null;
  requirePaymentProofClub?: boolean;
  requirePaymentProofGuest?: boolean;
  paymentInstructions?: string | null;
  categories: Category[];
  registrations: Registration[];
  matches?: Match[];
}

interface TournamentDetailsProps {
  registrationOnly?: boolean;
}

const TournamentDetails: React.FC<TournamentDetailsProps> = ({
  registrationOnly = false,
}) => {
  const { id } = useParams<{ id: string }>();
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRegistrationCategoryId, setSelectedRegistrationCategoryId] =
    useState<string>("");
  const [paymentProofInfo, setPaymentProofInfo] =
    useState<PaymentProofInfo | null>(null);

  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const [resubmitRegistrationId, setResubmitRegistrationId] = useState<
    string | null
  >(null);

  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [viewingDivisionDetail, setViewingDivisionDetail] = useState(true);
  const [divisionStageTab, setDivisionStageTab] = useState<
    "GROUPS" | "KNOCKOUT" | "CHAMPIONS"
  >("KNOCKOUT");
  const [registering, setRegistering] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [tournamentType, setTournamentType] = useState("KNOCKOUT");
  const activeCategory = tournament?.categories?.find(
    (c) => c.id === activeCategoryId,
  );
  const activeCategoryFormat =
    activeCategory?.stageFormat || tournamentType || "KNOCKOUT";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [activeCategoryId]);

  const handleSelectCategoryDetail = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    const cat = tournament?.categories?.find((c) => c.id === categoryId);
    const format = cat?.stageFormat || tournamentType || "KNOCKOUT";
    setDivisionStageTab(format === "GROUP_KNOCKOUT" ? "GROUPS" : "KNOCKOUT");
    setViewingDivisionDetail(true);
    fetchWinners(categoryId);
  };

  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [refreshGroups, setRefreshGroups] = useState(0);
  const [refreshKnockout, setRefreshKnockout] = useState(0);
  //const [creatingGroups, setCreatingGroups] = useState(false);
  const [_generatingMatches, setGeneratingMatches] = useState(false);
  const [playerAge, setPlayerAge] = useState<number | null>(null);
  const [playerGender, setPlayerGender] = useState<string | null>(null);
  const [winners, setWinners] = useState<{
    categoryId?: string;
    categoryName?: string;
    first: any;
    second: any;
    thirdPlace?: any;
    jointThird: any[];
  } | null>(null);
  const [showWinners, setShowWinners] = useState(false);
  const winnersRequestId = useRef(0);
  const animatedCategoriesRef = useRef<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    venue: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    maxPlayers: "",
    registrationFee: "",
    requirePaymentProofClub: false,
    requirePaymentProofGuest: false,
    paymentInstructions: "",
  });
  const [editCategories, setEditCategories] = useState<Category[]>([]);
  const [playerDirectory, setPlayerDirectory] = useState<any[]>([]);

  useEffect(() => {
    const fetchPlayerDirectory = async () => {
      try {
        const res = await api.get("/users/public/players");
        if (res.data?.data) {
          setPlayerDirectory(res.data.data);
        }
      } catch (err) {
        console.warn("Failed to load player directory", err);
      }
    };
    fetchPlayerDirectory();
  }, []);

  // Doubles Pairing States
  const [partnerModalCategory, setPartnerModalCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [myPendingInvites, setMyPendingInvites] = useState<any[]>([]);
  const [mySentInvites, setMySentInvites] = useState<any[]>([]);
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(
    null,
  );

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showKnockoutModal, setShowKnockoutModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [registrationToRemove, setRegistrationToRemove] =
    useState<Registration | null>(null);

  const [isRemovingRegistration, setIsRemovingRegistration] = useState(false);
  const [isDeletingTournament, setIsDeletingTournament] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [isCompletingTournament, setIsCompletingTournament] = useState(false);
  const [showIneligible, setShowIneligible] = useState(false);
  const [confirmDrawCategory, setConfirmDrawCategory] =
    useState<Category | null>(null);

  const fetchInvites = async () => {
    if (!user || user.role !== "PLAYER" || !id) return;
    try {
      const [receivedRes, sentRes] = await Promise.all([
        api.get("/teams/invites/my-invites"),
        api.get("/teams/invites/sent-invites"),
      ]);
      const allReceived = receivedRes.data.data || [];
      const allSent = sentRes.data.data || [];
      setMyPendingInvites(
        allReceived.filter((inv: any) => inv.tournament?.id === id),
      );
      setMySentInvites(allSent.filter((inv: any) => inv.tournament?.id === id));
    } catch (err) {
      console.error("Failed to fetch doubles invites", err);
    }
  };

  useEffect(() => {
    fetchTournamentDetails();
    fetchInvites();

    if (user?.role === "PLAYER") {
      fetchMyPaymentProof();
    }
  }, [id, user]);

  useEffect(() => {
    if (tournament?.categories?.length && !activeCategoryId) {
      const firstCat = tournament.categories[0];
      setActiveCategoryId(firstCat.id);
      const format = firstCat.stageFormat || tournamentType || "KNOCKOUT";
      setDivisionStageTab(format === "GROUP_KNOCKOUT" ? "GROUPS" : "KNOCKOUT");
      fetchWinners(firstCat.id);
    }
  }, [tournament?.categories, activeCategoryId]);

  useEffect(() => {
    if (activeCategoryId) {
      fetchWinners(activeCategoryId);
    } else {
      winnersRequestId.current++;
      setWinners(null);
    }

    return () => {
      winnersRequestId.current++;
    };
  }, [activeCategoryId, showWinners, tournament?.status, id]);

  useEffect(() => {
    if (
      divisionStageTab === "CHAMPIONS" &&
      activeCategoryId &&
      winners?.categoryId === activeCategoryId
    ) {
      if (!animatedCategoriesRef.current.has(activeCategoryId)) {
        animatedCategoriesRef.current.add(activeCategoryId);
      }
    }
  }, [divisionStageTab, activeCategoryId, winners?.categoryId]);

  const calculateAge = (dateOfBirth: string | Date): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const isPlayerEligibleForCategory = (
    category: Category,
    age: number | null,
    gender: string | null,
  ): { eligible: boolean; reason?: string } => {
    // Gender restriction check
    const effectiveGender =
      category.gender && category.gender !== "MIXED"
        ? category.gender
        : /\b(women|womens|woman|female|females|girl|girls|ladies|lady)\b/i.test(category.name)
          ? "FEMALE"
          : /\b(men|mens|man|male|males|boy|boys)\b/i.test(category.name) &&
            !/\b(women|womens|woman|female|females|girl|girls|ladies|lady)\b/i.test(category.name)
            ? "MALE"
            : null;

    if (effectiveGender) {
      if (gender && gender !== effectiveGender) {
        return {
          eligible: false,
          reason: effectiveGender === "MALE" ? "Men's only" : "Women's only",
        };
      }
    }

    // Age restriction check
    if (age !== null) {
      if (category.minAge && age < category.minAge) {
        return { eligible: false, reason: `Need ${category.minAge}+ years` };
      }
      if (category.maxAge && age > category.maxAge) {
        return { eligible: false, reason: `Under ${category.maxAge} only` };
      }
    }

    return { eligible: true };
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };
  const fetchMyPaymentProof = async () => {
    if (!id || user?.role !== "PLAYER") return;

    try {
      const response = await api.get(`/payment-proofs/my/${id}`);

      setPaymentProofInfo(response.data.data);
    } catch (error) {
      console.error("Failed to fetch payment proof status", error);
    }
  };
  const handlePaymentProofFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      setPaymentProofFile(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, JPEG, PNG and PDF files are allowed");
      e.target.value = "";
      setPaymentProofFile(null);
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("Payment proof must be 5MB or smaller");
      e.target.value = "";
      setPaymentProofFile(null);
      return;
    }

    setPaymentProofFile(file);
  };

  const handleUploadPaymentProof = async () => {
    if (!id) {
      toast.error("Tournament not found");
      return;
    }

    if (!paymentProofFile) {
      toast.error("Please select a payment proof file");
      return;
    }

    // Only rejected categories can receive a replacement receipt.
    if (resubmitRegistrationId) {
      const rejectedCategory = paymentProofInfo?.categoryPayments?.find(
        (category) =>
          category.registrationId === resubmitRegistrationId &&
          category.paymentStatus === "REJECTED" &&
          category.canResubmit,
      );

      if (!rejectedCategory) {
        toast.error("This category is not eligible for resubmission");
        return;
      }
    } else if (paymentProofInfo?.paymentProof) {
      toast.error("An initial receipt has already been submitted");
      return;
    }

    const formData = new FormData();

    // Must match the backend upload middleware field name.
    formData.append("proof", paymentProofFile);

    // Send registrationId only when replacing a rejected category receipt.
    if (resubmitRegistrationId) {
      formData.append("registrationId", resubmitRegistrationId);
    }

    setUploadingProof(true);

    try {
      await api.post(`/payment-proofs/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        resubmitRegistrationId
          ? "Replacement receipt submitted for the selected category"
          : "Payment receipt submitted for all registered categories",
      );

      setPaymentProofFile(null);
      setResubmitRegistrationId(null);

      await fetchMyPaymentProof();
      await fetchTournamentDetails();
    } catch (error: any) {
      console.error("Payment proof upload failed:", error);

      toast.error(
        error.response?.data?.message || "Failed to upload payment proof",
      );
    } finally {
      setUploadingProof(false);
    }
  };

  const fetchTournamentDetails = async () => {
    try {
      const response = await api.get(`/tournaments/${id}`);
      const tournamentData = response.data.data;

      if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
        const regResponse = await api.get(`/registrations/tournaments/${id}`);

        tournamentData.registrations = regResponse.data.data;
      }

      setTournament(tournamentData);
      setTournamentType(tournamentData?.tournamentType || "KNOCKOUT");

      const categories = tournamentData.categories || [];
      if (categories.length > 0) {
        setActiveCategoryId((prev) => {
          const exists = categories.some((c: any) => c.id === prev);
          return prev && exists ? prev : categories[0].id;
        });
      } else {
        setActiveCategoryId("");
      }

      // Set player age and gender if logged in as player
      if (user?.role === "PLAYER") {
        const profileResponse = await api.get("/users/profile");
        const profile = profileResponse.data.data.playerProfile;
        if (profile?.dateOfBirth) {
          setPlayerAge(calculateAge(profile.dateOfBirth));
        }
        if (profile?.gender) {
          setPlayerGender(profile.gender);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch tournament details");
      navigate("/tournaments");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    setRespondingInviteId(inviteId);

    try {
      await api.post(`/teams/invites/${inviteId}/accept`);

      toast.success("Doubles partner invite accepted! Registration updated.");

      // Refresh registration and payment information
      await fetchTournamentDetails();
      await fetchMyPaymentProof();
      await fetchInvites();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to accept invite");
    } finally {
      setRespondingInviteId(null);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    setRespondingInviteId(inviteId);
    try {
      await api.post(`/teams/invites/${inviteId}/decline`);
      toast.success("Doubles invite declined");
      await fetchInvites();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to decline invite");
    } finally {
      setRespondingInviteId(null);
    }
  };

  const handleCancelSentInvite = async (inviteId: string) => {
    try {
      await api.delete(`/teams/invites/${inviteId}/cancel`);
      toast.success("Invitation cancelled");
      await fetchInvites();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel invite");
    }
  };

  const handleRegister = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    // Check gender eligibility before proceeding
    for (const catId of selectedCategories) {
      const category = tournament?.categories.find((c) => c.id === catId);
      if (category) {
        const check = isPlayerEligibleForCategory(
          category,
          playerAge,
          playerGender,
        );
        if (!check.eligible) {
          toast.error(
            `You cannot register for ${category.name}: ${check.reason}`,
          );
          return;
        }
      }
    }

    setRegistering(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const categoryId of selectedCategories) {
        const category = tournament?.categories.find(
          (c) => c.id === categoryId,
        );

        try {
          // Register singles directly
          await api.post("/registrations", {
            tournamentId: id,
            categoryId: categoryId,
          });
          successCount++;
        } catch (err: any) {
          console.error(`Failed to register for category ${categoryId}:`, err);
          failCount++;
          const errorMsg = err.response?.data?.message || "Registration failed";
          toast.error(
            selectedCategories.length > 1
              ? `${category?.name}: ${errorMsg}`
              : errorMsg,
          );
        }
      }

      if (successCount > 0) {
        toast.success(
          `Registered for ${successCount} category(s) successfully!`,
        );
      }
      if (failCount > 1) {
        toast.error(`Failed to register for ${failCount} categories`);
      }

      await fetchTournamentDetails();
      await fetchMyPaymentProof();
      setSelectedCategories([]);
    } catch (error: any) {
      console.error("Registration error:", error);
    } finally {
      setRegistering(false);
    }
  };

  /*const handleCreateGroups = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select a category first");
      return;
    }
    if (creatingGroups) return;

    setCreatingGroups(true);
    const numGroups = prompt("How many groups? (e.g., 2, 4)", "2");
    if (!numGroups) {
      setCreatingGroups(false);
      return;
    }

    try {
      await api.post(
        `/groups/tournaments/${id}/categories/${activeCategoryId}/groups`,
        { numberOfGroups: parseInt(numGroups) },
      );
      toast.success("Groups created successfully!");
      setRefreshGroups((prev) => !prev);
      setShowGroupsModal(false);
      await fetchTournamentDetails();
    } catch (error) {
      console.error("Create groups error:", error);
      toast.error("Failed to create groups");
    } finally {
      setCreatingGroups(false);
    }
  };*/

  /* const handleRecordScores = () => {
    if (!activeCategoryId) {
      toast.error("Please select a category first");
      return;
    }
    setShowScoreModal(true);
  }; */

  const handleGenerateGroupMatches = async () => {
    if (!activeCategoryId) {
      toast.error("Please select a category first");
      return;
    }

    try {
      const response = await api.post(
        `/groups/tournaments/${id}/categories/${activeCategoryId}/group-matches`,
      );
      console.log("Generate matches response:", response.data);
      toast.success("Group matches generated!");
      setRefreshGroups((prev) => prev + 1);
      await fetchTournamentDetails();
    } catch (error) {
      toast.error("Failed to generate group matches");
    } finally {
      setGeneratingMatches(false);
    }
  };

  const handleResetKnockout = async () => {
    try {
      await api.delete(
        `/matches/tournaments/${id}/categories/${activeCategoryId}/knockout`,
      );
      toast.success("Knockout stage reset successfully");
      setRefreshKnockout((prev) => prev + 1);
      setRefreshGroups((prev) => prev + 1);
      fetchTournamentDetails();
    } catch (error) {
      toast.error("Failed to reset knockout stage");
    } finally {
      setShowResetConfirm(false);
    }
  };
  const handleRemoveRegistration = async () => {
    if (!registrationToRemove || isRemovingRegistration) return;

    setIsRemovingRegistration(true);

    try {
      await api.delete(
        `/registrations/${registrationToRemove.id}/admin-remove`,
      );

      toast.success("Registration removed successfully");

      setRegistrationToRemove(null);
      await fetchTournamentDetails();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to remove registration",
      );
    } finally {
      setIsRemovingRegistration(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeletingTournament(true);
      await api.delete(`/tournaments/${id}`);
      toast.success("Tournament deleted successfully");
      navigate(user ? "/app/tournaments" : "/tournaments");
    } catch (error) {
      toast.error("Failed to delete tournament");
      setIsDeletingTournament(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      setIsCompletingTournament(true);
      await api.patch(`/tournaments/${id}`, {
        status: "COMPLETED",
      });
      toast.success("Tournament marked as completed!");
      fetchTournamentDetails();
      setShowWinners(true);
      setShowCompleteConfirm(false);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsCompletingTournament(false);
    }
  };

  const handleGenerateBracket = async (categoryId: string) => {
    setGenerating(categoryId);
    try {
      await api.post(
        `/brackets/tournaments/${id}/categories/${categoryId}/generate`,
      );
      toast.success("Bracket generated successfully!");
      setConfirmDrawCategory(null);
      setRefreshKnockout((prev) => prev + 1);
      fetchTournamentDetails();
    } catch (error) {
      toast.error("Failed to generate bracket");
    } finally {
      setGenerating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      case "ONGOING":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "COMPLETED":
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
      case "CANCELLED":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getRegistrationStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "PENDING":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "REJECTED":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case "CANCELLED":
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getMatchParticipantDetails = (match: any, slot: 1 | 2) => {
    const isDoubles = !!(
      match.team1 ||
      match.team2 ||
      match.team1Id ||
      match.team2Id
    );
    if (isDoubles) {
      const team = slot === 1 ? match.team1 : match.team2;
      if (!team) return { name: "TBD", firstName: "TBD", lastName: "" };
      const memberNames = team.members
        ?.map((m: any) =>
          `${m.player?.firstName || ""} ${m.player?.lastName || ""}`.trim(),
        )
        .filter(Boolean);
      const displayName =
        memberNames && memberNames.length > 0
          ? memberNames.join(" / ")
          : team.name || "TBD";
      return {
        ...team,
        name: displayName,
        firstName: displayName,
        lastName: "",
      };
    } else {
      const player = slot === 1 ? match.player1 : match.player2;
      if (!player) return { name: "TBD", firstName: "TBD", lastName: "" };
      const displayName =
        `${player.firstName || ""} ${player.lastName || ""}`.trim() || "TBD";
      return {
        ...player,
        name: displayName,
        firstName: player.firstName || displayName,
        lastName: player.lastName || "",
      };
    }
  };

  const getPlayersFromParticipant = (
    participant: any,
    isDoubles: boolean,
  ): Array<{ id?: string; name: string; initials: string; image: string }> => {
    if (!participant) return [];

    const resolvePlayer = (raw: any, fallbackName: string) => {
      const p = raw?.player || raw || {};
      const firstName = p.firstName || "";
      const lastName = p.lastName || "";
      let fullName =
        `${firstName} ${lastName}`.trim() ||
        p.name ||
        fallbackName.trim() ||
        "Player";
      fullName = capitalizeWords(fullName);

      // Match in playerDirectory for id or image if missing
      const dirMatch = playerDirectory.find((dp: any) => {
        if (p.id && dp.id === p.id) return true;
        if (p.playerId && dp.id === p.playerId) return true;
        const dpFullName = `${dp.firstName || ""} ${dp.lastName || ""}`
          .trim()
          .toLowerCase();
        return dpFullName && dpFullName === fullName.toLowerCase();
      });

      const finalId = p.id || p.playerId || dirMatch?.id;
      const rawImage = p.profileImage || dirMatch?.profileImage || "";
      const image = getProfileImageUrl(rawImage);

      const words = fullName.split(" ").filter(Boolean);
      const initials =
        words.length > 1
          ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
          : words[0]?.slice(0, 2).toUpperCase() || "?";

      return {
        id: finalId,
        name: fullName,
        initials,
        image,
      };
    };

    // Check if participant has members (doubles team)
    if (isDoubles || (participant.members && participant.members.length > 0)) {
      if (participant.members && participant.members.length > 0) {
        return participant.members.map((m: any) =>
          resolvePlayer(m, m.name || m.playerName || ""),
        );
      }

      // If members array not directly present, check if name has " / " or " & "
      if (
        participant.name &&
        (participant.name.includes(" / ") || participant.name.includes(" & "))
      ) {
        const parts = participant.name.split(/\s*[\/&]\s*/);
        return parts.map((namePart: string) => resolvePlayer(null, namePart));
      }
    }

    // Singles player or single fallback
    return [resolvePlayer(participant, participant.name || "")];
  };

  const TrophyOutlineIcon = ({
    className = "w-10 h-10",
  }: {
    className?: string;
  }) => (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M15 8H33V22C33 26.9706 28.9706 31 24 31C19.0294 31 15 26.9706 15 22V8Z"
        stroke="#D97706"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12H10C8.34315 12 7 13.3431 7 15V17C7 19.7614 9.23858 22 12 22H15"
        stroke="#D97706"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M33 12H38C39.6569 12 41 13.3431 41 15V17C41 19.7614 38.7614 22 36 22H33"
        stroke="#D97706"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 31V38"
        stroke="#D97706"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 38H31"
        stroke="#D97706"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 42H34"
        stroke="#D97706"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const SilverMedalIcon = ({
    className = "w-9 h-9",
  }: {
    className?: string;
  }) => (
    <svg
      viewBox="0 0 40 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M13 3L17 17H23L27 3"
        stroke="#94A3B8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 3L18.5 10"
        stroke="#CBD5E1"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M23.5 3L21.5 10"
        stroke="#CBD5E1"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="20"
        cy="28"
        r="12"
        stroke="#94A3B8"
        strokeWidth="2"
        fill="#F8FAFC"
      />
      <circle
        cx="20"
        cy="28"
        r="9.5"
        stroke="#CBD5E1"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <text
        x="20"
        y="32.5"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="#64748B"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        2
      </text>
    </svg>
  );

  const BronzeMedalIcon = ({
    className = "w-9 h-9",
  }: {
    className?: string;
  }) => (
    <svg
      viewBox="0 0 40 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M13 3L17 17H23L27 3"
        stroke="#C2410C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 3L18.5 10"
        stroke="#EA580C"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M23.5 3L21.5 10"
        stroke="#EA580C"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="20"
        cy="28"
        r="12"
        stroke="#C2410C"
        strokeWidth="2"
        fill="#FFF7ED"
      />
      <circle
        cx="20"
        cy="28"
        r="9.5"
        stroke="#FDBA74"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <text
        x="20"
        y="32.5"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="#C2410C"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        3
      </text>
    </svg>
  );

  const fetchWinners = async (categoryIdToFetch?: string) => {
    const targetCategoryId =
      categoryIdToFetch || activeCategoryId || tournament?.categories?.[0]?.id;

    if (!targetCategoryId) {
      return;
    }

    // Each new request invalidates earlier requests.
    const requestId = ++winnersRequestId.current;

    // Clear winners from the previously selected category.
    setWinners(null);

    const currentCat = tournament?.categories?.find(
      (c) => c.id === targetCategoryId,
    );

    try {
      const matchesResponse = await api.get(
        `/matches/tournaments/${id}?categoryId=${targetCategoryId}`,
      );

      // Ignore responses from an older category request.
      if (requestId !== winnersRequestId.current) return;

      let allMatches = matchesResponse.data.data || [];

      try {
        const playersResponse = await api.get("/users/public/players");
        const profileImages = new Map<string, string>();

        for (const player of playersResponse.data.data || []) {
          if (player.id && player.profileImage) {
            profileImages.set(player.id, player.profileImage);
          }

          if (import.meta.env.DEV) {
            console.debug("[Champions] public player profile", {
              playerId: player.id,
              receivedPath: player.profileImage || null,
              matched: Boolean(player.id && player.profileImage),
            });
          }
        }

        allMatches = allMatches.map((match: any) => ({
          ...match,
          player1: match.player1
            ? {
                ...match.player1,
                profileImage:
                  match.player1.profileImage ||
                  profileImages.get(match.player1.id),
              }
            : match.player1,
          player2: match.player2
            ? {
                ...match.player2,
                profileImage:
                  match.player2.profileImage ||
                  profileImages.get(match.player2.id),
              }
            : match.player2,
          team1: match.team1
            ? {
                ...match.team1,
                members: (match.team1.members || []).map((member: any) => ({
                  ...member,
                  player: member.player
                    ? {
                        ...member.player,
                        profileImage:
                          member.player.profileImage ||
                          profileImages.get(member.player.id),
                      }
                    : member.player,
                })),
              }
            : match.team1,
          team2: match.team2
            ? {
                ...match.team2,
                members: (match.team2.members || []).map((member: any) => ({
                  ...member,
                  player: member.player
                    ? {
                        ...member.player,
                        profileImage:
                          member.player.profileImage ||
                          profileImages.get(member.player.id),
                      }
                    : member.player,
                })),
              }
            : match.team2,
        }));

        if (import.meta.env.DEV) {
          console.debug(
            "[Champions] enriched match participants",
            allMatches
              .filter((match: any) =>
                ["Final", "Finals", "Semi-Finals", "Semifinals"].includes(
                  match.round,
                ),
              )
              .map((match: any) => ({
                round: match.round,
                players: [match.player1, match.player2]
                  .filter(Boolean)
                  .map((player: any) => ({
                    playerId: player.id,
                    receivedPath: player.profileImage || null,
                    matched: Boolean(player.profileImage),
                  })),
              })),
          );
        }
      } catch (profileError) {
        console.warn(
          "Unable to enrich tournament winners with profile images",
          profileError,
        );
      }

      const isSemiFinal = (round: string) => {
        const norm = (round || "").toLowerCase().replace(/[^a-z]/g, "");

        return norm === "semifinals" || norm === "semifinal";
      };

      const isFinal = (round: string) => {
        const norm = (round || "").toLowerCase().replace(/[^a-z]/g, "");

        return norm === "final" || norm === "finals";
      };

      const finalMatch = allMatches.find((match: any) => isFinal(match.round));

      let champion = null;
      let runnerUp = null;
      const jointThird: any[] = [];

      const resolveMatchWinners = (match: any) => {
        if (!match || !["COMPLETED", "WALKOVER"].includes(match.status)) {
          return { winner: null, loser: null };
        }

        const isDoubles =
          currentCat?.type === "DOUBLES" ||
          currentCat?.type === "MIXED_DOUBLES" ||
          Boolean(match.team1Id || match.team2Id);

        const winnerId = isDoubles
          ? (match.winnerTeamId ?? match.winnerId)
          : match.winnerId;

        if (!winnerId) {
          return { winner: null, loser: null };
        }

        const slot1Id = isDoubles
          ? (match.team1Id ?? match.team1?.id)
          : (match.player1Id ?? match.player1?.id);

        const slot2Id = isDoubles
          ? (match.team2Id ?? match.team2?.id)
          : (match.player2Id ?? match.player2?.id);

        const isSlot1Winner =
          winnerId === slot1Id ||
          (isDoubles &&
            match.team1?.members?.some(
              (member: any) =>
                member.playerId === winnerId || member.player?.id === winnerId,
            ));

        const isSlot2Winner =
          winnerId === slot2Id ||
          (isDoubles &&
            match.team2?.members?.some(
              (member: any) =>
                member.playerId === winnerId || member.player?.id === winnerId,
            ));

        if (isSlot1Winner === isSlot2Winner) {
          return { winner: null, loser: null };
        }

        return {
          winner: getMatchParticipantDetails(match, isSlot1Winner ? 1 : 2),
          loser: getMatchParticipantDetails(match, isSlot1Winner ? 2 : 1),
        };
      };

      if (finalMatch) {
        const { winner, loser } = resolveMatchWinners(finalMatch);

        champion = winner;
        runnerUp = loser;
      }

      const isThirdPlaceMatch = (round: string) => {
        const norm = (round || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return norm.includes("third") || norm.includes("3rd");
      };

      const thirdPlaceMatch = allMatches.find(
        (match: any) =>
          isThirdPlaceMatch(match.round) &&
          ["COMPLETED", "WALKOVER"].includes(match.status),
      );

      let thirdPlaceWinner = null;
      if (thirdPlaceMatch) {
        const { winner } = resolveMatchWinners(thirdPlaceMatch);
        thirdPlaceWinner = winner;
      }

      const semifinalMatches = allMatches.filter(
        (match: any) =>
          isSemiFinal(match.round) &&
          ["COMPLETED", "WALKOVER"].includes(match.status),
      );

      for (const match of semifinalMatches) {
        const { winner, loser } = resolveMatchWinners(match);

        if (winner && loser && loser.name !== "TBD") {
          jointThird.push(loser);
        }
      }

      if (requestId !== winnersRequestId.current) return;

      setWinners({
        categoryId: targetCategoryId,
        categoryName: currentCat?.name || "Category",
        first: champion,
        second: runnerUp,
        thirdPlace: thirdPlaceWinner,
        jointThird: jointThird,
      });
    } catch (error) {
      if (requestId !== winnersRequestId.current) return;

      console.error("Failed to fetch winners", error);
      setWinners(null);
      toast.error("Failed to fetch tournament winners");
    }
  };

  // Add category to edit
  const addEditCategory = () => {
    setEditCategories([
      ...editCategories,
      {
        id: `temp-${Date.now()}`,
        name: "",
        type: "SINGLES",
        maxParticipants: 32,
        currentParticipants: 0,
        stageFormat: (tournament?.tournamentType as any) || "KNOCKOUT",
        minAge: undefined,
        maxAge: undefined,
      },
    ]);
  };

  // Remove category from edit
  const removeEditCategory = (index: number) => {
    const newCategories = [...editCategories];
    newCategories.splice(index, 1);
    setEditCategories(newCategories);
  };

  // Update category in edit
  const updateEditCategory = (
    index: number,
    field: keyof Category,
    value: any,
  ) => {
    const newCategories = [...editCategories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setEditCategories(newCategories);
  };

  const handleUpdateTournament = async () => {
    const paymentProofRequired =
      editFormData.requirePaymentProofClub ||
      editFormData.requirePaymentProofGuest;

    if (paymentProofRequired) {
      const fee = Number(editFormData.registrationFee);
      if (!editFormData.registrationFee || fee <= 0) {
        toast.error(
          "Please enter a registration fee when payment proof is required",
        );
        return;
      }
    }

    try {
      await api.patch(`/tournaments/${id}`, {
        name: editFormData.name,
        description: editFormData.description,
        venue: editFormData.venue,
        startDate: new Date(editFormData.startDate).toISOString(),
        endDate: new Date(editFormData.endDate).toISOString(),
        registrationDeadline: new Date(
          editFormData.registrationDeadline,
        ).toISOString(),
        maxPlayers: editFormData.maxPlayers
          ? parseInt(editFormData.maxPlayers)
          : null,
        registrationFee: editFormData.registrationFee
          ? parseFloat(editFormData.registrationFee)
          : null,
        requirePaymentProofClub: editFormData.requirePaymentProofClub,
        requirePaymentProofGuest: editFormData.requirePaymentProofGuest,
        paymentInstructions: editFormData.paymentInstructions || null,
      });
      // Get existing categories from backend
      const existingCategories = await api.get(`/tournaments/${id}/categories`);
      const existingIds = existingCategories.data.data.map((c: any) => c.id);

      // Create new categories and update existing ones
      for (const category of editCategories) {
        if (category.id.startsWith("temp-")) {
          // This is a new category - create it
          await api.post(`/tournaments/${id}/categories`, {
            name: category.name,
            type: category.type,
            stageFormat: category.stageFormat || "KNOCKOUT",
            minAge: category.minAge,
            maxAge: category.maxAge,
            gender: category.gender,
            maxParticipants: category.maxParticipants,
          });
        } else if (existingIds.includes(category.id)) {
          // This is an existing category - update it
          await api.patch(`/tournaments/categories/${category.id}`, {
            name: category.name,
            type: category.type,
            stageFormat: category.stageFormat || "KNOCKOUT",
            minAge: category.minAge,
            maxAge: category.maxAge,
            gender: category.gender,
            maxParticipants: category.maxParticipants,
          });
        }
      }

      // Delete categories that were removed
      const currentIds = editCategories.map((c) => c.id);
      const categoriesToDelete = existingIds.filter(
        (id: string) => !currentIds.includes(id),
      );

      for (const categoryId of categoriesToDelete) {
        await api.delete(`/tournaments/categories/${categoryId}`);
      }

      toast.success("Tournament updated successfully!");
      setShowEditModal(false);
      fetchTournamentDetails();
    } catch (error) {
      toast.error("Failed to update tournament");
    }
  };

  const wrapInBaseLayout = (children: React.ReactNode) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
      {/* ─── BG.PNG FIXED FULL-BLEED BACKGROUND ─── */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      {/* Light overlay for text legibility */}
      <div className="fixed inset-0 bg-[#061D23]/25" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col space-y-5 sm:space-y-6 px-3.5 py-4 sm:px-6 sm:py-8 lg:px-10 xl:px-14">
        {children}
      </div>
    </div>
  );

  if (!id) {
    return wrapInBaseLayout(
      <div className="flex flex-col items-center justify-center rounded-[16px] border border-white/20 bg-[#061D23]/25 p-12 text-center backdrop-blur-xl">
        <h2 className="text-xl font-black uppercase tracking-wider text-white">
          Invalid Tournament ID
        </h2>
      </div>,
    );
  }

  if (loading) {
    return wrapInBaseLayout(
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-white/20 border-t-[#4AEEFF] rounded-full animate-spin" />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
          Loading tournament details...
        </p>
      </div>,
    );
  }

  if (!tournament) {
    return wrapInBaseLayout(
      <div className="flex flex-col items-center justify-center rounded-[16px] border border-white/20 bg-[#061D23]/25 p-12 text-center backdrop-blur-xl">
        <h2 className="text-xl font-black uppercase tracking-wider text-white">
          Tournament not found
        </h2>
      </div>,
    );
  }

  const effectiveStatus = getEffectiveTournamentStatus(tournament);
  const isRegistrationOpen =
    effectiveStatus === "UPCOMING" &&
    new Date() < new Date(tournament.registrationDeadline);
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.isSuperAdmin;
  const canManageTournaments =
    isSuperAdmin || hasPermission("MANAGE_TOURNAMENTS");
  const canManageMatches = isSuperAdmin || hasPermission("MANAGE_MATCHES");
  const canManageRegistrations =
    isSuperAdmin || hasPermission("MANAGE_REGISTRATIONS");
  const canManageResults = isSuperAdmin || hasPermission("MANAGE_RESULTS");
  const isPlayer = user?.role === "PLAYER";
  const isAdmin = isSuperAdmin || user?.role === "ADMIN";
  const isReferee = user?.role === "REFEREE";

  const userRegistrations =
    tournament.registrations?.filter(
      (r) =>
        r.playerId === user?.id ||
        r.team?.members?.some(
          (m) => m.playerId === user?.id || m.player?.id === user?.id,
        ),
    ) || [];
  const hasRegistration = userRegistrations.length > 0;
  const canRegister = isPlayer && isRegistrationOpen;

  const registrationCategoryId =
    selectedRegistrationCategoryId &&
    tournament.categories.some(
      (category) => category.id === selectedRegistrationCategoryId,
    )
      ? selectedRegistrationCategoryId
      : tournament.categories[0]?.id || "";

  const activeRegistrations = (tournament.registrations || []).filter(
    (registration) => registration.status !== "CANCELLED",
  );

  const filteredRegistrations = activeRegistrations.filter(
    (registration) =>
      (registration.categoryId || registration.category?.id) ===
      registrationCategoryId,
  );

  // Function to check if category is doubles
  const isDoublesCategory = (categoryType: string) => {
    return (
      categoryType === "DOUBLES" ||
      categoryType === "MIXED" ||
      categoryType === "MIXED_DOUBLES"
    );
  };

  const eligibleCategories = tournament.categories.filter(
    (c) => isPlayerEligibleForCategory(c, playerAge, playerGender).eligible,
  );
  const ineligibleCategories = tournament.categories.filter(
    (c) => !isPlayerEligibleForCategory(c, playerAge, playerGender).eligible,
  );

  const eligibleSinglesCategories = eligibleCategories.filter(
    (cat) =>
      !isDoublesCategory(cat.type) &&
      !userRegistrations.some(
        (r) => r.categoryId === cat.id || r.category?.id === cat.id,
      ),
  );

  const allEligibleRegistered =
    eligibleCategories.length > 0 &&
    eligibleCategories.every((cat) =>
      userRegistrations.some(
        (r) => r.categoryId === cat.id || r.category?.id === cat.id,
      ),
    );

  const formatTournamentDateRange = (startStr: string, endStr: string) => {
    if (!startStr) return "";
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : null;
    if (isNaN(start.getTime())) return "";
    if (!end || isNaN(end.getTime())) {
      return start.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.toLocaleDateString("en-GB", { month: "short" });
    const endMonth = end.toLocaleDateString("en-GB", { month: "short" });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (
      startDay === endDay &&
      startMonth === endMonth &&
      startYear === endYear
    ) {
      return `${startDay} ${startMonth} ${startYear}`;
    }
    if (startMonth === endMonth && startYear === endYear) {
      return `${startDay} – ${endDay} ${startMonth} ${startYear}`;
    }
    if (startYear === endYear) {
      return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`;
    }
    return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`;
  };

  const formatDeadline = (deadlineStr: string) => {
    if (!deadlineStr) return "";
    const date = new Date(deadlineStr);
    if (isNaN(date.getTime())) return "";
    return `Closes ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  const formatAgeEligibility = (
    minAge?: number | null,
    maxAge?: number | null,
  ) => {
    if (minAge && maxAge) {
      return `Ages ${minAge}–${maxAge}`;
    }
    if (minAge && !maxAge) {
      return `Ages ${minAge}+`;
    }
    if (!minAge && maxAge) {
      return `Under ${maxAge}`;
    }
    return "All Ages";
  };

  return wrapInBaseLayout(
    <>
      {!registrationOnly && (
        <>
          {/* Tournament Hero Header - Glass Card Module */}
          <header className="rounded-2xl border border-white/20 bg-[#061D23]/20 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
              {/* LEFT SIDE: Back Link + Title + Tournament Details Info Strip */}
              <div className="space-y-2.5 min-w-0">
                <BackButton
                  to="/tournaments"
                  label="Back to Tournaments"
                  className="mb-1"
                />

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wider text-white leading-tight">
                  {tournament.name}
                </h1>

                {/* Tournament Details Info Strip (Venue, Dates, Reg. Deadline) */}
                <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2 text-xs sm:text-sm">
                  {/* Venue */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[#4AEEFF] font-bold flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                      </svg>
                      <span className="text-white/60 font-medium">Venue:</span>
                    </span>
                    <span className="font-semibold text-white">
                      {tournament.venue}
                    </span>
                  </div>

                  <span className="text-white/20 select-none">•</span>

                  {/* Dates */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[#4AEEFF] font-bold flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                        />
                      </svg>
                      <span className="text-white/60 font-medium">Dates:</span>
                    </span>
                    <span className="font-semibold text-white">
                      {formatTournamentDateRange(
                        tournament.startDate,
                        tournament.endDate,
                      )}
                    </span>
                  </div>

                  <span className="text-white/20 select-none">•</span>

                  {/* Deadline */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[#4AEEFF] font-bold flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-white/60 font-medium">Reg:</span>
                    </span>
                    <span className="font-semibold text-white">
                      {formatDeadline(tournament.registrationDeadline)}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: Status Badge + Admin Buttons + Category Dropdown */}
              <div className="flex flex-col sm:items-end gap-3 shrink-0">
                {/* Status & Admin Action Buttons */}
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Player Registration Status & Action Button */}
                  {isPlayer && tournament.categories.length > 0 && (
                    <>
                      {hasRegistration ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/app/tournaments/${id}/register`)
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-500/25 transition-all active:scale-95 group"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>
                            {userRegistrations.some(
                              (r) => r.status === "APPROVED",
                            )
                              ? "✓ Enrolled (Approved)"
                              : userRegistrations.some(
                                    (r) => r.status === "PENDING",
                                  )
                                ? "⏳ Entry Pending"
                                : "✓ View Entry Pass"}
                          </span>
                        </button>
                      ) : isRegistrationOpen ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/app/tournaments/${id}/register`)
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4AEEFF] to-[#00b4d8] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#061D23] shadow-lg shadow-[#4AEEFF]/25 transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5 active:scale-95"
                        >
                          <span>Register Now →</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-bold font-mono">
                          Registration Closed
                        </span>
                      )}
                    </>
                  )}
                  <span
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border shadow-sm ${getStatusColor(effectiveStatus)}`}
                  >
                    {effectiveStatus}
                  </span>
                  {canManageTournaments && (
                    <>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-red-300 hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                      >
                        Delete Tournament
                      </button>
                      <button
                        onClick={() => {
                          setEditFormData({
                            name: tournament.name,
                            description: tournament.description || "",
                            venue: tournament.venue,
                            startDate: tournament.startDate.slice(0, 16),
                            endDate: tournament.endDate.slice(0, 16),
                            registrationDeadline:
                              tournament.registrationDeadline.slice(0, 16),
                            maxPlayers: tournament.maxPlayers?.toString() || "",
                            registrationFee:
                              tournament.registrationFee?.toString() || "",
                            requirePaymentProofClub:
                              tournament.requirePaymentProofClub ?? false,
                            requirePaymentProofGuest:
                              tournament.requirePaymentProofGuest ?? false,
                            paymentInstructions:
                              tournament.paymentInstructions || "",
                          });
                          setEditCategories(
                            tournament.categories?.map((c) => ({
                              ...c,
                            })) || [],
                          );
                          setShowEditModal(true);
                        }}
                        className="rounded-lg border border-[#4AEEFF]/40 bg-[#4AEEFF]/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#4AEEFF] hover:bg-[#4AEEFF] hover:text-[#061D23] transition-colors shadow-sm"
                      >
                        Edit Tournament
                      </button>

                      {tournament.status !== "COMPLETED" && (
                        <button
                          onClick={() => setShowCompleteConfirm(true)}
                          className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300 hover:bg-emerald-500 hover:text-[#061D23] transition-colors shadow-sm"
                        >
                          Mark Complete
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Category Dropdown */}
                {tournament.categories.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#4AEEFF]">
                      Category:
                    </span>
                    <GlassSelect
                      value={activeCategoryId}
                      onChange={(e) =>
                        handleSelectCategoryDetail(e.target.value)
                      }
                      aria-label="Select Category"
                    >
                      {tournament.categories.map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          className="bg-[#061D23] text-white"
                        >
                          {formatDivisionName(c.name)} (
                          {c.type === "DOUBLES" || c.type === "MIXED_DOUBLES"
                            ? "Doubles"
                            : "Singles"}
                          )
                        </option>
                      ))}
                    </GlassSelect>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Incoming Partner Invites Alert Banner */}
          {myPendingInvites.length > 0 && (
            <div className="rounded-[18px] border border-cyan-500/40 bg-gradient-to-r from-[#0b2b36] via-[#08242c] to-[#061D23] p-5 sm:p-6 shadow-[0_12px_40px_-10px_rgba(74,238,255,0.3)] backdrop-blur-xl animate-in fade-in">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-black uppercase tracking-widest text-[#4AEEFF]">
                  ⚡ Action Required • Doubles Partner Invitations (
                  {myPendingInvites.length})
                </span>
              </div>
              <div className="space-y-3">
                {myPendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-cyan-500/25"
                  >
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                        <span className="text-[#4AEEFF] font-black text-base">
                          {inv.inviter?.firstName} {inv.inviter?.lastName}
                        </span>
                        <span>invited you to partner with them!</span>
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        Tournament Division:{" "}
                        <span className="text-white font-bold">
                          {inv.category?.name}
                        </span>{" "}
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-cyan-200 ml-1">
                          {inv.category?.type}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 self-end sm:self-auto flex-shrink-0">
                      <button
                        onClick={() => handleAcceptInvite(inv.id)}
                        disabled={respondingInviteId === inv.id}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_4px_14px_rgba(74,238,255,0.35)] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {respondingInviteId === inv.id
                          ? "Enrolling..."
                          : "✓ Accept & Confirm Team"}
                      </button>
                      <button
                        onClick={() => handleDeclineInvite(inv.id)}
                        disabled={respondingInviteId === inv.id}
                        className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Tournament Modal */}
          {showEditModal &&
            createPortal(
              <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
                <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-2xl border border-[#4AEEFF]/40 bg-[#061D23]/95 p-6 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-8 my-auto">
                  <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-2.5 rounded-full bg-[#4AEEFF] shadow-[0_0_10px_#4AEEFF]" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-white sm:text-2xl">
                      Edit Tournament
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-white/70">
                        Tournament Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            name: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 transition focus:border-[#4AEEFF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-white/70">
                        Venue
                      </label>
                      <input
                        type="text"
                        value={editFormData.venue}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            venue: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 transition focus:border-[#4AEEFF] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-white/70">
                      Description
                    </label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 transition focus:border-[#4AEEFF] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-white/70">
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={editFormData.startDate}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 [color-scheme:dark] transition focus:border-[#4AEEFF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-white/70">
                        End Date
                      </label>
                      <input
                        type="datetime-local"
                        value={editFormData.endDate}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            endDate: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 [color-scheme:dark] transition focus:border-[#4AEEFF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-white/70">
                        Registration Deadline
                      </label>
                      <input
                        type="datetime-local"
                        value={editFormData.registrationDeadline}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            registrationDeadline: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 [color-scheme:dark] transition focus:border-[#4AEEFF] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-white/70">
                      Max Players (Optional)
                    </label>
                    <input
                      type="number"
                      value={editFormData.maxPlayers}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          maxPlayers: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 transition focus:border-[#4AEEFF] focus:outline-none"
                      min="2"
                    />
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-5">
                    <h3 className="text-base font-black uppercase tracking-wider text-white">
                      Payment & Registration
                    </h3>
                    <p className="mt-1 text-xs text-white/50">
                      Configure registration fees and payment proof
                      requirements.
                    </p>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-white/70">
                          Registration Fee (LKR)
                        </label>
                        <input
                          type="number"
                          value={editFormData.registrationFee}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              registrationFee: e.target.value,
                            })
                          }
                          min="0"
                          step="0.01"
                          className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 transition focus:border-[#4AEEFF] focus:outline-none"
                          placeholder="Leave empty if no payment is required"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-white/70">
                          Require Payment Proof From
                        </label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-[#061D23]/40 p-4 transition-colors hover:border-[#4AEEFF]/40">
                            <input
                              type="checkbox"
                              checked={editFormData.requirePaymentProofClub}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  requirePaymentProofClub: e.target.checked,
                                })
                              }
                              className="h-4 w-4 accent-[#4AEEFF]"
                            />
                            <div>
                              <p className="text-sm font-bold text-white">
                                Club Players
                              </p>
                              <p className="text-xs text-white/50">
                                Club members must upload payment proof
                              </p>
                            </div>
                          </label>

                          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-[#061D23]/40 p-4 transition-colors hover:border-[#4AEEFF]/40">
                            <input
                              type="checkbox"
                              checked={editFormData.requirePaymentProofGuest}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  requirePaymentProofGuest: e.target.checked,
                                })
                              }
                              className="h-4 w-4 accent-[#4AEEFF]"
                            />
                            <div>
                              <p className="text-sm font-bold text-white">
                                Guest Players
                              </p>
                              <p className="text-xs text-white/50">
                                Guest players must upload payment proof
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {(editFormData.requirePaymentProofClub ||
                        editFormData.requirePaymentProofGuest) && (
                        <div>
                          <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-white/70">
                            Payment Instructions
                          </label>
                          <textarea
                            value={editFormData.paymentInstructions}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                paymentInstructions: e.target.value,
                              })
                            }
                            rows={4}
                            className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 transition focus:border-[#4AEEFF] focus:outline-none"
                            placeholder="Explain how players should pay and upload their receipt."
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Categories Section */}
                  <div className="mt-4 border-t border-white/10 pt-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-black uppercase tracking-wider text-white">
                          Tournament Categories
                        </h3>
                        <p className="mt-1 text-xs text-white/50">
                          Configure divisions and participant limits
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addEditCategory}
                        className="flex items-center gap-1.5 rounded-lg border border-[#4AEEFF]/40 bg-[#4AEEFF]/15 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-[#4AEEFF] shadow-sm transition hover:bg-[#4AEEFF]/25"
                      >
                        <span>+</span> Add Category
                      </button>
                    </div>

                    <div className="space-y-3.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                      {editCategories.map((category, index) => (
                        <div
                          key={category.id}
                          className="space-y-3 rounded-xl border border-white/10 bg-[#061D23]/60 p-4 backdrop-blur-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-wider text-[#4AEEFF]">
                              Category {index + 1}
                            </span>
                            {editCategories.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeEditCategory(index)}
                                className="flex items-center gap-1 text-xs font-bold text-red-400 transition hover:text-red-300"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/60">
                                Category Name
                              </label>
                              <input
                                type="text"
                                placeholder="Category Name"
                                value={category.name}
                                onChange={(e) =>
                                  updateEditCategory(
                                    index,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#4AEEFF] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/60">
                                Match Type
                              </label>
                              <GlassSelect
                                value={category.type}
                                onChange={(e) =>
                                  updateEditCategory(
                                    index,
                                    "type",
                                    e.target.value,
                                  )
                                }
                                className="w-full"
                              >
                                <option
                                  value="SINGLES"
                                  className="bg-[#061D23] text-white"
                                >
                                  Singles
                                </option>
                                <option
                                  value="DOUBLES"
                                  className="bg-[#061D23] text-white"
                                >
                                  Doubles
                                </option>
                                <option
                                  value="TEAM"
                                  className="bg-[#061D23] text-white"
                                >
                                  Team
                                </option>
                              </GlassSelect>
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/60">
                                Draw Format
                              </label>
                              <GlassSelect
                                value={category.stageFormat || "KNOCKOUT"}
                                onChange={(e) =>
                                  updateEditCategory(
                                    index,
                                    "stageFormat",
                                    e.target.value as
                                      | "KNOCKOUT"
                                      | "GROUP_KNOCKOUT",
                                  )
                                }
                                className="w-full"
                              >
                                <option
                                  value="KNOCKOUT"
                                  className="bg-[#061D23] text-white"
                                >
                                  Knockout
                                </option>
                                <option
                                  value="GROUP_KNOCKOUT"
                                  className="bg-[#061D23] text-white"
                                >
                                  Group + Knockout
                                </option>
                              </GlassSelect>
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/60">
                                Gender Division
                              </label>
                              <GlassSelect
                                value={category.gender || ""}
                                onChange={(e) =>
                                  updateEditCategory(
                                    index,
                                    "gender",
                                    (e.target.value as
                                      | "MALE"
                                      | "FEMALE"
                                      | "MIXED") || undefined,
                                  )
                                }
                                className="w-full"
                              >
                                <option
                                  value=""
                                  className="bg-[#061D23] text-white"
                                >
                                  Mixed / Open
                                </option>
                                <option
                                  value="MALE"
                                  className="bg-[#061D23] text-white"
                                >
                                  Men's Only
                                </option>
                                <option
                                  value="FEMALE"
                                  className="bg-[#061D23] text-white"
                                >
                                  Women's Only
                                </option>
                              </GlassSelect>
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/60">
                                Max Participants
                              </label>
                              <input
                                type="number"
                                placeholder="Max Participants"
                                value={category.maxParticipants}
                                onChange={(e) =>
                                  updateEditCategory(
                                    index,
                                    "maxParticipants",
                                    parseInt(e.target.value) || 2,
                                  )
                                }
                                min="2"
                                max="256"
                                className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#4AEEFF] focus:outline-none"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/60">
                                Age Restrictions (Optional)
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  placeholder="Min Age (e.g. 15)"
                                  value={category.minAge || ""}
                                  onChange={(e) =>
                                    updateEditCategory(
                                      index,
                                      "minAge",
                                      e.target.value
                                        ? parseInt(e.target.value)
                                        : undefined,
                                    )
                                  }
                                  className="w-1/2 rounded-lg border border-white/10 bg-[#061D23]/60 px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#4AEEFF] focus:outline-none"
                                />
                                <input
                                  type="number"
                                  placeholder="Max Age (e.g. 18)"
                                  value={category.maxAge || ""}
                                  onChange={(e) =>
                                    updateEditCategory(
                                      index,
                                      "maxAge",
                                      e.target.value
                                        ? parseInt(e.target.value)
                                        : undefined,
                                    )
                                  }
                                  className="w-1/2 rounded-lg border border-white/10 bg-[#061D23]/60 px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#4AEEFF] focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {editCategories.length === 0 && (
                      <p className="py-4 text-center text-xs text-white/50">
                        No categories. Click "+ Add Category" to create one.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 border-t border-white/10 pt-4">
                    <button
                      type="button"
                      onClick={handleUpdateTournament}
                      className="flex-1 rounded-lg bg-[#4AEEFF] py-3 text-sm font-black uppercase tracking-wider text-[#061D23] shadow-lg shadow-[#4AEEFF]/20 transition hover:bg-white"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 rounded-lg border border-white/20 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}

          {/* ─── TOURNAMENT COMPETITION SECTION (Bracket, Champions, Groups) ─── */}
          {tournament.categories.length === 0 ? (
            <section className="mb-10 text-center py-12 rounded-2xl border border-dashed border-white/15 bg-white/5">
              <p className="text-slate-400 text-sm font-medium">
                No categories configured for this tournament yet.
              </p>
            </section>
          ) : (
            activeCategory && (
              <section className="mb-6">
                {/* Sub-Stage Navigation Bar (Bracket, Champions, Group Stage) + Quick Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/15 bg-[#061D23]/25 px-4 py-3 shadow-[0_10px_30px_-10px_rgba(6,29,35,0.4)] backdrop-blur-xl">
                  {/* Sub-Stage Navigation Tabs (Styled to match the Players.tsx segmented capsule) */}
                  <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                    {activeCategoryFormat === "GROUP_KNOCKOUT" && (
                      <button
                        type="button"
                        onClick={() => setDivisionStageTab("GROUPS")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          divisionStageTab === "GROUPS"
                            ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                            : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        Group Stage
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDivisionStageTab("KNOCKOUT")}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        divisionStageTab === "KNOCKOUT"
                          ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                          : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      Bracket
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDivisionStageTab("CHAMPIONS");
                        if (activeCategoryId) {
                          fetchWinners(activeCategoryId);
                        }
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        divisionStageTab === "CHAMPIONS"
                          ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                          : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      Champions
                    </button>
                    <Link
                      to={`/leaderboard?tournament=${id}&category=${activeCategoryId}`}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-white/70 hover:text-[#4AEEFF] hover:bg-white/5 border border-transparent flex items-center gap-1.5"
                      title="View tournament & category standings"
                    >
                      <span>Leaderboard</span>
                      <span className="text-[10px] text-[#4AEEFF]">↗</span>
                    </Link>
                  </div>

                  {/* Category Info / Stats */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs text-white/70">
                    <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-white font-medium">
                      <strong className="text-[#4AEEFF] font-bold">
                        {activeCategory.currentParticipants || 0}
                      </strong>{" "}
                      / {activeCategory.maxParticipants}{" "}
                      {isDoublesCategory(activeCategory.type)
                        ? "pairs"
                        : "players"}{" "}
                      registered
                    </span>
                    <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-white/80 font-medium">
                      {formatAgeEligibility(
                        activeCategory.minAge,
                        activeCategory.maxAge,
                      )}
                    </span>
                    <span className="rounded-lg bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 px-2.5 py-1 text-[#4AEEFF] font-bold uppercase tracking-wider text-[11px]">
                      {(activeCategory.stageFormat || tournamentType) ===
                      "GROUP_KNOCKOUT"
                        ? "Group + Knockout"
                        : "Knockout Draw"}
                    </span>
                  </div>
                </div>
              </section>
            )
          )}

          {/* Group Stage UI */}
          {viewingDivisionDetail &&
            activeCategoryFormat === "GROUP_KNOCKOUT" &&
            divisionStageTab === "GROUPS" &&
            activeCategoryId && (
              <div className="mb-6">
                {(isSuperAdmin || canManageMatches) && (
                  <div className="flex flex-wrap items-center justify-end gap-2 mb-3">
                    <button
                      onClick={() => setShowGroupsModal(true)}
                      className="rounded-lg bg-[#4AEEFF] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#061D23] hover:bg-white transition-all shadow-sm"
                    >
                      Create / Edit Groups
                    </button>
                    <button
                      onClick={handleGenerateGroupMatches}
                      className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-all"
                    >
                      Generate Matches
                    </button>
                    <button
                      onClick={() => setShowKnockoutModal(true)}
                      className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-all"
                    >
                      Generate Knockout
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-300 hover:bg-rose-500 hover:text-white transition-all"
                    >
                      Reset Knockout
                    </button>
                  </div>
                )}

                <GroupStandings
                  tournamentId={id}
                  categoryId={activeCategoryId}
                  isAdminOrReferee={
                    isSuperAdmin ||
                    canManageMatches ||
                    canManageResults ||
                    isReferee
                  }
                  onScoreUpdate={fetchTournamentDetails}
                  key={`groups-${activeCategoryId}-${refreshGroups}`}
                />
              </div>
            )}

          {/* Knockout Bracket Section */}
          {viewingDivisionDetail &&
            activeCategoryId &&
            divisionStageTab === "KNOCKOUT" && (
              <div
                className="relative w-full min-w-0 max-w-full mb-8 pt-4 pb-8 bg-transparent"
                style={{ minHeight: 200 }}
              >
                {(isSuperAdmin || canManageMatches) && (
                  <div className="flex items-center justify-end gap-2.5 mb-4">
                    {activeCategoryFormat === "KNOCKOUT" && (
                      <button
                        onClick={() => {
                          const cat = tournament.categories.find(
                            (c) => c.id === activeCategoryId,
                          );
                          if (cat) setConfirmDrawCategory(cat);
                        }}
                        disabled={generating === activeCategoryId}
                        className="rounded-xl bg-[#0D5C63] hover:bg-[#094348] text-white px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                      >
                        {generating === activeCategoryId ? (
                          <>
                            <span className="animate-spin text-sm">⏳</span>
                            <span>Generating Bracket...</span>
                          </>
                        ) : (
                          <>
                            <span>🎲</span>
                            <span>Generate / Update Bracket</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-300 hover:bg-red-500 hover:text-white transition-all shadow-md shadow-red-500/10"
                    >
                      Reset Bracket
                    </button>
                  </div>
                )}

                <KnockoutBracket
                  tournamentId={id}
                  categoryId={activeCategoryId}
                  onScoreRecorded={fetchTournamentDetails}
                  key={`knockout-${activeCategoryId}-${refreshKnockout}`}
                  refreshTrigger={refreshKnockout}
                />
              </div>
            )}

          {/* Winners Section */}
          {viewingDivisionDetail &&
            activeCategoryId &&
            divisionStageTab === "CHAMPIONS" && (
              <div id="winners-section" className="mb-6">
                {/* Centered Heading - Compact */}
                <div className="text-center pt-0 pb-3 sm:pb-4">
                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight">
                    Tournament Champions
                  </h2>
                  <div className="mt-1.5 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4AEEFF] animate-pulse" />
                      {effectiveStatus === "COMPLETED"
                        ? `Official Final Standings • ${formatDivisionName(activeCategory?.name)}`
                        : `Podium in Contention • ${formatDivisionName(activeCategory?.name)}`}
                    </span>
                  </div>
                </div>

                {/* Show results only for the selected category */}
                {winners?.categoryId === activeCategoryId ? (
                  (() => {
                    const isDoubles =
                      activeCategory?.type === "DOUBLES" ||
                      activeCategory?.type === "MIXED_DOUBLES";

                    const isChampionTBD =
                      !winners.first ||
                      !winners.first.name ||
                      winners.first.name.includes("In Progress") ||
                      winners.first.name.includes("TBD");

                    const isRunnerUpTBD =
                      !winners.second ||
                      !winners.second.name ||
                      winners.second.name.includes("In Progress") ||
                      winners.second.name.includes("TBD");

                    const championPlayers = getPlayersFromParticipant(
                      winners.first,
                      isDoubles,
                    );
                    const runnerUpPlayers = getPlayersFromParticipant(
                      winners.second,
                      isDoubles,
                    );

                    const hasOfficialThird = Boolean(
                      winners.thirdPlace &&
                      winners.thirdPlace.name &&
                      !winners.thirdPlace.name.includes("In Progress") &&
                      !winners.thirdPlace.name.includes("TBD"),
                    );

                    const thirdPlacePlayers = hasOfficialThird
                      ? getPlayersFromParticipant(winners.thirdPlace, isDoubles)
                      : [];

                    const semifinalTeams = (winners.jointThird || []).map(
                      (t: any) => ({
                        name:
                          t.name ||
                          `${t.firstName || ""} ${t.lastName || ""}`.trim() ||
                          "Team",
                        players: getPlayersFromParticipant(t, isDoubles),
                      }),
                    );

                    const shouldAnimate =
                      !animatedCategoriesRef.current.has(activeCategoryId);

                    return (
                      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 items-end">
                          {/* Left Card: RUNNER-UP (order-2 on mobile, order-1 on desktop) */}
                          <div className="order-2 md:order-1 flex flex-col h-full">
                            <div
                              className={`w-full flex-1 flex flex-col justify-between bg-[#061D23]/70 backdrop-blur-xl rounded-2xl p-4 sm:p-4.5 border border-slate-400/30 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] min-h-[220px] sm:min-h-[240px] relative overflow-hidden ${
                                shouldAnimate ? "animate-showcase-runnerup" : ""
                              }`}
                            >
                              {/* Silver accent along top */}
                              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-500 via-slate-200 to-slate-500 shadow-[0_0_8px_rgba(203,213,225,0.4)]" />

                              {/* Top: Silver Medal Icon + Label */}
                              <div className="flex flex-col items-center">
                                <SilverMedalIcon className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-[0_0_6px_rgba(203,213,225,0.4)]" />
                                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-300 uppercase mt-1">
                                  {isDoubles ? "RUNNERS-UP" : "RUNNER-UP"}
                                </span>
                              </div>

                              {/* Middle: Avatars & Names */}
                              {isRunnerUpTBD ? (
                                <div className="my-auto py-3 flex flex-col items-center">
                                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-500/40 bg-slate-800/40 flex items-center justify-center text-slate-300 font-bold text-xs">
                                    2ND
                                  </div>
                                  <p className="mt-2 text-xs font-semibold text-slate-400">
                                    Final match pending
                                  </p>
                                </div>
                              ) : (
                                <div className="my-auto py-2.5 w-full flex items-center justify-center gap-3 sm:gap-4">
                                  {runnerUpPlayers.map((player, idx) => (
                                    <React.Fragment key={player.id || idx}>
                                      {idx > 0 && (
                                        <span className="text-slate-400 font-bold text-xs self-center select-none pb-3">
                                          &amp;
                                        </span>
                                      )}
                                      {player.id ? (
                                        <Link
                                          to={`/profile/${player.id}`}
                                          className="group flex flex-col items-center gap-1.5 min-w-0 max-w-[110px]"
                                          title={player.name}
                                        >
                                          <div className="transition-transform group-hover:scale-105">
                                            <WinnerAvatar
                                              image={player.image}
                                              name={player.name}
                                              initials={player.initials}
                                              sizeClass="w-12 h-12 sm:w-14 sm:h-14"
                                              bgClass="bg-slate-800/80"
                                              textClass="text-slate-200 text-sm sm:text-base font-bold"
                                              borderClass="border-slate-300/60 ring-2 ring-slate-400/20 shadow-[0_0_12px_rgba(203,213,225,0.25)]"
                                            />
                                          </div>
                                          <p className="text-xs sm:text-sm font-bold text-white group-hover:text-[#4AEEFF] group-hover:underline transition-colors leading-tight text-center break-words line-clamp-1">
                                            {player.name}
                                          </p>
                                        </Link>
                                      ) : (
                                        <div className="flex flex-col items-center gap-1.5 min-w-0 max-w-[110px]">
                                          <WinnerAvatar
                                            image={player.image}
                                            name={player.name}
                                            initials={player.initials}
                                            sizeClass="w-12 h-12 sm:w-14 sm:h-14"
                                            bgClass="bg-slate-800/80"
                                            textClass="text-slate-200 text-sm sm:text-base font-bold"
                                            borderClass="border-slate-300/60 ring-2 ring-slate-400/20 shadow-[0_0_12px_rgba(203,213,225,0.25)]"
                                          />
                                          <p className="text-xs sm:text-sm font-bold text-white leading-tight text-center break-words line-clamp-1">
                                            {player.name}
                                          </p>
                                        </div>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              )}

                              {/* Bottom: Divider + 2nd place label */}
                              <div className="w-full border-t border-white/10 pt-2 flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                                  2nd place
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-400/15 border border-slate-400/30 text-slate-300 font-black text-[9px] tracking-wider">
                                  SILVER
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Centre Card: CHAMPION (order-1 on mobile, order-2 on desktop, elevated -translate-y-4 on desktop) */}
                          <div className="order-1 md:order-2 md:-translate-y-4 flex flex-col h-full">
                            <div
                              className={`w-full flex-1 flex flex-col justify-between bg-gradient-to-b from-amber-500/15 via-[#061D23]/85 to-[#061D23]/95 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border-2 border-amber-400/50 shadow-[0_15px_40px_-10px_rgba(245,158,11,0.35)] min-h-[250px] sm:min-h-[270px] relative overflow-hidden ${
                                shouldAnimate ? "animate-showcase-champion" : ""
                              }`}
                            >
                              {/* Ambient Gold Aura */}
                              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-36 h-36 bg-amber-400/20 blur-2xl pointer-events-none rounded-full" />
                              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />

                              {/* Top: Gold Trophy Icon + Label */}
                              <div className="flex flex-col items-center">
                                <TrophyOutlineIcon className="w-8 h-8 sm:w-9 sm:h-9 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
                                <span className="text-[11px] sm:text-xs font-black tracking-widest text-amber-400 uppercase mt-1">
                                  {isDoubles ? "CHAMPIONS" : "CHAMPION"}
                                </span>
                              </div>

                              {/* Middle: Avatars & Names */}
                              {isChampionTBD ? (
                                <div className="my-auto py-3 flex flex-col items-center">
                                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-400/40 bg-amber-400/10 flex items-center justify-center text-amber-400 font-bold text-xs">
                                    1ST
                                  </div>
                                  <p className="mt-2 text-xs font-semibold text-amber-400/70">
                                    Final match pending
                                  </p>
                                </div>
                              ) : (
                                <div className="my-auto py-2.5 w-full flex items-center justify-center gap-3 sm:gap-4">
                                  {championPlayers.map((player, idx) => (
                                    <React.Fragment key={player.id || idx}>
                                      {idx > 0 && (
                                        <span className="text-amber-400/80 font-bold text-xs self-center select-none pb-3">
                                          &amp;
                                        </span>
                                      )}
                                      {player.id ? (
                                        <Link
                                          to={`/profile/${player.id}`}
                                          className="group flex flex-col items-center gap-1.5 min-w-0 max-w-[120px]"
                                          title={player.name}
                                        >
                                          <div className="transition-transform group-hover:scale-105">
                                            <WinnerAvatar
                                              image={player.image}
                                              name={player.name}
                                              initials={player.initials}
                                              sizeClass="w-14 h-14 sm:w-16 sm:h-16"
                                              bgClass="bg-amber-400/20"
                                              textClass="text-amber-300 text-base sm:text-lg font-black"
                                              borderClass="border-amber-400 ring-3 ring-amber-400/25 shadow-[0_0_18px_rgba(245,158,11,0.45)]"
                                            />
                                          </div>
                                          <p className="text-sm sm:text-base font-extrabold text-white group-hover:text-amber-300 group-hover:underline transition-colors leading-tight text-center break-words line-clamp-1 drop-shadow-sm">
                                            {player.name}
                                          </p>
                                        </Link>
                                      ) : (
                                        <div className="flex flex-col items-center gap-1.5 min-w-0 max-w-[120px]">
                                          <WinnerAvatar
                                            image={player.image}
                                            name={player.name}
                                            initials={player.initials}
                                            sizeClass="w-14 h-14 sm:w-16 sm:h-16"
                                            bgClass="bg-amber-400/20"
                                            textClass="text-amber-300 text-base sm:text-lg font-black"
                                            borderClass="border-amber-400 ring-3 ring-amber-400/25 shadow-[0_0_18px_rgba(245,158,11,0.45)]"
                                          />
                                          <p className="text-sm sm:text-base font-extrabold text-white leading-tight text-center break-words line-clamp-1 drop-shadow-sm">
                                            {player.name}
                                          </p>
                                        </div>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              )}

                              {/* Bottom: Divider + 1st place label */}
                              <div className="w-full border-t border-amber-400/25 pt-2 flex items-center justify-between">
                                <span className="text-[11px] text-amber-400/80 font-bold uppercase tracking-wider">
                                  1st place
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-black text-[10px] shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                                  GOLD
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Card: Third-place or Semifinalists (order-3 on mobile and desktop) */}
                          <div className="order-3 md:order-3 flex flex-col h-full">
                            <div
                              className={`w-full flex-1 flex flex-col justify-between bg-[#061D23]/70 backdrop-blur-xl rounded-2xl p-4 sm:p-4.5 border border-amber-700/35 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] min-h-[220px] sm:min-h-[240px] relative overflow-hidden ${
                                shouldAnimate ? "animate-showcase-third" : ""
                              }`}
                            >
                              {/* Bronze accent along top */}
                              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-800 shadow-[0_0_8px_rgba(180,83,9,0.35)]" />

                              {/* Top: Bronze Medal Icon + Label */}
                              <div className="flex flex-col items-center">
                                <BronzeMedalIcon className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 drop-shadow-[0_0_6px_rgba(180,83,9,0.4)]" />
                                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-amber-500 uppercase mt-1">
                                  {hasOfficialThird
                                    ? "3RD PLACE"
                                    : "SEMI-FINALISTS"}
                                </span>
                              </div>

                              {/* Middle: Either 3rd place winner OR 2 Semifinalists */}
                              {hasOfficialThird ? (
                                <div className="my-auto py-2.5 w-full flex items-center justify-center gap-3 sm:gap-4">
                                  {thirdPlacePlayers.map((player, idx) => (
                                    <React.Fragment key={player.id || idx}>
                                      {idx > 0 && (
                                        <span className="text-slate-400 font-bold text-xs self-center select-none pb-3">
                                          &amp;
                                        </span>
                                      )}
                                      {player.id ? (
                                        <Link
                                          to={`/profile/${player.id}`}
                                          className="group flex flex-col items-center gap-1.5 min-w-0 max-w-[110px]"
                                          title={player.name}
                                        >
                                          <div className="transition-transform group-hover:scale-105">
                                            <WinnerAvatar
                                              image={player.image}
                                              name={player.name}
                                              initials={player.initials}
                                              sizeClass="w-12 h-12 sm:w-14 sm:h-14"
                                              bgClass="bg-amber-950/50"
                                              textClass="text-amber-400 text-sm sm:text-base font-bold"
                                              borderClass="border-amber-600/60 ring-2 ring-amber-600/20 shadow-[0_0_12px_rgba(180,83,9,0.25)]"
                                            />
                                          </div>
                                          <p className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 group-hover:underline transition-colors leading-tight text-center break-words line-clamp-1">
                                            {player.name}
                                          </p>
                                        </Link>
                                      ) : (
                                        <div className="flex flex-col items-center gap-1.5 min-w-0 max-w-[110px]">
                                          <WinnerAvatar
                                            image={player.image}
                                            name={player.name}
                                            initials={player.initials}
                                            sizeClass="w-12 h-12 sm:w-14 sm:h-14"
                                            bgClass="bg-amber-950/50"
                                            textClass="text-amber-400 text-sm sm:text-base font-bold"
                                            borderClass="border-amber-600/60 ring-2 ring-amber-600/20 shadow-[0_0_12px_rgba(180,83,9,0.25)]"
                                          />
                                          <p className="text-xs sm:text-sm font-bold text-white leading-tight text-center break-words line-clamp-1">
                                            {player.name}
                                          </p>
                                        </div>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              ) : semifinalTeams.length > 0 ? (
                                <div className="my-auto py-2 w-full flex flex-col justify-center gap-2">
                                  {semifinalTeams.map((team, idx) => (
                                    <React.Fragment key={idx}>
                                      {idx > 0 && (
                                        <div className="border-t border-white/10 w-full" />
                                      )}
                                      <div className="flex items-center gap-2.5 w-full px-1">
                                        <div className="flex items-center -space-x-1.5 shrink-0">
                                          {team.players.map((p, pIdx) => {
                                            const av = (
                                              <WinnerAvatar
                                                image={p.image}
                                                name={p.name}
                                                initials={p.initials}
                                                sizeClass="w-7 h-7 sm:w-8 sm:h-8"
                                                bgClass="bg-amber-950/60"
                                                textClass="text-amber-400 text-[10px] font-bold"
                                                borderClass="border-amber-600/60 ring-1 ring-white/10"
                                              />
                                            );
                                            return p.id ? (
                                              <Link
                                                key={p.id || pIdx}
                                                to={`/profile/${p.id}`}
                                                title={p.name}
                                                className="transition-transform hover:scale-110 relative"
                                                style={{ zIndex: 10 - pIdx }}
                                              >
                                                {av}
                                              </Link>
                                            ) : (
                                              <div
                                                key={pIdx}
                                                className="relative"
                                                style={{ zIndex: 10 - pIdx }}
                                              >
                                                {av}
                                              </div>
                                            );
                                          })}
                                        </div>
                                        <div className="min-w-0 flex items-center flex-wrap gap-x-1 leading-snug">
                                          {team.players.map((p, pIdx) => (
                                            <React.Fragment key={p.id || pIdx}>
                                              {pIdx > 0 && (
                                                <span className="text-white/40 font-bold text-[10px] select-none">
                                                  &amp;
                                                </span>
                                              )}
                                              {p.id ? (
                                                <Link
                                                  to={`/profile/${p.id}`}
                                                  className="text-xs font-bold text-white hover:text-amber-400 hover:underline transition-colors truncate max-w-[100px] inline-block"
                                                  title={p.name}
                                                >
                                                  {p.name}
                                                </Link>
                                              ) : (
                                                <span
                                                  className="text-xs font-bold text-white truncate max-w-[100px] inline-block"
                                                  title={p.name}
                                                >
                                                  {p.name}
                                                </span>
                                              )}
                                            </React.Fragment>
                                          ))}
                                        </div>
                                      </div>
                                    </React.Fragment>
                                  ))}
                                </div>
                              ) : (
                                <div className="my-auto py-3 flex flex-col items-center">
                                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-700/40 bg-amber-950/40 flex items-center justify-center text-amber-500 font-bold text-xs">
                                    3RD
                                  </div>
                                  <p className="mt-2 text-xs font-semibold text-amber-600/70">
                                    Semifinals pending
                                  </p>
                                </div>
                              )}

                              {/* Bottom: Divider + Label */}
                              <div className="w-full border-t border-white/10 pt-2 flex items-center justify-between">
                                <span className="text-[11px] text-amber-600/80 font-semibold uppercase tracking-wider">
                                  {hasOfficialThird
                                    ? "3rd place"
                                    : "Semi-finalists"}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-amber-600/15 border border-amber-600/30 text-amber-400 font-black text-[9px] tracking-wider">
                                  BRONZE
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* Loading State */
                  <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-white/5 border border-white/10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400/20 border-t-amber-400 mb-3" />

                    <p className="text-xs font-semibold text-white/70">
                      Loading champions for the selected category...
                    </p>
                  </div>
                )}
              </div>
            )}
        </>
      )}

      {registrationOnly && (
        <div className="rounded-2xl border border-white/20 bg-[#061D23]/25 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => navigate(`/app/tournaments/${id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-[#4AEEFF] hover:bg-white/10 hover:text-white transition-all mb-3"
              >
                ← Back to Tournament Details
              </button>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight">
                Tournament Registration
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-cyan-200/80">
                {tournament.name} · Official division enrollment & athlete check-in
              </p>
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70">
                <MapPinIcon className="w-3.5 h-3.5 text-[#4AEEFF]" />
                <span>{tournament.venue}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70">
                <CalendarIcon className="w-3.5 h-3.5 text-[#4AEEFF]" />
                <span>
                  {formatTournamentDateRange(
                    tournament.startDate,
                    tournament.endDate,
                  )}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${getStatusColor(effectiveStatus)}`}
              >
                {effectiveStatus}
              </span>
            </div>
          </div>
        </div>
      )}



      {/* Professional Tournament Division Entry Section */}
      {registrationOnly && canRegister && tournament.categories.length > 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#061D23]/40 p-6 shadow-xl backdrop-blur-md mb-6">
          {/* Athlete Passport & Eligibility Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 font-black text-base flex items-center justify-center shadow-md shadow-cyan-500/20 flex-shrink-0">
                🏓
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  Tournament Division Entry
                </h3>
                <p className="text-xs text-white/60">
                  Official player registration & doubles team pairings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {playerAge !== null && (
                <div className="flex items-center gap-2 bg-black/40 border border-cyan-500/30 px-3.5 py-1.5 rounded-xl text-xs">
                  <span className="text-white/50">Verified:</span>
                  <span className="font-bold text-[#4AEEFF]">
                    {playerAge} yrs
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="font-bold text-white capitalize">
                    {playerGender?.toLowerCase() || "Athlete"}
                  </span>
                </div>
              )}
              <span className="px-3 py-1.5 rounded-xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/25 text-xs font-bold font-mono">
                {userRegistrations.length} / {eligibleCategories.length}{" "}
                Divisions Enrolled
              </span>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            {eligibleCategories.map((category) => {
              const categoryRegistration = userRegistrations.find(
                (r) =>
                  r.categoryId === category.id ||
                  r.category?.id === category.id,
              );
              const isAlreadyRegistered = !!categoryRegistration;
              const isSelected = selectedCategories.includes(category.id);
              const isFull =
                category.currentParticipants >= category.maxParticipants;
              const isDoubles = isDoublesCategory(category.type);
              const pendingSentInvite = mySentInvites.find(
                (inv) => inv.categoryId === category.id,
              );
              const pendingReceivedInvite = myPendingInvites.find(
                (inv) => inv.categoryId === category.id,
              );

              // Extract confirmed partner name if registered
              const partnerMember = categoryRegistration?.team?.members?.find(
                (m: any) => m.playerId !== user?.id,
              );
              const partnerName = partnerMember
                ? `${partnerMember.player?.firstName || ""} ${partnerMember.player?.lastName || ""}`.trim()
                : categoryRegistration?.playerId !== user?.id
                  ? `${categoryRegistration?.player?.firstName || ""} ${categoryRegistration?.player?.lastName || ""}`.trim()
                  : "Confirmed Partner";

              return (
                <div
                  key={category.id}
                  className={`rounded-xl border transition-all p-4 ${
                    isAlreadyRegistered
                      ? "border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-emerald-900/15 to-[#061D23]/60 shadow-sm"
                      : isSelected
                        ? "border-[#4AEEFF] bg-[#4AEEFF]/15 shadow-md shadow-[#4AEEFF]/10"
                        : "border-white/10 bg-[#061D23]/40 hover:border-white/20"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {isAlreadyRegistered ? (
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 font-black text-sm shadow-[0_0_12px_rgba(16,185,129,0.3)] flex-shrink-0">
                          ✓
                        </div>
                      ) : isDoubles ? (
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold text-sm flex-shrink-0">
                          👥
                        </div>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (!isFull && !isAlreadyRegistered) {
                              toggleCategory(category.id);
                            }
                          }}
                          disabled={isFull || isAlreadyRegistered}
                          className="w-5 h-5 rounded border-white/30 text-[#4AEEFF] focus:ring-[#4AEEFF] cursor-pointer flex-shrink-0"
                        />
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`font-black text-sm sm:text-base ${
                              isAlreadyRegistered
                                ? "text-emerald-100"
                                : "text-white"
                            }`}
                          >
                            {category.name}
                          </h4>
                          {category.gender && category.gender !== "MIXED" && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/30">
                              {category.gender === "MALE"
                                ? "♂ Men's"
                                : "♀ Women's"}
                            </span>
                          )}
                          {category.gender === "MIXED" && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              ⚤ Mixed Gender
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 text-white/50 border border-white/10">
                            {isDoubles ? "Doubles Format" : "Singles Format"}
                          </span>
                        </div>

                        {/* Status detail line */}
                        <div className="mt-1 text-xs">
                          {isAlreadyRegistered && isDoubles ? (
                            <div className="flex items-center gap-2 text-white/80 flex-wrap">
                              <span className="text-emerald-400 font-semibold">
                                Confirmed Doubles Pair:
                              </span>
                              <span className="font-bold text-white flex items-center gap-1">
                                <span>🤝</span> {partnerName}
                              </span>
                            </div>
                          ) : (
                            <p className="text-white/60">
                              {category.currentParticipants} /{" "}
                              {category.maxParticipants} participants
                              {isDoubles && (
                                <span className="ml-2 text-cyan-300 font-medium">
                                  • Invite partner required
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                      {isAlreadyRegistered ? (
                        <div className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                          <span>✓</span> Enrolled
                          {categoryRegistration.status && (
                            <span className="text-[10px] opacity-80 font-mono ml-0.5">
                              ({categoryRegistration.status})
                            </span>
                          )}
                        </div>
                      ) : isFull ? (
                        <span className="text-xs font-black uppercase tracking-wider text-red-400 bg-red-500/15 border border-red-500/30 px-3 py-1 rounded-xl">
                          Division Full
                        </span>
                      ) : isDoubles ? (
                        pendingReceivedInvite ? (
                          <div className="flex items-center gap-2 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 rounded-xl">
                            <span className="text-xs font-bold text-cyan-300">
                              Invited by{" "}
                              {pendingReceivedInvite.inviter?.firstName}
                            </span>
                            <button
                              onClick={() =>
                                handleAcceptInvite(pendingReceivedInvite.id)
                              }
                              disabled={
                                respondingInviteId === pendingReceivedInvite.id
                              }
                              className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-sm hover:brightness-110 active:scale-95 transition-all"
                            >
                              ✓ Accept
                            </button>
                            <button
                              onClick={() =>
                                handleDeclineInvite(pendingReceivedInvite.id)
                              }
                              disabled={
                                respondingInviteId === pendingReceivedInvite.id
                              }
                              className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ) : pendingSentInvite ? (
                          <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                            <span className="text-xs text-amber-300 font-medium">
                              ⏳ Invited {pendingSentInvite.invitee?.firstName}{" "}
                              {pendingSentInvite.invitee?.lastName}
                            </span>
                            <button
                              onClick={() =>
                                handleCancelSentInvite(pendingSentInvite.id)
                              }
                              className="px-2 py-0.5 rounded-md bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 text-[11px] font-bold transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setPartnerModalCategory({
                                id: category.id,
                                name: category.name,
                              })
                            }
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(74,238,255,0.25)] transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <span>🤝</span>
                            <span>Invite Partner</span>
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                            isSelected
                              ? "bg-[#4AEEFF] text-[#061D23] border-[#4AEEFF]"
                              : "bg-white/5 text-white/70 border-white/10 hover:border-white/20"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clean Collapsible Ineligible Categories */}
          {ineligibleCategories.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowIneligible(!showIneligible)}
                className="flex items-center justify-between w-full py-1 text-xs font-bold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors"
              >
                <span>
                  Ineligible Divisions ({ineligibleCategories.length})
                </span>
                <span className="font-mono text-xs">
                  {showIneligible ? "▲ Collapse" : "▼ Expand to view reasons"}
                </span>
              </button>

              {showIneligible && (
                <div className="mt-3 space-y-2">
                  {ineligibleCategories.map((category) => {
                    const eligibility = isPlayerEligibleForCategory(
                      category,
                      playerAge,
                      playerGender,
                    );
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 border border-white/5 rounded-xl bg-white/[0.02] text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400/60"></span>
                          <span className="font-medium text-white/60">
                            {category.name}
                          </span>
                          <span className="text-[10px] text-white/30 uppercase font-mono">
                            {category.type}
                          </span>
                        </div>
                        <span className="text-xs text-red-400/80 font-mono font-bold">
                          {eligibility.reason}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Context-Aware Bottom Action Bar */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap">
            {allEligibleRegistered ? (
              <div className="w-full rounded-xl bg-emerald-500/15 border border-emerald-500/40 py-3.5 px-4 text-xs font-black uppercase tracking-wider text-emerald-300 text-center flex items-center justify-center gap-2 shadow-sm">
                <span className="text-base">✓</span> You Are Officially
                Registered For All Eligible Divisions!
              </div>
            ) : eligibleSinglesCategories.length > 0 ? (
              <div className="flex items-center justify-between w-full gap-4 flex-wrap">
                <span className="text-xs text-white/60">
                  {selectedCategories.length > 0
                    ? `Selected ${selectedCategories.length} singles category(s)`
                    : "Check one or more singles categories above to submit"}
                </span>
                <button
                  onClick={handleRegister}
                  disabled={registering || selectedCategories.length === 0}
                  className="px-6 py-3 rounded-xl bg-[#4AEEFF] text-xs font-black uppercase tracking-wider text-[#061D23] hover:bg-white transition-all disabled:opacity-40 shadow-md shadow-[#4AEEFF]/20 active:scale-95"
                >
                  {registering
                    ? "Registering..."
                    : `Submit Registration (${selectedCategories.length})`}
                </button>
              </div>
            ) : (
              <div className="w-full text-center py-2 text-xs text-cyan-300/80 font-medium">
                💡 To enter remaining divisions, click{" "}
                <strong>"Invite Partner"</strong> on any doubles division card
                above.
              </div>
            )}
          </div>
        </div>
      )}


      {/* Payment Proof Verification */}
      {registrationOnly &&
        isPlayer &&
        hasRegistration &&
        paymentProofInfo?.paymentProofRequired && (
          <div className="rounded-[16px] border border-white/20 bg-[#061D23]/25 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider text-white">
                  Payment Verification
                </h3>

                <p className="text-xs text-white/60 mt-1">
                  Submit your payment proof for administrator verification.
                </p>
              </div>

              {paymentProofInfo.registrationFee && (
                <div className="rounded-xl border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 px-4 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-white/50">
                    Registration Fee
                  </p>

                  <p className="text-lg font-black text-[#4AEEFF]">
                    LKR {paymentProofInfo.registrationFee}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Instructions */}
            {paymentProofInfo.paymentInstructions && (
              <div className="mb-5 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#4AEEFF] mb-2">
                  Payment Instructions
                </p>

                <p className="text-sm text-white/80 whitespace-pre-line">
                  {paymentProofInfo.paymentInstructions}
                </p>
              </div>
            )}

            {/* No proof submitted yet */}
            {!paymentProofInfo.paymentProof && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-sm font-bold text-amber-300">
                    Payment proof required
                  </p>

                  <p className="text-xs text-white/60 mt-1">
                    Complete the payment and upload your receipt or payment
                    confirmation below.
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handlePaymentProofFileChange}
                    className="block w-full text-xs text-white/70
                file:mr-4 file:rounded-lg file:border-0
                file:bg-[#4AEEFF] file:px-4 file:py-2.5
                file:text-xs file:font-black file:uppercase
                file:text-[#061D23] hover:file:bg-white
                file:cursor-pointer"
                  />

                  <p className="text-[10px] text-white/40 mt-2">
                    Accepted: JPG, JPEG, PNG or PDF • Maximum size: 5MB
                  </p>
                </div>

                {paymentProofFile && (
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-xs text-white/70">
                      Selected:{" "}
                      <span className="font-bold text-white">
                        {paymentProofFile.name}
                      </span>
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleUploadPaymentProof}
                  disabled={!paymentProofFile || uploadingProof}
                  className="rounded-xl bg-[#4AEEFF] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#061D23] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {uploadingProof ? "Uploading..." : "Upload Payment Proof"}
                </button>
              </div>
            )}

            {/* Category-wise Payment Verification */}
            {paymentProofInfo.paymentProof && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 p-4">
                  <p className="text-sm font-bold text-[#4AEEFF]">
                    Payment Receipt Submitted
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Each registered category is verified separately.
                  </p>
                </div>

                {(paymentProofInfo.categoryPayments ?? []).map((category) => (
                  <div
                    key={category.registrationId}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">
                          {category.categoryName}
                        </p>
                        <p className="mt-1 text-xs text-white/50">
                          {category.categoryType?.replace(/_/g, " ")}
                        </p>
                      </div>

                      <span
                        className={`rounded-lg border px-3 py-1.5 text-xs font-black ${
                          category.paymentStatus === "APPROVED"
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                            : category.paymentStatus === "REJECTED"
                              ? "border-red-500/40 bg-red-500/15 text-red-300"
                              : "border-amber-500/40 bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {category.paymentStatus}
                      </span>
                    </div>

                    {category.paymentStatus === "REJECTED" &&
                      category.rejectionReason && (
                        <p className="mt-3 text-xs text-red-300">
                          Rejection reason: {category.rejectionReason}
                        </p>
                      )}

                    <div className="mt-3 flex flex-wrap gap-3">
                      {category.proofUrl && (
                        <a
                          href={getProfileImageUrl(category.proofUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-[#4AEEFF]/40 bg-[#4AEEFF]/10 px-4 py-2 text-xs font-bold text-[#4AEEFF]"
                        >
                          View Receipt
                        </a>
                      )}

                      {category.paymentStatus === "REJECTED" &&
                        category.canResubmit && (
                          <button
                            type="button"
                            onClick={() => {
                              setResubmitRegistrationId(
                                category.registrationId,
                              );
                              setPaymentProofFile(null);
                            }}
                            className="rounded-lg bg-[#4AEEFF] px-4 py-2 text-xs font-black text-[#061D23]"
                          >
                            Resubmit Receipt
                          </button>
                        )}
                    </div>
                  </div>
                ))}

                {resubmitRegistrationId && (
                  <div className="rounded-xl border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 p-4">
                    <p className="mb-3 text-sm font-bold text-white">
                      Replacement receipt for{" "}
                      {
                        paymentProofInfo.categoryPayments.find(
                          (category) =>
                            category.registrationId === resubmitRegistrationId,
                        )?.categoryName
                      }
                    </p>

                    <input
                      key={resubmitRegistrationId}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handlePaymentProofFileChange}
                      className="block w-full text-xs text-white/70"
                    />

                    {paymentProofFile && (
                      <p className="mt-2 text-xs text-white/70">
                        Selected: {paymentProofFile.name}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleUploadPaymentProof}
                        disabled={!paymentProofFile || uploadingProof}
                        className="rounded-lg bg-[#4AEEFF] px-4 py-2 text-xs font-black text-[#061D23] disabled:opacity-40"
                      >
                        {uploadingProof ? "Uploading..." : "Submit Replacement"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setResubmitRegistrationId(null);
                          setPaymentProofFile(null);
                        }}
                        disabled={uploadingProof}
                        className="rounded-lg border border-white/20 px-4 py-2 text-xs font-bold text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      {/* Registrations Section */}
      {!registrationOnly &&
        ((isAdmin && canManageRegistrations) || isSuperAdmin || isReferee) &&
        tournament.categories.length > 0 && (
          <div className="rounded-2xl border border-white/20 bg-[#061D23]/25 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6">
            <h2 className="text-xl font-black uppercase tracking-wider text-white mb-4">
              Registrations ({activeRegistrations.length})
            </h2>
            {/* Horizontal Registration Category Tabs */}
            <div className="mb-5 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
              {tournament.categories.map((category) => {
                const count = activeRegistrations.filter(
                  (registration) =>
                    (registration.categoryId || registration.category?.id) ===
                    category.id,
                ).length;

                const isActive = registrationCategoryId === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setSelectedRegistrationCategoryId(category.id)
                    }
                    className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-wide transition-all ${
                      isActive
                        ? "border-[#4AEEFF] bg-[#4AEEFF]/20 text-[#4AEEFF]"
                        : "border-white/15 bg-white/5 text-white/60 hover:border-[#4AEEFF]/40 hover:text-white"
                    }`}
                  >
                    {formatDivisionName(category.name)}
                    <span className="ml-2 opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
            <div
              className="overflow-x-auto"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-[#4AEEFF]">
                      Player
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-[#4AEEFF]">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-[#4AEEFF]">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-[#4AEEFF]">
                      Registered On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-[#4AEEFF]">
                      Status
                    </th>
                    {isAdmin && canManageRegistrations && (
                      <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-[#4AEEFF]">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRegistrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {registration.team?.members &&
                        registration.team.members.length > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm">
                              {registration.team.members
                                .map((m) =>
                                  `${m.player?.firstName || ""} ${m.player?.lastName || ""}`.trim(),
                                )
                                .filter(Boolean)
                                .join(" & ") ||
                                `${registration.player?.firstName || ""} ${registration.player?.lastName || ""}`}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-[#4AEEFF]">
                              Doubles Pair
                            </span>
                          </div>
                        ) : (
                          <Link
                            to={`/profile/${registration.player?.id}`}
                            className="text-white hover:text-[#4AEEFF] font-bold text-sm transition-colors"
                          >
                            {registration.player?.firstName}{" "}
                            {registration.player?.lastName}
                          </Link>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/30">
                          {registration.category?.name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                        {registration.team?.members &&
                        registration.team.members.length > 0
                          ? registration.team.members
                              .map((m) => m.player?.email)
                              .filter(Boolean)
                              .join(", ")
                          : registration.player?.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-white/50 font-mono">
                        {new Date(
                          registration.registeredAt,
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${getRegistrationStatusColor(registration.status)}`}
                        >
                          {registration.status}
                        </span>
                      </td>
                      {isAdmin && canManageRegistrations && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {registration.status === "APPROVED" && (
                            <button
                              type="button"
                              onClick={() =>
                                setRegistrationToRemove(registration)
                              }
                              className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      {/* Modals */}
      {showGroupsModal && (
        <CreateGroupsModal
          tournamentId={id}
          categoryId={activeCategoryId}
          onClose={() => setShowGroupsModal(false)}
          onSuccess={() => {
            fetchTournamentDetails();
            setRefreshGroups((prev) => prev + 1);
          }}
        />
      )}
      {showKnockoutModal && (
        <CreateKnockoutModal
          tournamentId={id}
          categoryId={activeCategoryId}
          onClose={() => setShowKnockoutModal(false)}
          onSuccess={() => {
            fetchTournamentDetails();
            setRefreshKnockout((prev) => prev + 1);
            setRefreshGroups((prev) => prev + 1);
          }}
        />
      )}
      {showScoreModal && (
        <RecordGroupScoreModal
          tournamentId={id}
          categoryId={activeCategoryId}
          onClose={() => setShowScoreModal(false)}
          onSuccess={fetchTournamentDetails}
        />
      )}
      {/* Guest Registration Modal */}
      {showGuestModal && (
        <GuestRegistrationModal
          tournamentId={id}
          tournamentName={tournament.name}
          selectedCategories={selectedCategories}
          categories={tournament.categories}
          onClose={() => setShowGuestModal(false)}
          onSuccess={fetchTournamentDetails}
        />
      )}

      {/* Doubles Partner Invite Modal */}
      {partnerModalCategory && (
        <DoublesPartnerModal
          tournamentId={id}
          categoryId={partnerModalCategory.id}
          categoryName={partnerModalCategory.name}
          onClose={() => setPartnerModalCategory(null)}
          onInviteSent={() => {
            fetchTournamentDetails();
            fetchInvites();
          }}
        />
      )}
      {showResetConfirm &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: 16,
            }}
          >
            <div
              style={{
                background: "#061D23",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: 16,
                maxWidth: 420,
                width: "100%",
                overflow: "hidden",
                boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
                fontFamily: "'Segoe UI',system-ui,sans-serif",
              }}
            >
              {/* Header */}
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  padding: "20px 24px",
                  borderBottom: "1px solid rgba(239, 68, 68, 0.25)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(239, 68, 68, 0.2)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    ⚠️
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 800,
                        color: "#fca5a5",
                        fontSize: 16,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Reset Knockout Stage
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255, 255, 255, 0.6)",
                      }}
                    >
                      This action cannot be undone
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "20px 24px" }}>
                <p
                  style={{
                    margin: "0 0 14px",
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  This will reset{" "}
                  <strong style={{ color: "#fff" }}>
                    all knockout matches and scores back to the initial bracket
                    state
                  </strong>
                  . Group stage results will remain intact.
                </p>
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 12,
                    color: "#fca5a5",
                  }}
                >
                  All knockout stages will appear fresh and ready to play.
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "14px 24px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  gap: 10,
                  background: "rgba(6, 29, 35, 0.8)",
                }}
              >
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetKnockout}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    border: "none",
                    borderRadius: 10,
                    background: "#dc2626",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Yes, Reset
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Custom Glassmorphic Modal for Generate / Update Bracket Confirmation */}
      {confirmDrawCategory &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.78)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: 16,
            }}
            onClick={() => !generating && setConfirmDrawCategory(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#082229",
                border: "1px solid rgba(74, 238, 255, 0.35)",
                borderRadius: 20,
                maxWidth: 440,
                width: "100%",
                overflow: "hidden",
                boxShadow:
                  "0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(74, 238, 255, 0.15)",
                fontFamily: "'Segoe UI',system-ui,sans-serif",
                color: "#ffffff",
              }}
            >
              {/* Header */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(74, 238, 255, 0.15), rgba(6, 29, 35, 0.8))",
                  padding: "20px 24px",
                  borderBottom: "1px solid rgba(74, 238, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "rgba(74, 238, 255, 0.15)",
                      border: "1px solid rgba(74, 238, 255, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    🎲
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontWeight: 900,
                        color: "#ffffff",
                        fontSize: 16,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Generate Knockout Draw
                    </h3>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#4AEEFF",
                        fontWeight: 700,
                        marginTop: 2,
                      }}
                    >
                      Official Bracket Generation
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => !generating && setConfirmDrawCategory(null)}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.7)",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: "22px 24px" }}>
                {/* Category preview pill */}
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: 14,
                    padding: "14px 16px",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(255, 255, 255, 0.5)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      Division / Category
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 8,
                        fontWeight: 800,
                        background: "rgba(74, 238, 255, 0.15)",
                        color: "#4AEEFF",
                        border: "1px solid rgba(74, 238, 255, 0.3)",
                        textTransform: "uppercase",
                      }}
                    >
                      {isDoublesCategory(confirmDrawCategory.type)
                        ? "Doubles"
                        : "Singles"}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: 16, fontWeight: 800, color: "#ffffff" }}
                  >
                    {confirmDrawCategory.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255, 255, 255, 0.7)",
                      marginTop: 4,
                    }}
                  >
                    {confirmDrawCategory.currentParticipants ?? 0} approved
                    entries ready to seed
                  </div>
                </div>

                <p
                  style={{
                    margin: "0 0 12px",
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  This will seed approved participants, calculate any necessary
                  BYEs according to tournament rules, and generate official
                  fixtures.
                </p>

                <div
                  style={{
                    background: "rgba(74, 238, 255, 0.08)",
                    border: "1px solid rgba(74, 238, 255, 0.25)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 12,
                    color: "#a5f3fc",
                  }}
                >
                  💡 Any unplayed or empty fixtures for this division will be
                  updated to reflect the new draw.
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "14px 24px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  gap: 12,
                  background: "rgba(6, 29, 35, 0.8)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setConfirmDrawCategory(null)}
                  disabled={generating === confirmDrawCategory.id}
                  style={{
                    flex: 1,
                    padding: "11px 0",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateBracket(confirmDrawCategory.id)}
                  disabled={generating === confirmDrawCategory.id}
                  style={{
                    flex: 1.4,
                    padding: "11px 0",
                    border: "none",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #4AEEFF, #0284c7)",
                    color: "#061D23",
                    fontWeight: 900,
                    fontSize: 13,
                    cursor:
                      generating === confirmDrawCategory.id
                        ? "default"
                        : "pointer",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    boxShadow: "0 4px 14px rgba(74, 238, 255, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {generating === confirmDrawCategory.id ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Confirm & Generate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {/* Remove Registration Confirmation Modal */}
      <ConfirmModal
        isOpen={registrationToRemove !== null}
        onClose={() => {
          if (!isRemovingRegistration) {
            setRegistrationToRemove(null);
          }
        }}
        onConfirm={handleRemoveRegistration}
        title="Remove Registration"
        message="Are you sure you want to remove this approved registration?"
        itemName={
          registrationToRemove?.team?.members?.length
            ? registrationToRemove.team.members
                .map((member) =>
                  `${member.player?.firstName || ""} ${member.player?.lastName || ""}`.trim(),
                )
                .filter(Boolean)
                .join(" & ")
            : `${registrationToRemove?.player?.firstName || ""} ${registrationToRemove?.player?.lastName || ""}`.trim()
        }
        itemBadge={registrationToRemove?.category?.name || "REGISTRATION"}
        details="Only this category registration will be cancelled. Other category registrations and payment records will remain unchanged. Removal is blocked when tournament-stage data already exists."
        confirmText="Yes, Remove Registration"
        cancelText="Cancel"
        variant="danger"
        isLoading={isRemovingRegistration}
      />

      {/* Delete Tournament Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          if (!isDeletingTournament) setShowDeleteConfirm(false);
        }}
        onConfirm={handleDelete}
        title="Delete Tournament"
        message="Are you sure you want to delete this tournament? This action cannot be undone."
        itemName={tournament?.name}
        itemBadge="PERMANENT"
        details="Warning: All categories, fixtures, brackets, matches, scores, and participant registrations for this tournament will be permanently removed."
        confirmText="Yes, Delete Tournament"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingTournament}
      />

      {/* Mark Complete Tournament Confirmation Modal */}
      <ConfirmModal
        isOpen={showCompleteConfirm}
        onClose={() => {
          if (!isCompletingTournament) setShowCompleteConfirm(false);
        }}
        onConfirm={handleMarkComplete}
        title="Mark Tournament Complete"
        message="Are you sure you want to mark this tournament as completed?"
        itemName={tournament?.name}
        itemBadge="FINALIZE"
        details="This will officially mark the tournament as completed, record final standings, and reveal the champions podium."
        confirmText="Yes, Mark Complete"
        cancelText="Cancel"
        variant="success"
        isLoading={isCompletingTournament}
      />
    </>,
  );
};

export default TournamentDetails;
