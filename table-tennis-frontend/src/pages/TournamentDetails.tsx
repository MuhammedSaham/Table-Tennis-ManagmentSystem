import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
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
  categories: Category[];
  registrations: Registration[];
  matches?: Match[];
}

const TournamentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [registering, setRegistering] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [tournamentType, setTournamentType] = useState("KNOCKOUT");
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [refreshGroups, setRefreshGroups] = useState(0);
  const [refreshKnockout, setRefreshKnockout] = useState(0);
  //const [creatingGroups, setCreatingGroups] = useState(false);
  const [_generatingMatches, setGeneratingMatches] = useState(false);
  const [playerAge, setPlayerAge] = useState<number | null>(null);
  const [playerGender, setPlayerGender] = useState<string | null>(null);
  const [winners, setWinners] = useState<{
    first: any;
    second: any;
    third: any;
  } | null>(null);
  const [showWinners, setShowWinners] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    venue: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    maxPlayers: "",
  });
  const [editCategories, setEditCategories] = useState<Category[]>([]);
  
  // Doubles Pairing States
  const [partnerModalCategory, setPartnerModalCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [myPendingInvites, setMyPendingInvites] = useState<any[]>([]);
  const [mySentInvites, setMySentInvites] = useState<any[]>([]);
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null);

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showKnockoutModal, setShowKnockoutModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
  }, [id, user]);

  useEffect(() => {
    if (tournament?.categories?.length && !activeCategoryId) {
      setActiveCategoryId(tournament.categories[0].id);
    }
  }, [tournament?.categories, activeCategoryId]);

  useEffect(() => {
    if (tournament?.status === "COMPLETED") {
      fetchWinners();
    }
  }, [tournament?.status]);

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

  const fetchTournamentDetails = async () => {
    try {
      const response = await api.get(`/tournaments/${id}`);
      const tournamentData = response.data.data;

      if (user?.role === "ADMIN") {
        const regResponse = await api.get(
          `/registrations/tournaments/${id}${id}${selectedCategories ? `?categoryId=${selectedCategories}` : ""}`,
        );
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
      toast.success("Doubles partner invite accepted! You are officially registered.");
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
          const errorMsg =
            err.response?.data?.message || "Registration failed";
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

  const handleRecordScores = () => {
    if (!activeCategoryId) {
      toast.error("Please select a category first");
      return;
    }
    setShowScoreModal(true);
  };

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
    if (
      !window.confirm("This will create matches for this category. Continue?")
    )
      return;
    setGenerating(categoryId);
    try {
      await api.post(
        `/brackets/tournaments/${id}/categories/${categoryId}/generate`,
      );
      toast.success("Bracket generated successfully!");
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

  const fetchWinners = async () => {
    if (!activeCategoryId) {
      toast.error("Please select a category first.");
      return;
    }
    try {
      const matchesResponse = await api.get(`/matches/tournaments/${id}?categoryId=${activeCategoryId}`);
      const allMatches = matchesResponse.data.data;
      const finalMatch = allMatches.find(
        (m: any) =>
          m.round && (m.round.trim().toLowerCase() === "final" ||
          m.round.trim().toLowerCase() === "finals"),
      );
      const thirdPlaceMatch = allMatches.find((m: any) =>
        m.round && m.round.includes("3rd Place"),
      );
      let champion = null,
        runnerUp = null,
        thirdPlace = null;
      if (finalMatch && finalMatch.winnerId) {
        const isPlayer1Winner = finalMatch.winnerId === finalMatch.player1Id;
        champion = isPlayer1Winner ? finalMatch.player1 : finalMatch.player2;
        runnerUp = isPlayer1Winner ? finalMatch.player2 : finalMatch.player1;
      }
      if (thirdPlaceMatch && thirdPlaceMatch.winnerId) {
        const isPlayer1Winner =
          thirdPlaceMatch.winnerId === thirdPlaceMatch.player1Id;
        thirdPlace = isPlayer1Winner
          ? thirdPlaceMatch.player1
          : thirdPlaceMatch.player2;
      }
      setWinners({ first: champion, second: runnerUp, third: thirdPlace });
      setShowWinners(true);
      setTimeout(() => {
        document.getElementById("winners-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Failed to fetch winners", error);
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );

  if (!id) {
    return wrapInBaseLayout(
      <div className="flex flex-col items-center justify-center rounded-[16px] border border-white/20 bg-[#061D23]/25 p-12 text-center backdrop-blur-xl">
        <h2 className="text-xl font-black uppercase tracking-wider text-white">Invalid Tournament ID</h2>
      </div>
    );
  }

  if (loading) {
    return wrapInBaseLayout(
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-white/20 border-t-[#4AEEFF] rounded-full animate-spin" />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
          Loading tournament details...
        </p>
      </div>
    );
  }

  if (!tournament) {
    return wrapInBaseLayout(
      <div className="flex flex-col items-center justify-center rounded-[16px] border border-white/20 bg-[#061D23]/25 p-12 text-center backdrop-blur-xl">
        <h2 className="text-xl font-black uppercase tracking-wider text-white">Tournament not found</h2>
      </div>
    );
  }

  const isRegistrationOpen =
    tournament.status === "UPCOMING" &&
    new Date() < new Date(tournament.registrationDeadline);
  const isPlayer = user?.role === "PLAYER";
  const isAdmin = user?.role === "ADMIN";
  const isReferee = user?.role === "REFEREE";

  const userRegistrations =
    tournament.registrations?.filter(
      (r) =>
        r.playerId === user?.id ||
        r.team?.members?.some((m) => m.playerId === user?.id),
    ) || [];
  const hasRegistration = userRegistrations.length > 0;
  const canRegister = isPlayer && isRegistrationOpen;

  const eligibleCategories = tournament.categories.filter(
    (c) => isPlayerEligibleForCategory(c, playerAge, playerGender).eligible,
  );
  const ineligibleCategories = tournament.categories.filter(
    (c) => !isPlayerEligibleForCategory(c, playerAge, playerGender).eligible,
  );

  const allEligibleRegistered =
    eligibleCategories.length > 0 &&
    eligibleCategories.every((cat) =>
      userRegistrations.some((r) => r.categoryId === cat.id || r.category?.id === cat.id),
    );

  // Function to check if category is doubles
  const isDoublesCategory = (categoryType: string) => {
    return categoryType === "DOUBLES" || categoryType === "MIXED";
  };

  return wrapInBaseLayout(
    <>
      {/* Tournament Hero Header */}
      <header className="rounded-[16px] border border-white/20 bg-[#061D23]/25 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="mb-3 h-[3px] w-16 bg-[#4AEEFF]" />
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40">
                Tournament Hub
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${getStatusColor(tournament.status)}`}>
                {tournament.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-[0.15em] text-white">
              {tournament.name}
            </h1>
            <p className="text-white/70 text-sm mt-2 max-w-2xl leading-relaxed">
              {tournament.description || "Official tournament event and match management."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {isAdmin && (
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
                        await api.patch(`/tournaments/${id}`, { status: "COMPLETED" });
                        toast.success("Tournament marked as completed!");
                        fetchTournamentDetails();
                        setTimeout(() => fetchWinners(), 500);
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
              onClick={fetchWinners}
              className="rounded-xl border border-amber-400/40 bg-amber-400/15 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-amber-300 hover:bg-amber-400 hover:text-[#061D23] transition-all shadow-md shadow-amber-400/10 active:scale-95"
            >
              🏆 Champions
            </button>
          </div>
        </div>

        {/* Quick Stat Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#4AEEFF]/80">📍 Venue</p>
            <p className="font-bold text-white text-sm mt-1 truncate">{tournament.venue}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#4AEEFF]/80">📅 Start Date</p>
            <p className="font-bold text-white text-sm mt-1 truncate">
              {new Date(tournament.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#4AEEFF]/80">🏁 End Date</p>
            <p className="font-bold text-white text-sm mt-1 truncate">
              {new Date(tournament.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#061D23]/40 p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#4AEEFF]/80">⏳ Reg. Deadline</p>
            <p className="font-bold text-white text-sm mt-1 truncate">
              {new Date(tournament.registrationDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
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
              ⚡ Action Required • Doubles Partner Invitations ({myPendingInvites.length})
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
                    <span className="text-white font-bold">{inv.category?.name}</span>{" "}
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
                    {respondingInviteId === inv.id ? "Enrolling..." : "✓ Accept & Confirm Team"}
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#061D23]/95 border border-[#4AEEFF]/30 rounded-2xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-white custom-scrollbar">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-6 bg-[#4AEEFF] rounded-full shadow-[0_0_10px_#4AEEFF]"></span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  EDIT TOURNAMENT
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Tournament Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-[#4AEEFF] focus:ring-1 focus:ring-[#4AEEFF] text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-[#4AEEFF] focus:ring-1 focus:ring-[#4AEEFF] text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-[#4AEEFF] focus:ring-1 focus:ring-[#4AEEFF] text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-[#4AEEFF] focus:ring-1 focus:ring-[#4AEEFF] text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-[#4AEEFF] focus:ring-1 focus:ring-[#4AEEFF] text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-[#4AEEFF] focus:ring-1 focus:ring-[#4AEEFF] text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-[#4AEEFF] focus:ring-1 focus:ring-[#4AEEFF] text-sm transition"
                  min="2"
                />
              </div>

              {/* Categories Section */}
              <div className="border-t border-white/10 pt-5 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Tournament Categories
                    </h3>
                    <p className="text-xs text-slate-400">Configure divisions and participant limits</p>
                  </div>
                  <button
                    type="button"
                    onClick={addEditCategory}
                    className="bg-[#4AEEFF]/15 border border-[#4AEEFF]/40 text-[#4AEEFF] px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-[#4AEEFF]/25 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <span>+</span> Add Category
                  </button>
                </div>

                <div className="space-y-3.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {editCategories.map((category, index) => (
                    <div
                      key={category.id}
                      className="border border-white/10 rounded-xl p-4 bg-white/5 backdrop-blur-sm space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#4AEEFF] uppercase tracking-wider">Category {index + 1}</span>
                        {editCategories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEditCategory(index)}
                            className="text-red-400 hover:text-red-300 text-xs font-bold transition flex items-center gap-1"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Category Name
                          </label>
                          <input
                            type="text"
                            placeholder="Category Name"
                            value={category.name}
                            onChange={(e) =>
                              updateEditCategory(index, "name", e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-[#4AEEFF]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Match Type
                          </label>
                          <select
                            value={category.type}
                            onChange={(e) =>
                              updateEditCategory(index, "type", e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white text-xs focus:outline-none focus:border-[#4AEEFF]"
                          >
                            <option value="SINGLES">Singles</option>
                            <option value="DOUBLES">Doubles</option>
                            <option value="TEAM">Team</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Gender Division
                          </label>
                          <select
                            value={category.gender || ""}
                            onChange={(e) =>
                              updateEditCategory(
                                index,
                                "gender",
                                (e.target.value as "MALE" | "FEMALE" | "MIXED") || undefined,
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white text-xs focus:outline-none focus:border-[#4AEEFF]"
                          >
                            <option value="">Mixed / Open</option>
                            <option value="MALE">Men's Only</option>
                            <option value="FEMALE">Women's Only</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
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
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-[#4AEEFF]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
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
                              className="w-1/2 px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-[#4AEEFF]"
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
                              className="w-1/2 px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-[#4AEEFF]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {editCategories.length === 0 && (
                  <p className="text-slate-400 text-center py-4 text-xs">
                    No categories. Click "+ Add Category" to create one.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleUpdateTournament}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#4AEEFF] to-[#00b4d8] text-black font-extrabold text-sm tracking-wider uppercase hover:brightness-110 shadow-[0_0_20px_rgba(74,238,255,0.3)] transition"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 font-bold text-sm tracking-wider uppercase transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories & Bracket Draw Section */}
      <div className="rounded-[20px] border border-white/20 bg-[#061D23]/35 p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-2 h-5 bg-[#4AEEFF] rounded-full shadow-[0_0_10px_#4AEEFF]"></span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                Categories & Draws
              </h2>
              {tournament.categories.length > 0 && (
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/30">
                  {tournament.categories.length} {tournament.categories.length === 1 ? "Division" : "Divisions"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              Select a division below to view bracket draws, fixtures, and registered participants
            </p>
          </div>

          {tournament.categories.length > 0 && (
            <div className="flex items-center gap-2.5 self-stretch sm:self-auto bg-black/30 border border-white/10 p-1.5 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4AEEFF] pl-2 whitespace-nowrap">
                Active Draw:
              </span>
              <select
                value={activeCategoryId}
                onChange={(e) => setActiveCategoryId(e.target.value)}
                className="w-full sm:w-auto rounded-lg border border-white/15 bg-[#061D23] px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-[#4AEEFF] cursor-pointer"
              >
                {tournament.categories.map((category) => (
                  <option key={category.id} value={category.id} className="bg-[#061D23]">
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
                  (category.currentParticipants / category.maxParticipants) * 100,
                ) || 0;
              const isFull =
                category.currentParticipants >= category.maxParticipants;
              const spotsLeft =
                category.maxParticipants - category.currentParticipants;

              return (
                <div
                  key={category.id}
                  onClick={() => setActiveCategoryId(category.id)}
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
                          {tournamentType === "GROUP_KNOCKOUT"
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
                          {category.currentParticipants} / {category.maxParticipants}{" "}
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
                  {isAdmin && tournamentType === "KNOCKOUT" && (
                    <div className="p-3.5 bg-black/25 border-t border-white/10 mt-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateBracket(category.id);
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
      {tournamentType === "GROUP_KNOCKOUT" && activeCategoryId && (
        <div className="rounded-[16px] border border-white/20 bg-[#061D23]/25 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6">
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
            {isAdmin && (
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
            isAdminOrReferee={isAdmin}
            onScoreUpdate={fetchTournamentDetails}
            key={`groups-${activeCategoryId}-${refreshGroups}`}
          />
        </div>
      )}

      {/* Knockout Bracket Section */}
      {activeCategoryId && (
        <div className="w-full mb-8 pt-2" style={{ minHeight: 200 }}>
          {isAdmin && tournamentType === "KNOCKOUT" && (
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
      {showWinners && winners && (
        <div id="winners-section" className="rounded-[16px] border border-amber-400/30 bg-[#061D23]/35 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6">
          <h2 className="text-2xl font-black uppercase tracking-widest text-amber-300 mb-6 text-center">
            🏆 Tournament Champions 🏆
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-6 backdrop-blur-md">
              <div className="text-5xl mb-2">🥇</div>
              <h3 className="font-black text-xs uppercase tracking-wider text-yellow-300">Champion</h3>
              <p className="text-xl font-bold text-white mt-1">
                {winners.first?.firstName} {winners.first?.lastName}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-300/40 bg-slate-300/10 p-6 backdrop-blur-md">
              <div className="text-5xl mb-2">🥈</div>
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-300">Runner-up</h3>
              <p className="text-xl font-bold text-white mt-1">
                {winners.second?.firstName} {winners.second?.lastName}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-600/40 bg-amber-600/10 p-6 backdrop-blur-md">
              <div className="text-5xl mb-2">🥉</div>
              <h3 className="font-black text-xs uppercase tracking-wider text-amber-400">
                Second Runner-up
              </h3>
              <p className="text-xl font-bold text-white mt-1">
                {winners.third?.firstName} {winners.third?.lastName || "TBD"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form with Age Filtering */}
      {canRegister && tournament.categories.length > 0 && (
        <div className="rounded-[16px] border border-white/20 bg-[#061D23]/25 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6">
          <h3 className="text-xl font-black uppercase tracking-wider text-white mb-2">
            Register for this Tournament
          </h3>
          {playerAge !== null && (
            <div className="rounded-xl border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 p-3.5 mb-4 text-xs font-mono text-[#4AEEFF]">
              Your verified age: <strong className="text-white text-sm">{playerAge} years</strong>
            </div>
          )}

          <p className="text-xs uppercase tracking-wider text-white/60 mb-3 font-semibold">
            Select categories to register:
          </p>

          <div className="space-y-3 mb-4">
            {eligibleCategories.map((category) => {
              const categoryRegistration = userRegistrations.find(
                (r) => r.categoryId === category.id || r.category?.id === category.id,
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

              return (
                <div
                  key={category.id}
                  className={`rounded-xl border transition-all p-4 ${
                    isAlreadyRegistered
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : isSelected
                      ? "border-[#4AEEFF] bg-[#4AEEFF]/15 shadow-md shadow-[#4AEEFF]/10"
                      : "border-white/10 bg-[#061D23]/40 hover:border-white/20"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 flex-1">
                      {isAlreadyRegistered ? (
                        <div className="w-5 h-5 rounded-md bg-emerald-500/25 border border-emerald-400/60 flex items-center justify-center text-emerald-300 font-black text-xs shadow-[0_0_10px_rgba(16,185,129,0.3)] flex-shrink-0">
                          ✓
                        </div>
                      ) : isDoubles ? (
                        <div className="w-5 h-5 rounded-md bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-black text-xs flex-shrink-0">
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
                          className="w-4 h-4 rounded border-white/30 text-[#4AEEFF] focus:ring-[#4AEEFF] cursor-pointer"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`font-bold text-sm ${
                              isAlreadyRegistered ? "text-emerald-100" : "text-white"
                            }`}
                          >
                            {category.name}
                          </p>
                          {category.gender && category.gender !== "MIXED" && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/30">
                              {category.gender === "MALE" ? "♂ Men's Only" : "♀ Women's Only"}
                            </span>
                          )}
                          {category.gender === "MIXED" && (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              ⚤ Mixed Gender
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/60 mt-0.5">
                          {category.type} • {category.currentParticipants} / {category.maxParticipants} participants
                          {isDoubles && (
                            <span className="ml-2 font-semibold text-[#4AEEFF]">
                              (Doubles team - partner invite required)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                      {isAlreadyRegistered ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                            <span>✓</span> Enrolled
                            {categoryRegistration.status && (
                              <span className="text-[10px] opacity-80 font-mono">
                                ({categoryRegistration.status})
                              </span>
                            )}
                          </div>
                          {categoryRegistration.team?.members && categoryRegistration.team.members.length > 0 && (
                            <span className="text-[11px] text-cyan-300 font-medium">
                              Partner:{" "}
                              {categoryRegistration.team.members
                                .filter((m) => m.playerId !== user?.id)
                                .map((m) => `${m.player?.firstName || ""} ${m.player?.lastName || ""}`.trim())
                                .filter(Boolean)
                                .join(", ") || (categoryRegistration.playerId !== user?.id ? `${categoryRegistration.player?.firstName || ""} ${categoryRegistration.player?.lastName || ""}`.trim() : "Confirmed Partner")}
                            </span>
                          )}
                        </div>
                      ) : isFull ? (
                        <span className="text-xs font-black uppercase tracking-wider text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded">
                          Full
                        </span>
                      ) : isDoubles ? (
                        pendingReceivedInvite ? (
                          <div className="flex items-center gap-2 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 rounded-xl">
                            <span className="text-xs font-bold text-cyan-300">
                              Invited by {pendingReceivedInvite.inviter?.firstName}
                            </span>
                            <button
                              onClick={() => handleAcceptInvite(pendingReceivedInvite.id)}
                              disabled={respondingInviteId === pendingReceivedInvite.id}
                              className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-sm hover:brightness-110 active:scale-95 transition-all"
                            >
                              ✓ Accept
                            </button>
                            <button
                              onClick={() => handleDeclineInvite(pendingReceivedInvite.id)}
                              disabled={respondingInviteId === pendingReceivedInvite.id}
                              className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ) : pendingSentInvite ? (
                          <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                            <span className="text-xs text-amber-300 font-medium">
                              ⏳ Invited {pendingSentInvite.invitee?.firstName} {pendingSentInvite.invitee?.lastName}
                            </span>
                            <button
                              onClick={() => handleCancelSentInvite(pendingSentInvite.id)}
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
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_4px_12px_rgba(74,238,255,0.25)] transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <span>🤝</span>
                            <span>Invite Partner</span>
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show ineligible categories (disabled) */}
          {ineligibleCategories.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-xs text-white/50 mb-2 uppercase tracking-wider">
                Ineligible for these categories:
              </p>
              {ineligibleCategories.map((category) => {
                const eligibility = isPlayerEligibleForCategory(
                  category,
                  playerAge,
                  playerGender,
                );
                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 border border-white/10 rounded-xl bg-white/5 opacity-50 mb-2 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        disabled
                        className="w-4 h-4 rounded text-gray-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white/70">{category.name}</p>
                          {category.gender && category.gender !== "MIXED" && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-white/10 text-white/50 border border-white/10">
                              {category.gender === "MALE" ? "Men's" : "Women's"}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/40">{category.type}</p>
                      </div>
                    </div>
                    <span className="text-xs text-red-400 font-mono font-bold">
                      {eligibility.reason}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {selectedCategories.length > 0 && (
            <div className="rounded-xl border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 p-3 mb-4 text-xs font-mono text-[#4AEEFF]">
              Selected {selectedCategories.length} category(s)
            </div>
          )}

          <div className="flex gap-3 mt-4">
            {allEligibleRegistered ? (
              <div className="flex-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 py-3 px-4 text-xs font-black uppercase tracking-wider text-emerald-300 text-center flex items-center justify-center gap-2 shadow-sm">
                <span className="text-sm">✓</span> You Are Registered for This Tournament
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={registering || selectedCategories.length === 0}
                className="flex-1 rounded-xl bg-[#4AEEFF] py-3 text-xs font-black uppercase tracking-wider text-[#061D23] hover:bg-white transition-all disabled:opacity-50 shadow-md shadow-[#4AEEFF]/20"
              >
                {registering
                  ? "Registering..."
                  : `Register for ${selectedCategories.length} Category(s)`}
              </button>
            )}
            <button
              onClick={() => setShowGuestModal(true)}
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10 transition-all"
            >
              Register as Guest
            </button>
          </div>
        </div>
      )}

      {hasRegistration && (
        <div className="rounded-[16px] border border-white/20 bg-[#061D23]/25 p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6 flex items-center flex-wrap gap-2">
          <p className="text-xs uppercase tracking-wider font-bold text-[#4AEEFF]">Your registration status:</p>
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

      {/* Registrations Section */}
      {(isAdmin || isReferee) && tournament.registrations?.length > 0 && (
        <div className="rounded-[16px] border border-white/20 bg-[#061D23]/25 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl mb-6">
          <h2 className="text-xl font-black uppercase tracking-wider text-white mb-4">
            Registrations ({tournament.registrations.length})
          </h2>
          <div className="overflow-x-auto">
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
                  <tr key={registration.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {registration.team?.members && registration.team.members.length > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-sm">
                            {registration.team.members
                              .map((m) => `${m.player?.firstName || ""} ${m.player?.lastName || ""}`.trim())
                              .filter(Boolean)
                              .join(" & ") || `${registration.player?.firstName || ""} ${registration.player?.lastName || ""}`}
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
                          {registration.player?.firstName} {registration.player?.lastName}
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/30">
                        {registration.category?.name || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {registration.team?.members && registration.team.members.length > 0
                        ? registration.team.members
                            .map((m) => m.player?.email)
                            .filter(Boolean)
                            .join(", ")
                        : registration.player?.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-white/50 font-mono">
                      {new Date(registration.registeredAt).toLocaleDateString()}
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
                    style={{ fontWeight: 800, color: "#fca5a5", fontSize: 16, textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    Reset Knockout Stage
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
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
                This will permanently delete{" "}
                <strong style={{ color: "#fff" }}>all knockout matches and recorded scores</strong>. Group stage results will remain intact.
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
                You will need to regenerate the knockout bracket after resetting.
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
        document.body
      )}
    </>
  );
};

export default TournamentDetails;
