import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import GlassSelect from "../components/GlassSelect";
import { useAuth } from "../context/AuthContext";
import api, { getProfileImageUrl } from "../services/api";
import toast from "react-hot-toast";
import {
  TrophyIcon,
  ChartBarIcon,
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  IdentificationIcon,
  UserGroupIcon,
  EyeIcon,
  EyeSlashIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: string;
  gamesStats: {
    won: number;
    lost: number;
    total: number;
  };
  pointsStats: {
    scored: number;
    conceded: number;
    averagePerGame: string;
  };
  recentMatches: Array<{
    id: string;
    tournamentName: string;
    categoryName: string;
    opponent: string;
    result: string;
    score: string;
    date: string;
  }>;
  allMatches?: Array<any>;
}

interface TournamentHonor {
  id: string;
  tournamentName: string;
  categoryName: string;
  type: "GOLD" | "SILVER" | "BRONZE";
  title: string;
  date?: string;
}

const getPlayerHonors = (matches: any[] | undefined, playerId: string): TournamentHonor[] => {
  if (!matches || !Array.isArray(matches)) return [];
  const honors: TournamentHonor[] = [];
  const processedTournamentCategories = new Set<string>();

  for (const match of matches) {
    if (match.status !== "COMPLETED") continue;
    const tourneyName = match.tournament?.name || "Official Championship";
    const catName = match.category?.name || "Singles";
    const key = `${match.tournament?.id || tourneyName}-${catName}`;

    const roundName = (match.round || "").toLowerCase();
    const isWinner = match.winnerId === playerId;

    if (roundName.includes("final") && !roundName.includes("semi") && !roundName.includes("quarter")) {
      if (!processedTournamentCategories.has(key)) {
        processedTournamentCategories.add(key);
        if (isWinner) {
          honors.push({
            id: match.id,
            tournamentName: tourneyName,
            categoryName: catName,
            type: "GOLD",
            title: "Champion",
            date: match.endTime,
          });
        } else {
          honors.push({
            id: match.id,
            tournamentName: tourneyName,
            categoryName: catName,
            type: "SILVER",
            title: "Runner-Up",
            date: match.endTime,
          });
        }
      }
    } else if (roundName.includes("semi")) {
      if (!processedTournamentCategories.has(key)) {
        processedTournamentCategories.add(key);
        honors.push({
          id: match.id,
          tournamentName: tourneyName,
          categoryName: catName,
          type: "BRONZE",
          title: "Semi-Finalist",
          date: match.endTime,
        });
      }
    }
  }

  return honors;
};

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  createdAt?: string;
  profileImage?: string;
  permissions?: string[];
  playerProfile?: {
    skillLevel: string;
    clubAffiliation: string;
    dateOfBirth: string | null;
    gender: "MALE" | "FEMALE" | null;
  };
  refereeProfile?: {
    certification: string;
    experienceYears: number;
  };
  adminProfile?: {
    department: string;
  };
}

const permissionLabel = (permission: string) =>
  permission
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const Profile: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const { userId: viewedUserId } = useParams<{ userId: string }>();
  const isViewingOtherProfile = Boolean(viewedUserId);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const isOwnProfile = Boolean(user?.id && profile?.id === user.id);

  const [activeProfileTab, setActiveProfileTab] = useState<
    "OVERVIEW" | "PERFORMANCE" | "TEAMS" | "ACCOUNT"
  >("OVERVIEW");

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [changingPassword, setChangingPassword] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    playerProfile: {
      skillLevel: "Intermediate",
      clubAffiliation: "",
      gender: "",
      dateOfBirth: "",
    },
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [_statsLoading, setStatsLoading] = useState(false);
  const [_isFavorited, setIsFavorited] = useState(false);
  const [_totalFavorites, setTotalFavorites] = useState(0);
  const [_favoriteLoading, _setFavoriteLoading] = useState(false);

  const [membershipStatus, setMembershipStatus] = useState<any>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipRequesting, setMembershipRequesting] = useState(false);

  const [doublesRegistrations, setDoublesRegistrations] = useState<any[]>([]);
  const [profileReceivedInvites, setProfileReceivedInvites] = useState<any[]>(
    [],
  );
  const [profileSentInvites, setProfileSentInvites] = useState<any[]>([]);
  const [activeDoublesTab, setActiveDoublesTab] = useState<
    "ACTIVE" | "RECEIVED" | "SENT"
  >("ACTIVE");

  useEffect(() => {
    fetchProfile();
  }, [viewedUserId]);

  useEffect(() => {
    if (profile?.role === "PLAYER") {
      fetchPlayerStats(profile.id);
      if (!isViewingOtherProfile) {
        fetchDoublesData();
        fetchMembershipStatus();
      }
    }
  }, [profile?.id, profile?.role, isViewingOtherProfile]);

  const fetchDoublesData = async () => {
    if (user?.role !== "PLAYER") return;
    try {
      const [regsRes, receivedRes, sentRes] = await Promise.all([
        api.get("/registrations/my-registrations"),
        api.get("/teams/invites/my-invites"),
        api.get("/teams/invites/sent-invites"),
      ]);
      const allRegs = regsRes.data.data || [];
      const doublesOnly = allRegs.filter(
        (r: any) =>
          r.teamId ||
          r.team ||
          (r.category?.type &&
            (r.category.type === "DOUBLES" ||
              r.category.type.includes("DOUBLES") ||
              r.category.type === "MIXED")),
      );
      setDoublesRegistrations(doublesOnly);
      setProfileReceivedInvites(receivedRes.data.data || []);
      setProfileSentInvites(sentRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch profile doubles data", err);
    }
  };

  const handleProfileAcceptInvite = async (inviteId: string) => {
    try {
      await api.post(`/teams/invites/${inviteId}/accept`);
      toast.success("Doubles partner invite accepted! Team confirmed 🎉");
      fetchDoublesData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to accept invite");
    }
  };

  const handleProfileDeclineInvite = async (inviteId: string) => {
    try {
      await api.post(`/teams/invites/${inviteId}/decline`);
      toast.success("Invite declined");
      fetchDoublesData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to decline invite");
    }
  };

  const handleProfileCancelInvite = async (inviteId: string) => {
    try {
      await api.delete(`/teams/invites/${inviteId}/cancel`);
      toast.success("Invite cancelled");
      fetchDoublesData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel invite");
    }
  };

  const fetchMembershipStatus = async () => {
    if (user?.role !== "PLAYER") return;

    setMembershipLoading(true);

    try {
      const response = await api.get("/club-membership/status");
      setMembershipStatus(response.data.data);
    } catch (error) {
      console.error("Failed to fetch membership status", error);
    } finally {
      setMembershipLoading(false);
    }
  };
  const handleRequestMembership = async () => {
    if (membershipRequesting) return;

    setMembershipRequesting(true);

    try {
      const response = await api.post("/club-membership/request");

      toast.success(
        response.data.message ||
          "Club membership request submitted successfully!",
      );

      await fetchMembershipStatus();
    } catch (error: any) {
      console.error("Failed to request club membership", error);

      toast.error(
        error?.response?.data?.message || "Failed to submit membership request",
      );
    } finally {
      setMembershipRequesting(false);
    }
  };

  const fetchPlayerStats = async (playerId: string) => {
    setStatsLoading(true);
    try {
      const response = await api.get(
        isViewingOtherProfile
          ? `/matches/player-performance/${playerId}`
          : "/matches/my-performance",
      );
      setPlayerStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch player stats", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get(
        isViewingOtherProfile ? `/users/${viewedUserId}` : "/users/profile",
      );
      const profileData = response.data.data;
      setProfile(profileData);
      if (isViewingOtherProfile && profileData.role === "PLAYER") {
        const publicProfile = await api.get(`/users/public/${profileData.id}`);
        setIsFavorited(Boolean(publicProfile.data.data.isFavorited));
        setTotalFavorites(Number(publicProfile.data.data.totalFavorites) || 0);
      }
      setFormData({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        phone: profileData.phone || "",
        playerProfile: {
          skillLevel: profileData.playerProfile?.skillLevel || "Intermediate",
          clubAffiliation: profileData.playerProfile?.clubAffiliation || "",
          gender: profileData.playerProfile?.gender || "",
          dateOfBirth: profileData.playerProfile?.dateOfBirth
            ? new Date(profileData.playerProfile.dateOfBirth).toISOString().split("T")[0]
            : "",
        },
      });
    } catch (error) {
      toast.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success(response.data.message || "Password changed successfully!");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowChangePassword(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };

      if (user?.role === "PLAYER") {
        updateData.playerProfile = {
          skillLevel: formData.playerProfile.skillLevel,
          clubAffiliation: formData.playerProfile.clubAffiliation,
          ...(formData.playerProfile.gender
            ? { gender: formData.playerProfile.gender }
            : {}),
          ...(formData.playerProfile.dateOfBirth
            ? { dateOfBirth: new Date(formData.playerProfile.dateOfBirth).toISOString() }
            : {}),
        };
      }

      await api.patch("/users/profile", updateData);
      toast.success("Profile updated successfully!");
      setEditing(false);
      await fetchProfile();
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (
      name === "skillLevel" ||
      name === "clubAffiliation" ||
      name === "gender" ||
      name === "dateOfBirth"
    ) {
      setFormData((prev) => ({
        ...prev,
        playerProfile: {
          ...prev.playerProfile,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUploadProfileImage = async () => {
    if (!profileImage) {
      toast.error("Please select an image first");
      return;
    }

    setUploading(true);
    try {
      const imageFormData = new FormData();
      imageFormData.append("profileImage", profileImage);

      await api.post("/users/upload-profile-image", imageFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Profile picture updated successfully!");
      fetchProfile();
      await refetchUser();
      setProfileImage(null);
      setImagePreview(null);
    } catch (error) {
      toast.error("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const getPlayerAgeCategory = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    let category = "";
    if (age < 9) category = "Under 9";
    else if (age < 11) category = "Under 11";
    else if (age < 13) category = "Under 13";
    else if (age < 15) category = "Under 15";
    else if (age < 17) category = "Under 17";
    else if (age < 19) category = "Under 19";
    else if (age < 40) category = "Open";
    else if (age < 50) category = "Seniors (40+)";
    else if (age < 60) category = "Masters (50+)";
    else category = "Veterans (60+)";

    return { age, category };
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col space-y-6 px-4 sm:px-6 lg:px-10 xl:px-14 py-4 sm:py-6 lg:py-8">
        {children}
      </div>
    </div>
  );

  if (loading && !profile) {
    return wrapInBaseLayout(
      <div className="flex h-[50vh] items-center justify-center text-xl font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
        Loading profile...
      </div>,
    );
  }

  if (!profile) {
    return wrapInBaseLayout(
      <div className="mx-auto max-w-md rounded-[16px] border border-white/20 bg-[#061D23]/8 p-8 text-center backdrop-blur-xl">
        <p className="text-lg font-bold uppercase tracking-wider text-white">
          Profile not found
        </p>
      </div>,
    );
  }

  return wrapInBaseLayout(
    <>
      {/* ─── COMPACT PROFILE HEADER ─── */}
      <header className="rounded-2xl border border-white/15 bg-[#061D23]/25 p-4 shadow-lg backdrop-blur-xl sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <BackButton
            to={isViewingOtherProfile ? "/app/users" : "/app/dashboard"}
            label={
              isViewingOtherProfile ? "Back to Users" : "Back to Dashboard"
            }
          />

          <div className="flex items-center gap-2">
            {profile.role === "PLAYER" && (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="rounded-lg border border-[#4AEEFF]/40 bg-[#4AEEFF]/15 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-[#4AEEFF] transition-all hover:bg-[#4AEEFF] hover:text-[#061D23] flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Share Public Profile Link & QR Code"
              >
                <ShareIcon className="h-4 w-4" />
                <span>Share Profile</span>
              </button>
            )}

            {!editing && !isViewingOtherProfile && (
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg bg-[#4AEEFF] px-4 py-2 text-xs font-bold uppercase text-[#061D23] transition-colors hover:bg-white active:scale-95"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center justify-center">
            {profile.profileImage ? (
              <img
                src={getProfileImageUrl(profile.profileImage)}
                alt="Profile"
                className="h-16 w-16 rounded-full border-2 border-[#4AEEFF]/60 object-cover sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#4AEEFF]/50 bg-[#061D23]/60 text-lg font-bold text-[#4AEEFF] sm:h-20 sm:w-20 sm:text-xl">
                {(profile.firstName?.[0] || "").toUpperCase()}
                {(profile.lastName?.[0] || "").toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black uppercase tracking-wide text-white sm:text-2xl">
              {profile.firstName} {profile.lastName}
            </h1>

            <span className="mt-1 inline-block rounded-md border border-[#4AEEFF]/30 bg-[#4AEEFF]/15 px-2 py-1 text-[10px] font-bold uppercase text-[#4AEEFF]">
              {profile.role === "SUPER_ADMIN" ? "SUPER ADMIN" : profile.role}
            </span>

            <div className="mt-3 flex flex-col gap-2 text-xs text-white/75 sm:flex-row sm:flex-wrap sm:gap-x-6">
              <span className="flex items-center gap-2 break-all">
                <EnvelopeIcon className="h-4 w-4 shrink-0 text-[#4AEEFF]" />
                {profile.email}
              </span>

              <span className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 shrink-0 text-[#4AEEFF]" />
                {profile.phone || "Not provided"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── PROFILE NAVIGATION TABS ─── */}
      {!editing && (
        <div className="flex w-full items-center gap-2 overflow-x-auto rounded-xl border border-white/10 bg-[#061D23]/25 p-1.5 backdrop-blur-xl sm:p-2">
          {[
            { id: "OVERVIEW", label: "Overview", icon: UserIcon },
            { id: "PERFORMANCE", label: "Performance", icon: ChartBarIcon },
            { id: "TEAMS", label: "Doubles Teams", icon: UserGroupIcon },
            {
              id: "ACCOUNT",
              label: "Account Settings",
              icon: IdentificationIcon,
            },
          ]
            .filter((tab) => {
              if (tab.id === "ACCOUNT" && !isOwnProfile) return false;
              if (
                (tab.id === "PERFORMANCE" || tab.id === "TEAMS") &&
                profile.role !== "PLAYER"
              )
                return false;
              if (tab.id === "TEAMS" && !isOwnProfile) return false;
              return true;
            })
            .map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveProfileTab(
                      tab.id as
                        | "OVERVIEW"
                        | "PERFORMANCE"
                        | "TEAMS"
                        | "ACCOUNT",
                    )
                  }
                  className={`flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-colors sm:px-4 sm:text-xs ${
                    activeProfileTab === tab.id
                      ? "bg-[#4AEEFF] text-[#061D23]"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
        </div>
      )}

      {!editing ? (
        <div className="space-y-4">
          {/* ─── SECURITY SETTINGS ─── */}
          {isOwnProfile && activeProfileTab === "ACCOUNT" && (
            <section className="rounded-xl border border-white/15 bg-[#061D23]/20 p-4 backdrop-blur-xl sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Security Settings
                  </h2>
                  <p className="mt-1 text-xs text-white/55">
                    Manage your account password and security.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (showChangePassword) {
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });

                      setShowPasswords({
                        currentPassword: false,
                        newPassword: false,
                        confirmPassword: false,
                      });
                    }

                    setShowChangePassword(!showChangePassword);
                  }}
                  className="w-fit rounded-lg border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 px-4 py-2 text-xs font-bold uppercase text-[#4AEEFF] transition-colors hover:bg-[#4AEEFF]/20"
                >
                  {showChangePassword ? "Cancel" : "Change Password"}
                </button>
              </div>

              {showChangePassword && (
                <form
                  onSubmit={handleChangePassword}
                  className="mt-4 space-y-4 border-t border-white/10 pt-4"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      { name: "currentPassword", label: "Current Password" },
                      { name: "newPassword", label: "New Password" },
                      {
                        name: "confirmPassword",
                        label: "Confirm New Password",
                      },
                    ].map((field) => (
                      <div
                        key={field.name}
                        className={
                          field.name === "currentPassword"
                            ? "md:col-span-2"
                            : ""
                        }
                      >
                        <label
                          htmlFor={`profile-${field.name}`}
                          className="mb-2 block text-xs font-semibold text-white/70"
                        >
                          {field.label}
                        </label>

                        <div className="relative">
                          <input
                            id={`profile-${field.name}`}
                            type={
                              showPasswords[
                                field.name as keyof typeof showPasswords
                              ]
                                ? "text"
                                : "password"
                            }
                            name={field.name}
                            value={
                              passwordData[
                                field.name as keyof typeof passwordData
                              ]
                            }
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                [e.target.name]: e.target.value,
                              }))
                            }
                            required
                            autoComplete={
                              field.name === "currentPassword"
                                ? "current-password"
                                : "new-password"
                            }
                            className="w-full rounded-lg border border-white/15 bg-[#061D23]/40 px-3 py-2.5 pr-11 text-sm text-white outline-none transition-colors focus:border-[#4AEEFF]/60"
                          />

                          <button
                            type="button"
                            aria-label={
                              showPasswords[
                                field.name as keyof typeof showPasswords
                              ]
                                ? `Hide ${field.label}`
                                : `Show ${field.label}`
                            }
                            aria-pressed={
                              showPasswords[
                                field.name as keyof typeof showPasswords
                              ]
                            }
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                [field.name]:
                                  !prev[field.name as keyof typeof prev],
                              }))
                            }
                            className="absolute inset-y-0 right-3 flex items-center text-white/50 transition-colors hover:text-[#4AEEFF]"
                          >
                            {showPasswords[
                              field.name as keyof typeof showPasswords
                            ] ? (
                              <EyeSlashIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-white/50">
                    Password must contain at least 8 characters, including an
                    uppercase letter, lowercase letter, and number.
                  </p>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="rounded-lg bg-[#4AEEFF] px-5 py-2.5 text-xs font-bold uppercase text-[#061D23] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {changingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* ─── ROLE-SPECIFIC PROFILES ─── */}

          {activeProfileTab === "OVERVIEW" &&
            profile.role === "PLAYER" &&
            profile.playerProfile && (
              <section className="rounded-xl border border-white/15 bg-[#061D23]/20 p-4 backdrop-blur-xl sm:p-5">
                <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                  <UserIcon className="h-5 w-5 text-[#4AEEFF]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Player Information
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-white/50">Skill Level</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {profile.playerProfile.skillLevel || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/50">Age</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {profile.playerProfile.dateOfBirth
                        ? `${
                            getPlayerAgeCategory(
                              new Date(profile.playerProfile.dateOfBirth),
                            ).age
                          } years`
                        : "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/50">Age Category</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {profile.playerProfile.dateOfBirth
                        ? getPlayerAgeCategory(
                            new Date(profile.playerProfile.dateOfBirth),
                          ).category
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/50">Gender</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {profile.playerProfile.gender === "MALE"
                        ? "Male"
                        : profile.playerProfile.gender === "FEMALE"
                          ? "Female"
                          : "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/50">Club Affiliation</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {profile.playerProfile.clubAffiliation ||
                        "None Specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/50">Date of Birth</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {profile.playerProfile.dateOfBirth
                        ? new Date(
                            profile.playerProfile.dateOfBirth,
                          ).toLocaleDateString()
                        : "Not provided"}
                    </p>
                  </div>
                </div>

                {/* ─── TROPHY CABINET & TOURNAMENT HONORS ─── */}
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrophyIcon className="h-4 w-4 text-amber-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        Trophy Cabinet & Tournament Honors
                      </h3>
                    </div>
                    <span className="text-[10px] text-white/50 font-mono">
                      {getPlayerHonors(playerStats?.allMatches, profile.id).length} Accolade{getPlayerHonors(playerStats?.allMatches, profile.id).length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {getPlayerHonors(playerStats?.allMatches, profile.id).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center">
                      <p className="text-xs text-white/50 italic">
                        No tournament honors recorded yet. Reach the semi-finals or finals of an official championship to earn official medal badges!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {getPlayerHonors(playerStats?.allMatches, profile.id).map((honor) => (
                        <div
                          key={honor.id}
                          className={`p-3 rounded-xl border flex items-center gap-3 backdrop-blur-md transition-all hover:scale-[1.01] ${
                            honor.type === "GOLD"
                              ? "bg-amber-500/10 border-amber-400/40 text-amber-200 shadow-sm shadow-amber-500/10"
                              : honor.type === "SILVER"
                              ? "bg-slate-300/10 border-slate-300/40 text-slate-200 shadow-sm shadow-slate-300/10"
                              : "bg-amber-700/10 border-amber-600/40 text-amber-300 shadow-sm shadow-amber-700/10"
                          }`}
                        >
                          <span className="text-2xl shrink-0">
                            {honor.type === "GOLD" ? "🏆" : honor.type === "SILVER" ? "🥈" : "🥉"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-black uppercase tracking-wider block font-mono">
                              {honor.title} · {honor.type === "GOLD" ? "Gold Medal" : honor.type === "SILVER" ? "Silver Medal" : "Bronze Medal"}
                            </span>
                            <p className="text-xs font-bold text-white truncate mt-0.5">
                              {honor.tournamentName}
                            </p>
                            <span className="text-[10px] text-white/60 block truncate">
                              {honor.categoryName}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

          {/* ─── CLUB MEMBERSHIP ─── */}
          {activeProfileTab === "ACCOUNT" &&
            isOwnProfile &&
            profile.role === "PLAYER" &&
            profile.playerProfile && (
              <section className="rounded-xl border border-white/15 bg-[#061D23]/20 p-4 backdrop-blur-xl sm:p-5">
                <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-3">
                  <div className="rounded-lg border border-[#4AEEFF]/20 bg-[#4AEEFF]/10 p-2 text-[#4AEEFF]">
                    <UserGroupIcon className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                      Club Membership
                    </h2>
                    <p className="mt-1 text-xs text-white/50">
                      Manage your table tennis club membership
                    </p>
                  </div>
                </div>

                {membershipLoading ? (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/60">
                      Checking membership status...
                    </p>
                  </div>
                ) : membershipStatus?.isClubMember ? (
                  /* APPROVED */
                  <div className="flex flex-col gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div>
                      <p className="text-sm font-bold text-white">
                        You are a Club Member
                      </p>
                      <p className="mt-1 text-xs text-white/55">
                        Your membership has been approved by an administrator.
                      </p>
                    </div>

                    <span className="inline-flex w-fit shrink-0 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase text-emerald-300">
                      ✓ Approved
                    </span>
                  </div>
                ) : membershipStatus?.request?.status === "PENDING" ? (
                  /* PENDING */
                  <div className="flex flex-col gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div>
                      <p className="text-sm font-bold text-white">
                        Membership Request Pending
                      </p>
                      <p className="mt-1 text-xs text-white/55">
                        Your request is waiting for administrator approval.
                      </p>
                    </div>

                    <span className="inline-flex w-fit shrink-0 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase text-amber-300">
                      Pending
                    </span>
                  </div>
                ) : membershipStatus?.request?.status === "REJECTED" ? (
                  /* REJECTED */
                  <div className="flex flex-col gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">
                        Membership Request Rejected
                      </p>

                      <p className="mt-1 break-words text-xs text-white/60">
                        Reason:{" "}
                        <span className="text-red-300">
                          {membershipStatus.request.rejectionReason ||
                            "No reason provided"}
                        </span>
                      </p>
                    </div>

                    {membershipStatus.request.rejectionCount < 3 ? (
                      <button
                        type="button"
                        onClick={handleRequestMembership}
                        disabled={membershipRequesting}
                        className="shrink-0 rounded-lg bg-[#4AEEFF] px-4 py-2.5 text-xs font-bold uppercase text-[#061D23] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {membershipRequesting
                          ? "Submitting..."
                          : "Request Again"}
                      </button>
                    ) : (
                      <span className="inline-flex w-fit shrink-0 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase text-red-300">
                        Permanently Rejected
                      </span>
                    )}
                  </div>
                ) : (
                  /* NOT A MEMBER */
                  <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div>
                      <p className="text-sm font-bold text-white">
                        You are not a club member
                      </p>
                      <p className="mt-1 text-xs text-white/55">
                        Submit a request to become a member of the club.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRequestMembership}
                      disabled={membershipRequesting}
                      className="shrink-0 rounded-lg bg-[#4AEEFF] px-4 py-2.5 text-xs font-bold uppercase text-[#061D23] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {membershipRequesting
                        ? "Submitting..."
                        : "Request Club Membership"}
                    </button>
                  </div>
                )}
              </section>
            )}

          {isViewingOtherProfile &&
            (profile.role === "ADMIN" || profile.role === "SUPER_ADMIN") &&
            profile.permissions && (
              <section className="rounded-[16px] border border-white/20 bg-[#061D23]/5 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-lg bg-[#4AEEFF]/20 p-2 text-[#4AEEFF]">
                    <IdentificationIcon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold uppercase tracking-wider text-white">
                    Permissions
                  </h2>
                </div>
                {profile.permissions.length === 0 ? (
                  <p className="text-sm text-white/60">
                    No permissions assigned yet.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {profile.permissions.map((permission) => (
                      <div
                        key={permission}
                        className="rounded-[12px] border border-[#4AEEFF]/20 bg-[#4AEEFF]/10 px-4 py-3 text-sm font-bold text-[#B8F7FF]"
                      >
                        {permissionLabel(permission)}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

          {/* ─── PERFORMANCE PERFORMANCE GRAPH MATRIX ─── */}

          {/* ─── COMPACT PERFORMANCE ANALYSIS ─── */}
          {activeProfileTab === "PERFORMANCE" &&
            profile.role === "PLAYER" &&
            playerStats && (
              <section className="space-y-4">
                {/* SECTION TITLE */}
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-[#4AEEFF]" />
                  <h2 className="text-base font-bold uppercase tracking-wider text-white">
                    Performance Analysis
                  </h2>
                </div>

                {/* MATCH STATISTICS */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      label: "Total Matches",
                      value: playerStats.totalMatches,
                      color: "text-[#4AEEFF]",
                    },
                    {
                      label: "Wins",
                      value: playerStats.wins,
                      color: "text-emerald-400",
                    },
                    {
                      label: "Losses",
                      value: playerStats.losses,
                      color: "text-red-400",
                    },
                    {
                      label: "Win Rate",
                      value: playerStats.winRate,
                      color: "text-[#4AEEFF]",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/10 bg-[#061D23]/30 p-4 text-center backdrop-blur-xl"
                    >
                      <p className={`text-2xl font-black ${stat.color}`}>
                        {stat.value}
                      </p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-white/55">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* GAME & POINTS ANALYSIS */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* GAME PERFORMANCE */}
                  <div className="rounded-xl border border-white/10 bg-[#061D23]/25 p-4 backdrop-blur-xl sm:p-5">
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
                      Games Performance
                    </h3>

                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-white/50">Games Won</p>
                        <p className="text-xl font-bold text-[#4AEEFF]">
                          {playerStats.gamesStats.won}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] text-white/50">Games Lost</p>
                        <p className="text-xl font-bold text-red-400">
                          {playerStats.gamesStats.lost}
                        </p>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#4AEEFF] transition-all duration-500"
                        style={{
                          width: `${
                            playerStats.gamesStats.total > 0
                              ? (playerStats.gamesStats.won /
                                  playerStats.gamesStats.total) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-right text-[11px] text-white/50">
                      Total Games: {playerStats.gamesStats.total}
                    </p>
                  </div>

                  {/* POINTS PERFORMANCE */}
                  <div className="rounded-xl border border-white/10 bg-[#061D23]/25 p-4 backdrop-blur-xl sm:p-5">
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
                      Points Performance
                    </h3>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-[11px] text-white/50">Scored</p>
                        <p className="mt-2 text-xl font-bold text-[#4AEEFF]">
                          {playerStats.pointsStats.scored}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-white/50">Conceded</p>
                        <p className="mt-2 text-xl font-bold text-red-400">
                          {playerStats.pointsStats.conceded}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-white/50">Avg/Game</p>
                        <p className="mt-2 text-xl font-bold text-white">
                          {playerStats.pointsStats.averagePerGame}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RECENT MATCH HISTORY */}
                <div className="rounded-xl border border-white/10 bg-[#061D23]/25 p-4 backdrop-blur-xl sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-[#4AEEFF]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Recent Match History
                    </h3>
                  </div>

                  {playerStats.recentMatches.length > 0 ? (
                    <div className="divide-y divide-white/10">
                      {playerStats.recentMatches.map((match) => (
                        <div
                          key={match.id}
                          className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {match.tournamentName}
                            </p>

                            <p className="mt-1 text-xs text-white/55">
                              vs {match.opponent}
                            </p>

                            <p className="mt-1 text-[11px] text-white/40">
                              {new Date(match.date).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${
                                match.result === "Win"
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-red-500/15 text-red-300"
                              }`}
                            >
                              {match.result}
                            </span>

                            <span className="min-w-[40px] text-right text-sm font-bold text-white">
                              {match.score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <TrophyIcon className="mx-auto h-8 w-8 text-white/20" />
                      <p className="mt-2 text-xs text-white/55">
                        No competitive matches recorded yet.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

          {/* Doubles Teams & Partnerships Section (International Standard) */}
          {activeProfileTab === "TEAMS" &&
            isOwnProfile &&
            profile.role === "PLAYER" && (
              <section className="rounded-xl border border-white/20 bg-[#061D23]/5 p-4 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
                <div className="mb-4 flex flex-col justify-between gap-3 border-b border-white/10 pb-3 lg:flex-row lg:items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#4AEEFF]/15 border border-[#4AEEFF]/30 text-[#4AEEFF]">
                      <UserGroupIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black uppercase tracking-wider text-white text-base">
                        Doubles Partnerships & Teams
                      </h3>
                      <p className="text-xs text-white/60">
                        Manage your tournament pairings, sent requests, and
                        received invitations
                      </p>
                    </div>
                  </div>

                  {/* Sub-tabs */}
                  <div className="flex w-full flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-black/25 p-1 lg:w-auto">
                    <button
                      onClick={() => setActiveDoublesTab("ACTIVE")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        activeDoublesTab === "ACTIVE"
                          ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                          : "text-white/60 hover:text-white border border-transparent"
                      }`}
                    >
                      Active Pairs ({doublesRegistrations.length})
                    </button>
                    <button
                      onClick={() => setActiveDoublesTab("RECEIVED")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative ${
                        activeDoublesTab === "RECEIVED"
                          ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                          : "text-white/60 hover:text-white border border-transparent"
                      }`}
                    >
                      Received ({profileReceivedInvites.length})
                      {profileReceivedInvites.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#4AEEFF]/30 text-[#4AEEFF] text-[9px] font-bold">
                          {profileReceivedInvites.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveDoublesTab("SENT")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        activeDoublesTab === "SENT"
                          ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                          : "text-white/60 hover:text-white border border-transparent"
                      }`}
                    >
                      Sent ({profileSentInvites.length})
                    </button>
                  </div>
                </div>

                {/* ACTIVE DOUBLES TAB */}
                {activeDoublesTab === "ACTIVE" && (
                  <div>
                    {doublesRegistrations.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-[#061D23]/25 px-4 py-8 text-center">
                        <UserGroupIcon className="mx-auto mb-2 h-8 w-8 text-white/25" />

                        <p className="text-sm font-semibold text-white/80">
                          No active doubles teams yet
                        </p>

                        <p className="mt-1 text-xs text-white/50">
                          Register for a doubles tournament and invite a partner
                          to form a pair.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        {doublesRegistrations.map((reg) => {
                          const partnerMember = reg.team?.members?.find(
                            (m: any) => m.playerId !== user?.id,
                          );

                          const partnerName = partnerMember
                            ? `${partnerMember.player?.firstName || ""} ${
                                partnerMember.player?.lastName || ""
                              }`.trim()
                            : reg.playerId !== user?.id
                              ? `${reg.player?.firstName || ""} ${
                                  reg.player?.lastName || ""
                                }`.trim()
                              : "Team Partner";

                          return (
                            <div
                              key={reg.id}
                              className="rounded-xl border border-white/10 bg-[#061D23]/30 p-3 transition-colors hover:border-[#4AEEFF]/35 sm:p-4"
                            >
                              {/* TOURNAMENT & STATUS */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <h4 className="truncate text-sm font-bold text-white">
                                    {reg.tournament?.name || "Tournament Event"}
                                  </h4>

                                  <span className="mt-2 inline-flex rounded-md border border-[#4AEEFF]/20 bg-[#4AEEFF]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#4AEEFF]">
                                    {reg.category?.name || "Doubles Division"}
                                  </span>
                                </div>

                                <span className="shrink-0 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-300">
                                  {reg.status || "CONFIRMED"}
                                </span>
                              </div>

                              {/* PARTNER INFORMATION */}
                              <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#4AEEFF]/20 bg-[#4AEEFF]/10">
                                  <UserGroupIcon className="h-4 w-4 text-[#4AEEFF]" />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                                    Doubles Partner
                                  </p>

                                  <p className="truncate text-xs font-bold text-white sm:text-sm">
                                    {partnerName || "Team Partner"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* RECEIVED INVITES TAB */}
                {activeDoublesTab === "RECEIVED" && (
                  <div>
                    {profileReceivedInvites.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-[#061D23]/25 px-4 py-8 text-center">
                        <UserGroupIcon className="mx-auto mb-2 h-8 w-8 text-white/25" />

                        <p className="text-sm font-semibold text-white/80">
                          No pending partner invitations
                        </p>

                        <p className="mt-1 text-xs text-white/50">
                          When someone invites you to play doubles, it will show
                          up here.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        {profileReceivedInvites.map((inv) => (
                          <div
                            key={inv.id}
                            className="rounded-xl border border-white/10 bg-[#061D23]/30 p-3 transition-colors hover:border-[#4AEEFF]/35 sm:p-4"
                          >
                            {/* INVITER */}
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#4AEEFF]/20 bg-[#4AEEFF]/10">
                                <UserGroupIcon className="h-5 w-5 text-[#4AEEFF]" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                                  Partnership Invitation
                                </p>

                                <p className="truncate text-sm font-bold text-white">
                                  {inv.inviter?.firstName}{" "}
                                  {inv.inviter?.lastName}
                                </p>
                              </div>

                              <span className="shrink-0 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase text-amber-300">
                                Pending
                              </span>
                            </div>

                            {/* TOURNAMENT DETAILS */}
                            <div className="mt-3 border-t border-white/10 pt-3">
                              <p className="truncate text-xs font-semibold text-white/85">
                                {inv.tournament?.name || "Tournament Event"}
                              </p>

                              <span className="mt-2 inline-flex rounded-md border border-[#4AEEFF]/20 bg-[#4AEEFF]/10 px-2 py-1 text-[10px] font-semibold uppercase text-[#4AEEFF]">
                                {inv.category?.name || "Doubles Division"}
                              </span>
                            </div>

                            {/* INVITATION ACTIONS */}
                            <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-3">
                              <button
                                type="button"
                                onClick={() =>
                                  handleProfileDeclineInvite(inv.id)
                                }
                                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20"
                              >
                                Decline
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleProfileAcceptInvite(inv.id)
                                }
                                className="rounded-lg bg-[#4AEEFF] px-4 py-2 text-xs font-bold text-[#061D23] transition-colors hover:bg-white"
                              >
                                Accept Invitation
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SENT INVITES TAB */}
                {activeDoublesTab === "SENT" && (
                  <div>
                    {profileSentInvites.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-[#061D23]/25 px-4 py-8 text-center">
                        <UserGroupIcon className="mx-auto mb-2 h-8 w-8 text-white/25" />

                        <p className="text-sm font-semibold text-white/80">
                          No sent partner invitations
                        </p>

                        <p className="mt-1 text-xs text-white/50">
                          Invites you send to other players will be listed here.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        {profileSentInvites.map((inv) => (
                          <div
                            key={inv.id}
                            className="rounded-xl border border-white/10 bg-[#061D23]/30 p-3 transition-colors hover:border-[#4AEEFF]/35 sm:p-4"
                          >
                            {/* INVITEE */}
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#4AEEFF]/20 bg-[#4AEEFF]/10">
                                <UserGroupIcon className="h-5 w-5 text-[#4AEEFF]" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                                  Invitation Sent To
                                </p>

                                <p className="truncate text-sm font-bold text-white">
                                  {inv.invitee?.firstName}{" "}
                                  {inv.invitee?.lastName}
                                </p>
                              </div>

                              {/* INVITATION STATUS */}
                              <span
                                className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${
                                  inv.status === "PENDING"
                                    ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
                                    : inv.status === "ACCEPTED"
                                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                                      : "border-red-500/25 bg-red-500/10 text-red-300"
                                }`}
                              >
                                {inv.status}
                              </span>
                            </div>

                            {/* TOURNAMENT DETAILS */}
                            <div className="mt-3 border-t border-white/10 pt-3">
                              <p className="truncate text-xs font-semibold text-white/85">
                                {inv.tournament?.name || "Tournament Event"}
                              </p>

                              <span className="mt-2 inline-flex rounded-md border border-[#4AEEFF]/20 bg-[#4AEEFF]/10 px-2 py-1 text-[10px] font-semibold uppercase text-[#4AEEFF]">
                                {inv.category?.name || "Doubles Division"}
                              </span>
                            </div>

                            {/* CANCEL ACTION */}
                            {inv.status === "PENDING" && (
                              <div className="mt-3 flex justify-end border-t border-white/10 pt-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleProfileCancelInvite(inv.id)
                                  }
                                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20"
                                >
                                  Cancel Invitation
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

          {/* Referee credentials profile template */}
          {activeProfileTab === "OVERVIEW" &&
            profile.role === "REFEREE" &&
            profile.refereeProfile && (
              <section className="rounded-[16px] border border-white/20 bg-[#061D23]/5 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-3">
                  <AcademicCapIcon className="h-5 w-5 text-[#4AEEFF]" />
                  <h3 className="font-bold uppercase tracking-wider text-white">
                    Referee Credentials
                  </h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[12px] bg-[#061D23]/60 p-4 border border-white/5">
                    <p className="text-xs text-[#4AEEFF]/80 uppercase font-bold tracking-wider">
                      Certification Awarded
                    </p>
                    <p className="font-semibold text-white mt-1">
                      {profile.refereeProfile.certification || "Not Specified"}
                    </p>
                  </div>
                  <div className="rounded-[12px] bg-[#061D23]/60 p-4 border border-white/5">
                    <p className="text-xs text-[#4AEEFF]/80 uppercase font-bold tracking-wider">
                      Experience Level
                    </p>
                    <p className="font-semibold text-white mt-1">
                      {profile.refereeProfile.experienceYears || 0} Professional
                      Years
                    </p>
                  </div>
                </div>
              </section>
            )}

          {/* Admin properties profile template */}
          {activeProfileTab === "OVERVIEW" &&
            (profile.role === "ADMIN" || profile.role === "SUPER_ADMIN") &&
            profile.adminProfile && (
              <section className="rounded-[16px] border border-white/20 bg-[#061D23]/5 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-3">
                  <IdentificationIcon className="h-5 w-5 text-[#4AEEFF]" />
                  <h3 className="font-bold uppercase tracking-wider text-white">
                    Management Details
                  </h3>
                </div>
                <div className="rounded-[12px] bg-[#061D23]/60 p-4 border border-white/5">
                  <p className="text-xs text-[#4AEEFF]/80 uppercase font-bold tracking-wider">
                    Department Domain
                  </p>
                  <p className="font-semibold text-white mt-1">
                    {profile.adminProfile.department ||
                      "General Administration"}
                  </p>
                </div>
              </section>
            )}
        </div>
      ) : (
        /* ─── PREMIUM FORMS SUITE ─── */
        <form
          onSubmit={handleUpdate}
          className="rounded-[16px] border border-white/20 bg-[#061D23]/5 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl space-y-6 sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-2">
              Phone Info
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +1 (555) 000-0000"
              className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
            />
          </div>

          {/* Media management layout */}
          <div className="border-t border-white/10 pt-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-3">
              Avatar Settings
            </h3>

            <div className="flex flex-wrap items-center gap-5">
              {profile.profileImage && (
                <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-white/20 bg-[#061D23]">
                  <img
                    src={getProfileImageUrl(profile.profileImage)}
                    alt="Current profile"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {imagePreview && (
                <div className="relative h-16 w-16 rounded-full border-2 border-[#4AEEFF] p-0.5">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}

              <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-[#061D23]/40 px-4 text-xs font-bold uppercase tracking-wider text-[#4AEEFF] hover:bg-[#12679E]/40 transition-all">
                {imagePreview ? "Change Photo Selection" : "Select Avatar File"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {imagePreview && (
                <button
                  type="button"
                  onClick={handleUploadProfileImage}
                  disabled={uploading}
                  className="h-10 rounded-lg bg-emerald-500 px-4 text-xs font-black uppercase tracking-wider text-[#061D23] hover:bg-emerald-400 disabled:opacity-50"
                >
                  {uploading ? "Uploading Image..." : "Apply Picture →"}
                </button>
              )}
            </div>
            <p className="mt-2 text-[10px] text-white/50 uppercase tracking-wider">
              Accepted file weights: JPG, PNG, GIF up to 5MB.
            </p>
          </div>

          {!isViewingOtherProfile && user?.role === "PLAYER" && (
            <div className="grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-2">
                  Skill Rating Tier
                </label>
                <GlassSelect
                  name="skillLevel"
                  value={formData.playerProfile.skillLevel}
                  onChange={handleChange}
                  className="w-full"
                >
                  <option value="Beginner" className="bg-[#061D23] text-white">
                    Beginner
                  </option>
                  <option
                    value="Intermediate"
                    className="bg-[#061D23] text-white"
                  >
                    Intermediate
                  </option>
                  <option value="Advanced" className="bg-[#061D23] text-white">
                    Advanced
                  </option>
                </GlassSelect>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-2">
                  Gender
                </label>
                <GlassSelect
                  name="gender"
                  value={formData.playerProfile.gender}
                  onChange={handleChange}
                  className="w-full"
                >
                  <option value="" className="bg-[#061D23] text-white">
                    Select Gender
                  </option>
                  <option value="MALE" className="bg-[#061D23] text-white">
                    Male
                  </option>
                  <option value="FEMALE" className="bg-[#061D23] text-white">
                    Female
                  </option>
                </GlassSelect>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.playerProfile.dateOfBirth}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-2">
                  League / Club Name
                </label>
                <input
                  type="text"
                  name="clubAffiliation"
                  value={formData.playerProfile.clubAffiliation}
                  onChange={handleChange}
                  placeholder="e.g. City Table Tennis Club"
                  className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
                />
              </div>
            </div>
          )}

          {/* Form CTA trigger strip */}
          <div className="flex gap-3 border-t border-white/10 pt-5">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#4AEEFF] px-6 text-xs font-black uppercase tracking-wider text-[#061D23] transition-all duration-200 hover:bg-white disabled:opacity-50"
            >
              {loading ? "Processing..." : "Save Adjustments"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/20 bg-transparent px-5 text-xs font-black uppercase tracking-wider text-[#4AEEFF] hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ─── PUBLIC PROFILE SHARE & QR CODE MODAL ─── */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#061D23]/95 border border-[#4AEEFF]/40 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#4AEEFF]/15 border border-[#4AEEFF]/30 text-[#4AEEFF]">
                  <ShareIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white">
                    Share Player Profile
                  </h3>
                  <p className="text-[11px] text-[#4AEEFF] font-mono">
                    Public Match Stats & Performance Record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-5 bg-white rounded-xl shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `${window.location.origin}/profile/${profile.id}`
                )}`}
                alt="Player Profile QR Code"
                className="w-44 h-44 object-contain"
              />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-2 font-mono">
                Scan with phone camera to view stats
              </p>
            </div>

            {/* Direct Link Copy */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 block">
                Public Profile Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/profile/${profile.id}`}
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-xs font-mono text-cyan-200 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/profile/${profile.id}`);
                    setCopiedLink(true);
                    toast.success("Profile link copied to clipboard!");
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="rounded-lg bg-[#4AEEFF] hover:bg-white text-[#061D23] px-3.5 py-2 text-xs font-black uppercase tracking-wider shrink-0 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  {copiedLink ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-emerald-900" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FOOTER MATCHED ONE-TO-ONE WITH DASHBOARD ─── */}
      <footer className="mt-auto rounded-[16px] border border-white/10 bg-[#061D23]/15 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-[#FFFFFF]/80">
            <UserIcon className="h-4 w-4 text-[#4AEEFF]" />
            <span>Logged in as:</span>
            <span className="rounded bg-[#4AEEFF]/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[#4AEEFF]">
              {profile.role || "GUEST"}
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

export default Profile;
