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
import CreateKnockoutModal from "../components/CreateKnockoutModal";
import DoublesPartnerModal from "../components/DoublesPartnerModal";

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

const TournamentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [paymentProofInfo, setPaymentProofInfo] =
    useState<PaymentProofInfo | null>(null);

  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const [resubmitRegistrationId, setResubmitRegistrationId] = useState<
    string | null
  >(null);

  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [registering, setRegistering] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [tournamentType, setTournamentType] = useState("KNOCKOUT");
  const activeCategory = tournament?.categories?.find(
    (c) => c.id === activeCategoryId,
  );
  const activeCategoryFormat =
    activeCategory?.stageFormat || tournamentType || "KNOCKOUT";
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
    jointThird: any[];
  } | null>(null);
  const [showWinners, setShowWinners] = useState(false);
  const winnersRequestId = useRef(0);
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
      setActiveCategoryId(tournament.categories[0].id);
    }
  }, [tournament?.categories, activeCategoryId]);

  useEffect(() => {
    if (
      activeCategoryId &&
      (showWinners || tournament?.status === "COMPLETED")
    ) {
      fetchWinners(activeCategoryId);
    } else {
      winnersRequestId.current++;
      setWinners(null);
    }

    return () => {
      winnersRequestId.current++;
    };
  }, [activeCategoryId, showWinners, tournament?.status, id]);

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
    if (category.gender && category.gender !== "MIXED") {
      if (gender && gender !== category.gender) {
        return {
          eligible: false,
          reason: category.gender === "MALE" ? "Men's only" : "Women's only",
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
      toast.success(
        "Doubles partner invite accepted! You are officially registered.",
      );
      await fetchTournamentDetails();
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

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this tournament?")) {
      try {
        await api.delete(`/tournaments/${id}`);
        toast.success("Tournament deleted successfully");
        navigate(user ? "/app/tournaments" : "/tournaments");
      } catch (error) {
        toast.error("Failed to delete tournament");
      }
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

      const allMatches = matchesResponse.data.data || [];

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
        jointThird:
          semifinalMatches.length === 2 && jointThird.length === 2
            ? jointThird
            : [],
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-5 sm:space-y-6 px-3.5 py-4 sm:px-6 sm:py-8 lg:px-8">
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

  const isRegistrationOpen =
    tournament.status === "UPCOMING" &&
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

  return wrapInBaseLayout(
    <>
      {/* Tournament Hero Header */}
      <header className="rounded-2xl border border-white/20 bg-[#061D23]/25 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="mb-3 h-[3px] w-16 bg-[#4AEEFF]" />
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40">
                Tournament Hub
              </span>
              <span
                className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${getStatusColor(tournament.status)}`}
              >
                {tournament.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-[0.12em] sm:tracking-[0.15em] text-white leading-tight">
              {tournament.name}
            </h1>
            <p className="text-white/70 text-sm mt-2 max-w-2xl leading-relaxed">
              {tournament.description ||
                "Official tournament event and match management."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {canManageTournaments && (
              <>
                <button
                  onClick={handleDelete}
                  className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-red-300 hover:bg-red-500 hover:text-white transition-all shadow-md shadow-red-500/10 active:scale-95"
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
                      paymentInstructions: tournament.paymentInstructions || "",
                    });
                    setEditCategories(
                      tournament.categories?.map((c) => ({
                        ...c,
                      })) || [],
                    );
                    setShowEditModal(true);
                  }}
                  className="rounded-xl border border-[#4AEEFF]/40 bg-[#4AEEFF]/15 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#4AEEFF] hover:bg-[#4AEEFF] hover:text-[#061D23] transition-all shadow-md shadow-[#4AEEFF]/10 active:scale-95"
                >
                  Edit Tournament
                </button>

                {tournament.status !== "COMPLETED" && (
                  <button
                    onClick={async () => {
                      try {
                        await api.patch(`/tournaments/${id}`, {
                          status: "COMPLETED",
                        });

                        toast.success("Tournament marked as completed!");

                        fetchTournamentDetails();

                        // Show Champions section.
                        // The useEffect will fetch the selected category's winners.
                        setShowWinners(true);
                      } catch {
                        toast.error("Failed to update status");
                      }
                    }}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-300 hover:bg-emerald-500 hover:text-[#061D23] transition-all shadow-md shadow-emerald-500/10 active:scale-95"
                  >
                    Mark Complete
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => {
                setShowWinners(true);

                setTimeout(() => {
                  document
                    .getElementById("winners-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className="rounded-xl border border-amber-400/40 bg-amber-400/15 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-amber-300 hover:bg-amber-400 hover:text-[#061D23] transition-all shadow-md shadow-amber-400/10 active:scale-95"
            >
              🏆 Champions
            </button>
          </div>
        </div>

        {/* Quick Stat Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#4AEEFF]/80">
              📍 Venue
            </p>
            <p className="font-bold text-white text-sm mt-1 truncate">
              {tournament.venue}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#4AEEFF]/80">
              📅 Start Date
            </p>
            <p className="font-bold text-white text-sm mt-1 truncate">
              {new Date(tournament.startDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#4AEEFF]/80">
              🏁 End Date
            </p>
            <p className="font-bold text-white text-sm mt-1 truncate">
              {new Date(tournament.endDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#4AEEFF]/80">
              ⏳ Reg. Deadline
            </p>
            <p className="font-bold text-white text-sm mt-1 truncate">
              {new Date(tournament.registrationDeadline).toLocaleDateString(
                "en-GB",
                { day: "numeric", month: "short", year: "numeric" },
              )}
            </p>
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
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-24 backdrop-blur-sm animate-fadeIn sm:pt-28">
          <div className="w-full max-w-4xl rounded-2xl border border-white/20 bg-[#061D23]/90 p-6 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-8">
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
                      setEditFormData({ ...editFormData, name: e.target.value })
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
                  Configure registration fees and payment proof requirements.
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
                              updateEditCategory(index, "name", e.target.value)
                            }
                            className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#4AEEFF] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/60">
                            Match Type
                          </label>
                          <select
                            value={category.type}
                            onChange={(e) =>
                              updateEditCategory(index, "type", e.target.value)
                            }
                            className="w-full rounded-lg border border-white/10 bg-[#061D23] px-3 py-2 text-xs text-white focus:border-[#4AEEFF] focus:outline-none"
                          >
                            <option value="SINGLES">Singles</option>
                            <option value="DOUBLES">Doubles</option>
                            <option value="TEAM">Team</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/60">
                            Draw Format
                          </label>
                          <select
                            value={category.stageFormat || "KNOCKOUT"}
                            onChange={(e) =>
                              updateEditCategory(
                                index,
                                "stageFormat",
                                e.target.value as "KNOCKOUT" | "GROUP_KNOCKOUT",
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-[#061D23] px-3 py-2 text-xs text-white focus:border-[#4AEEFF] focus:outline-none"
                          >
                            <option value="KNOCKOUT">Knockout</option>
                            <option value="GROUP_KNOCKOUT">
                              Group + Knockout
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/60">
                            Gender Division
                          </label>
                          <select
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
                            className="w-full rounded-lg border border-white/10 bg-[#061D23] px-3 py-2 text-xs text-white focus:border-[#4AEEFF] focus:outline-none"
                          >
                            <option value="">Mixed / Open</option>
                            <option value="MALE">Men's Only</option>
                            <option value="FEMALE">Women's Only</option>
                          </select>
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
        </div>
      )}

      {/* Categories & Bracket Draw Section */}
      <div className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-4 sm:p-7 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-2 h-5 bg-[#4AEEFF] rounded-full shadow-[0_0_10px_#4AEEFF]"></span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                Categories & Draws
              </h2>
              {tournament.categories.length > 0 && (
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/30">
                  {tournament.categories.length}{" "}
                  {tournament.categories.length === 1
                    ? "Division"
                    : "Divisions"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              Select a division below to view bracket draws, fixtures, and
              registered participants
            </p>
          </div>

          {tournament.categories.length > 0 && (
            <div className="flex items-center gap-2.5 self-stretch sm:self-auto bg-black/30 border border-white/10 p-1.5 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4AEEFF] pl-2 whitespace-nowrap">
                Active Draw:
              </span>
              <select
                value={activeCategoryId}
                onChange={(e) => {
                  const newCatId = e.target.value;
                  setActiveCategoryId(newCatId);
                  if (showWinners) {
                    fetchWinners(newCatId);
                  }
                }}
                className="w-full sm:w-auto rounded-lg border border-white/15 bg-[#061D23] px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-[#4AEEFF] cursor-pointer"
              >
                {tournament.categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    className="bg-[#061D23]"
                  >
                    {category.name} ({category.type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {tournament.categories.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-white/10 bg-white/5">
            <p className="text-slate-400 text-sm">
              No categories configured for this tournament yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tournament.categories.map((category) => {
              const isActive = activeCategoryId === category.id;
              const fillPct =
                Math.round(
                  (category.currentParticipants / category.maxParticipants) *
                    100,
                ) || 0;
              const isFull =
                category.currentParticipants >= category.maxParticipants;
              const spotsLeft =
                category.maxParticipants - category.currentParticipants;

              return (
                <div
                  key={category.id}
                  onClick={() => {
                    setActiveCategoryId(category.id);
                  }}
                  className={`group relative cursor-pointer rounded-2xl border transition-all duration-300 backdrop-blur-md flex flex-col justify-between overflow-hidden ${
                    isActive
                      ? "border-[#4AEEFF] bg-gradient-to-b from-[#4AEEFF]/15 via-[#061D23]/90 to-[#061D23]/95 shadow-[0_12px_35px_-8px_rgba(74,238,255,0.25)] ring-1 ring-[#4AEEFF]/40 -translate-y-0.5"
                      : "border-white/10 bg-[#061D23]/40 hover:border-white/25 hover:bg-[#061D23]/65 hover:-translate-y-0.5"
                  }`}
                >
                  {/* Top indicator bar for active card */}
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#4AEEFF] to-transparent shadow-[0_0_8px_#4AEEFF]" />
                  )}

                  <div className="p-5 space-y-4">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-white/10 text-white border border-white/15">
                          {category.type}
                        </span>
                        {category.gender && category.gender !== "MIXED" && (
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/30">
                            {category.gender === "MALE" ? "♂ Men" : "♀ Women"}
                          </span>
                        )}
                      </div>

                      {isActive ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-[#4AEEFF] text-[#061D23] shadow-[0_0_10px_rgba(74,238,255,0.4)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#061D23] animate-pulse"></span>
                          Viewing Draw
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">
                          Click to view
                        </span>
                      )}
                    </div>

                    {/* Category Title */}
                    <div>
                      <h3 className="font-black text-white text-lg tracking-wide group-hover:text-[#4AEEFF] transition-colors line-clamp-1">
                        {category.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        {category.minAge || category.maxAge ? (
                          <span>
                            Age: {category.minAge ? `${category.minAge}+` : ""}
                            {category.minAge && category.maxAge ? " - " : ""}
                            {category.maxAge ? `Under ${category.maxAge}` : ""}
                          </span>
                        ) : (
                          <span>All Ages</span>
                        )}
                        <span>•</span>
                        <span>
                          {(category.stageFormat || tournamentType) ===
                          "GROUP_KNOCKOUT"
                            ? "Group & Knockout"
                            : "Knockout"}
                        </span>
                      </div>
                    </div>

                    {/* Capacity Progress */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-300 font-sans text-[11px] uppercase tracking-wider">
                          Participants
                        </span>
                        <span className="font-bold text-white">
                          {category.currentParticipants} /{" "}
                          {category.maxParticipants}{" "}
                          <span className="text-slate-400 font-normal">
                            ({fillPct}%)
                          </span>
                        </span>
                      </div>

                      <div className="w-full bg-black/40 border border-white/10 h-2 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFull
                              ? "bg-gradient-to-r from-red-500 to-amber-500"
                              : "bg-gradient-to-r from-[#4AEEFF] via-[#22d3ee] to-[#0ea5e9] shadow-[0_0_8px_rgba(74,238,255,0.4)]"
                          }`}
                          style={{ width: `${Math.min(100, fillPct)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
                        <span>
                          {isFull ? (
                            <strong className="text-red-400 font-semibold">
                              Division Full
                            </strong>
                          ) : (
                            <span>{spotsLeft} spots available</span>
                          )}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          MAX {category.maxParticipants}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Action Button Area */}
                  {(isSuperAdmin || canManageMatches) &&
                    (category.stageFormat || tournamentType) === "KNOCKOUT" && (
                      <div className="p-3.5 bg-black/25 border-t border-white/10 mt-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDrawCategory(category);
                          }}
                          disabled={generating === category.id}
                          className="w-full rounded-xl border border-[#4AEEFF]/40 bg-[#4AEEFF]/15 hover:bg-[#4AEEFF] text-[#4AEEFF] hover:text-[#061D23] px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-[0.98]"
                        >
                          {generating === category.id ? (
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
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Group Stage UI */}
      {activeCategoryFormat === "GROUP_KNOCKOUT" && activeCategoryId && (
        <div className="rounded-2xl border border-white/20 bg-[#061D23]/25 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider text-white mb-4">
            Group Stage Management —{" "}
            <span className="text-[#4AEEFF]">
              {
                tournament.categories.find((c) => c.id === activeCategoryId)
                  ?.name
              }
            </span>
          </h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {(isSuperAdmin || canManageMatches) && (
              <>
                <button
                  onClick={() => setShowGroupsModal(true)}
                  className="rounded-xl bg-[#4AEEFF] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#061D23] hover:bg-white transition-all shadow-md shadow-[#4AEEFF]/10"
                >
                  Create / Edit Groups
                </button>
                <button
                  onClick={handleGenerateGroupMatches}
                  className="rounded-xl border border-[#4AEEFF]/40 bg-[#4AEEFF]/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#4AEEFF] hover:bg-[#4AEEFF] hover:text-[#061D23] transition-all"
                >
                  Generate Group Matches
                </button>
                <button
                  onClick={() => setShowKnockoutModal(true)}
                  className="rounded-xl border border-[#4AEEFF]/40 bg-[#4AEEFF]/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#4AEEFF] hover:bg-[#4AEEFF] hover:text-[#061D23] transition-all"
                >
                  Generate Knockout Stage
                </button>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-300 hover:bg-red-500 hover:text-white transition-all"
                >
                  Reset Knockout Stage
                </button>
              </>
            )}
          </div>
          <GroupStandings
            tournamentId={id}
            categoryId={activeCategoryId}
            isAdminOrReferee={
              isSuperAdmin || canManageMatches || canManageResults || isReferee
            }
            onScoreUpdate={fetchTournamentDetails}
            key={`groups-${activeCategoryId}-${refreshGroups}`}
          />
        </div>
      )}

      {/* Knockout Bracket Section */}
      {activeCategoryId && (
        <div
          className="relative w-full min-w-0 max-w-full mb-8 pt-4 pb-8 bg-transparent"
          style={{ minHeight: 200 }}
        >
          {(isSuperAdmin || canManageMatches) &&
            activeCategoryFormat === "KNOCKOUT" && (
              <div className="flex justify-end mb-4">
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
      {showWinners && (
        <div
          id="winners-section"
          className="rounded-[16px] border border-amber-400/30 bg-[#061D23]/35 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6"
        >
          {/* Heading and Category Selector */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-black uppercase tracking-widest text-amber-300">
                🏆{" "}
                {winners?.categoryId === activeCategoryId
                  ? winners.categoryName
                  : tournament?.categories?.find(
                      (c) => c.id === activeCategoryId,
                    )?.name || "Category"}{" "}
                Champions 🏆
              </h2>

              <p className="text-xs text-white/60 mt-0.5">
                Official podium and results for this category
              </p>
            </div>

            {/* Category Dropdown */}
            {tournament && tournament.categories.length > 1 && (
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4AEEFF]">
                  Category:
                </span>

                <select
                  value={activeCategoryId}
                  onChange={(e) => {
                    setActiveCategoryId(e.target.value);
                  }}
                  className="rounded-lg border border-white/15 bg-[#061D23] px-2.5 py-1 text-xs font-bold text-white outline-none focus:border-amber-400 cursor-pointer"
                >
                  {tournament.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Show results only for the selected category */}
          {winners?.categoryId === activeCategoryId ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {/* Champion */}
              <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-6 backdrop-blur-md">
                <div className="text-5xl mb-2">🥇</div>

                <h3 className="font-black text-xs uppercase tracking-wider text-yellow-300">
                  Champion
                </h3>

                <p className="text-xl font-bold text-white mt-1">
                  {winners.first?.name ||
                    `${winners.first?.firstName || ""} ${
                      winners.first?.lastName || ""
                    }`.trim() ||
                    "In Progress (TBD)"}
                </p>
              </div>

              {/* Runner-up */}
              <div className="rounded-2xl border border-slate-300/40 bg-slate-300/10 p-6 backdrop-blur-md">
                <div className="text-5xl mb-2">🥈</div>

                <h3 className="font-black text-xs uppercase tracking-wider text-slate-300">
                  Runner-up
                </h3>

                <p className="text-xl font-bold text-white mt-1">
                  {winners.second?.name ||
                    `${winners.second?.firstName || ""} ${
                      winners.second?.lastName || ""
                    }`.trim() ||
                    "In Progress (TBD)"}
                </p>
              </div>

              {/* Joint Third Place */}
              <div className="rounded-2xl border border-amber-600/40 bg-amber-600/10 p-6 backdrop-blur-md">
                <div className="text-5xl mb-2">🥉</div>

                <h3 className="font-black text-xs uppercase tracking-wider text-amber-400">
                  Joint 3rd Place
                </h3>

                <div className="mt-3 space-y-2">
                  {winners.jointThird.length === 2 ? (
                    winners.jointThird.map(
                      (participant: any, index: number) => (
                        <p
                          key={participant.id || index}
                          className="text-lg font-bold text-white"
                        >
                          🥉{" "}
                          {participant.name ||
                            `${participant.firstName || ""} ${
                              participant.lastName || ""
                            }`.trim()}
                        </p>
                      ),
                    )
                  ) : (
                    <p className="text-lg font-bold text-white/60">
                      Awaiting semifinal results
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Loading State */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-amber-400/20 border-t-amber-400 mb-4" />

              <p className="text-sm font-semibold text-amber-300">
                Loading champions for the selected category...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Professional Tournament Division Entry Section */}
      {canRegister && tournament.categories.length > 0 && (
        <div className="rounded-[18px] border border-white/20 bg-[#061D23]/30 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6">
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

      {hasRegistration && (
        <div className="rounded-[16px] border border-white/20 bg-[#061D23]/25 p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6 flex items-center flex-wrap gap-2">
          <p className="text-xs uppercase tracking-wider font-bold text-[#4AEEFF]">
            Your registration status:
          </p>
          {userRegistrations.map((reg) => (
            <span
              key={reg.id}
              className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${getRegistrationStatusColor(reg.status)}`}
            >
              {reg.status}
            </span>
          ))}
        </div>
      )}
      {/* Payment Proof Verification */}
      {isPlayer &&
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
      {((isAdmin && canManageRegistrations) || isSuperAdmin || isReferee) &&
        tournament.registrations?.length > 0 && (
          <div className="rounded-2xl border border-white/20 bg-[#061D23]/25 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6">
            <h2 className="text-xl font-black uppercase tracking-wider text-white mb-4">
              Registrations ({tournament.registrations.length})
            </h2>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tournament.registrations.map((registration) => (
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
    </>,
  );
};

export default TournamentDetails;
