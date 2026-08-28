import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
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
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  profileImage?: string;
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

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    playerProfile: {
      skillLevel: "Intermediate",
      clubAffiliation: "",
      gender: "",
    },
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [_statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user?.role === "PLAYER") {
      fetchPlayerStats();
    }
  }, [user]);

  const fetchPlayerStats = async () => {
    if (user?.role !== "PLAYER") return;

    setStatsLoading(true);
    try {
      const response = await api.get("/matches/my-performance");
      setPlayerStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch player stats", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get("/users/profile");
      const profileData = response.data.data;
      setProfile(profileData);
      setFormData({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        phone: profileData.phone || "",
        playerProfile: {
          skillLevel: profileData.playerProfile?.skillLevel || "Intermediate",
          clubAffiliation: profileData.playerProfile?.clubAffiliation || "",
          gender: profileData.playerProfile?.gender || "",
        },
      });
    } catch (error) {
      toast.error("Failed to fetch profile");
    } finally {
      setLoading(false);
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
      name === "gender"
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-6 p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );

  if (loading && !profile) {
    return wrapInBaseLayout(
      <div className="flex h-[50vh] items-center justify-center text-xl font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return wrapInBaseLayout(
      <div className="mx-auto max-w-md rounded-[16px] border border-white/20 bg-[#061D23]/8 p-8 text-center backdrop-blur-xl">
        <p className="text-lg font-bold uppercase tracking-wider text-white">Profile not found</p>
      </div>
    );
  }

  return wrapInBaseLayout(
    <>
      {/* ─── HEADER ─── */}
      <header className="flex flex-col justify-between gap-4 rounded-[16px] border border-white/20 bg-[#061D23]/8 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:flex-row sm:items-center sm:p-8">
        <div>
          <div className="mb-4 h-[3px] w-16 bg-[#4AEEFF]" />
          <h1 className="mb-2 text-2xl font-black uppercase tracking-[0.2em] text-[#FFFFFF] sm:text-4xl">
            My Profile
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-[#4AEEFF]/90">
            Manage personal credentials and overview stats
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#4AEEFF] px-6 text-xs font-black uppercase tracking-wider text-[#061D23] transition-all duration-200 hover:bg-[#FFFFFF]"
          >
            Edit Profile
          </button>
        )}
      </header>

      {!editing ? (
        <div className="space-y-6">
          {/* ─── PRIMARY DETAILED OVERVIEW ─── */}
          <section className="rounded-[16px] border border-white/20 bg-[#061D23]/5 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-col items-start gap-5 pb-6 border-b border-white/10 sm:flex-row sm:items-center">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover border-2 border-[#4AEEFF] shadow-[0_0_20px_rgba(74,238,255,0.3)]"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#4AEEFF]/40 bg-[#061D23]/60 shadow-inner">
                  <span className="text-3xl font-black tracking-tighter text-[#4AEEFF]">
                    {(profile.firstName?.[0] || "").toUpperCase()}
                    {(profile.lastName?.[0] || "").toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-wide">
                  {profile.firstName} {profile.lastName}
                </h2>
                <div className="mt-2 inline-flex items-center rounded bg-[#4AEEFF]/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#4AEEFF]">
                  {profile.role}
                </div>
              </div>
            </div>

            {/* Core credentials info cards */}
            <div className="grid gap-4 mt-6 sm:grid-cols-2">
              <div className="rounded-[12px] border border-white/10 bg-[#061D23]/40 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#4AEEFF]/80 mb-1 flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4" /> Email Address
                </p>
                <p className="font-semibold text-white break-all">{profile.email}</p>
              </div>
              <div className="rounded-[12px] border border-white/10 bg-[#061D23]/40 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#4AEEFF]/80 mb-1 flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4" /> Contact Number
                </p>
                <p className="font-semibold text-white">{profile.phone || "Not provided"}</p>
              </div>
            </div>
          </section>

          {/* ─── ROLE-SPECIFIC PROFILES ─── */}
          {profile.role === "PLAYER" && profile.playerProfile && (
            <section className="rounded-[16px] border border-white/20 bg-[#061D23]/5 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-[#4AEEFF]/20 p-2 text-[#4AEEFF]">
                  <UserIcon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold uppercase tracking-wider text-[#FFFFFF]">
                  Player Affiliation & Bio
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-[12px] border border-white/10 bg-[#061D23]/60 p-4">
                  <p className="text-xs text-[#4AEEFF] font-semibold uppercase tracking-wider">Skill Level</p>
                  <p className="mt-1 font-bold text-white">{profile.playerProfile.skillLevel}</p>
                </div>
                <div className="rounded-[12px] border border-white/10 bg-[#061D23]/60 p-4">
                  <p className="text-xs text-[#4AEEFF] font-semibold uppercase tracking-wider">Age</p>
                  <p className="mt-1 font-bold text-white">
                    {profile.playerProfile.dateOfBirth
                      ? `${getPlayerAgeCategory(new Date(profile.playerProfile.dateOfBirth)).age} years`
                      : "Not provided"}
                  </p>
                </div>
                <div className="rounded-[12px] border border-white/10 bg-[#061D23]/60 p-4">
                  <p className="text-xs text-[#4AEEFF] font-semibold uppercase tracking-wider">Age Category</p>
                  <p className="mt-1 font-bold text-white">
                    {profile.playerProfile.dateOfBirth
                      ? getPlayerAgeCategory(new Date(profile.playerProfile.dateOfBirth)).category
                      : "N/A"}
                  </p>
                </div>
                <div className="rounded-[12px] border border-white/10 bg-[#061D23]/60 p-4">
                  <p className="text-xs text-[#4AEEFF] font-semibold uppercase tracking-wider">Gender</p>
                  <p className="mt-1 font-bold text-white">
                    {profile.playerProfile.gender === "MALE"
                      ? "Male"
                      : profile.playerProfile.gender === "FEMALE"
                        ? "Female"
                        : "Not provided"}
                  </p>
                </div>
                <div className="rounded-[12px] border border-white/10 bg-[#061D23]/60 p-4">
                  <p className="text-xs text-[#4AEEFF] font-semibold uppercase tracking-wider">Club Affiliation</p>
                  <p className="mt-1 font-bold text-white">{profile.playerProfile.clubAffiliation || "None Specified"}</p>
                </div>
                <div className="rounded-[12px] border border-white/10 bg-[#061D23]/60 p-4">
                  <p className="text-xs text-[#4AEEFF] font-semibold uppercase tracking-wider">Date of Birth</p>
                  <p className="mt-1 font-bold text-white">
                    {profile.playerProfile.dateOfBirth
                      ? new Date(profile.playerProfile.dateOfBirth).toLocaleDateString()
                      : "Not provided"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ─── PERFORMANCE PERFORMANCE GRAPH MATRIX ─── */}
          {user?.role === "PLAYER" && playerStats && (
            <section className="rounded-[16px] border border-white/20 bg-[#061D23]/5 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-[#4AEEFF]/20 p-2 text-[#4AEEFF]">
                  <ChartBarIcon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold uppercase tracking-wider text-[#FFFFFF]">
                  Performance Analysis
                </h2>
              </div>

              {/* Core numbers breakdown */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
                <div className="rounded-[12px] border border-white/10 bg-[#061D23]/60 p-4 text-center">
                  <p className="text-3xl font-black text-[#4AEEFF]">{playerStats.totalMatches}</p>
                  <p className="text-xs uppercase font-bold tracking-wider text-white/70 mt-1">Total Matches</p>
                </div>
                <div className="rounded-[12px] border border-white/10 bg-[#061D23]/60 p-4 text-center">
                  <p className="text-3xl font-black text-[#4AEEFF]">{playerStats.wins}</p>
                  <p className="text-xs uppercase font-bold tracking-wider text-white/70 mt-1">Wins</p>
                </div>
                <div className="rounded-[12px] border border-white/10 bg-[#061D23]/60 p-4 text-center">
                  <p className="text-3xl font-black text-red-400">{playerStats.losses}</p>
                  <p className="text-xs uppercase font-bold tracking-wider text-white/70 mt-1">Losses</p>
                </div>
                <div className="rounded-[12px] border border-white/10 bg-[#061D23]/60 p-4 text-center">
                  <p className="text-3xl font-black text-[#4AEEFF]">{playerStats.winRate}</p>
                  <p className="text-xs uppercase font-bold tracking-wider text-white/70 mt-1">Win Rate</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mb-6">
                {/* Games Slider stats */}
                <div className="rounded-[12px] border border-white/10 bg-[#061D23]/40 p-5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white/90 mb-3">Games Progress Bar</h4>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <div>
                      <span className="text-xs text-white/60 block">Won</span>
                      <strong className="text-lg text-[#4AEEFF]">{playerStats.gamesStats.won}</strong>
                    </div>
                    <div className="text-xs font-black text-white/30 uppercase">VS</div>
                    <div className="text-right">
                      <span className="text-xs text-white/60 block">Lost</span>
                      <strong className="text-lg text-red-400">{playerStats.gamesStats.lost}</strong>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#4AEEFF] h-full transition-all duration-500"
                      style={{
                        width: `${playerStats.gamesStats.total > 0 ? (playerStats.gamesStats.won / playerStats.gamesStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-right text-xs text-white/60">Total sets: {playerStats.gamesStats.total}</p>
                </div>

                {/* Points mini block */}
                <div className="rounded-[12px] border border-white/10 bg-[#061D23]/40 p-5 flex flex-col justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white/90 mb-2">Points Metrics</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-white/60">Scored</p>
                      <p className="text-base font-bold text-[#4AEEFF]">{playerStats.pointsStats.scored}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Conceded</p>
                      <p className="text-base font-bold text-red-400">{playerStats.pointsStats.conceded}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Avg/Game</p>
                      <p className="text-base font-bold text-white">{playerStats.pointsStats.averagePerGame}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match log timeline */}
              {playerStats.recentMatches.length > 0 ? (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-3 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" /> History Timeline
                  </h4>
                  <div className="space-y-3">
                    {playerStats.recentMatches.map((match) => (
                      <div
                        key={match.id}
                        className="group flex justify-between items-center rounded-[12px] border border-white/5 bg-[#061D23]/40 p-4 transition-all duration-200 hover:border-[#4AEEFF]/40 hover:bg-[#12679E]/20"
                      >
                        <div>
                          <p className="font-bold text-white group-hover:text-[#4AEEFF] transition-colors">{match.tournamentName}</p>
                          <p className="text-xs text-white/70">Against: {match.opponent}</p>
                          <p className="text-[10px] text-white/40 mt-1">{new Date(match.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
                              match.result === "Win"
                                ? "bg-[#4AEEFF]/20 text-[#4AEEFF]"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {match.result}
                          </span>
                          <p className="text-xs font-bold text-white mt-1.5">{match.score}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                playerStats.totalMatches === 0 && (
                  <div className="text-center py-8 rounded-[12px] bg-[#061D23]/30 border border-white/5">
                    <TrophyIcon className="h-10 w-10 text-white/20 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-white/80">No competitive log entries</p>
                  </div>
                )
              )}
            </section>
          )}

          {/* Referee credentials profile template */}
          {profile.role === "REFEREE" && profile.refereeProfile && (
            <section className="rounded-[16px] border border-white/20 bg-[#061D23]/5 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <AcademicCapIcon className="h-5 w-5 text-[#4AEEFF]" />
                <h3 className="font-bold uppercase tracking-wider text-white">Referee Credentials</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[12px] bg-[#061D23]/60 p-4 border border-white/5">
                  <p className="text-xs text-[#4AEEFF]/80 uppercase font-bold tracking-wider">Certification Awarded</p>
                  <p className="font-semibold text-white mt-1">{profile.refereeProfile.certification || "Not Specified"}</p>
                </div>
                <div className="rounded-[12px] bg-[#061D23]/60 p-4 border border-white/5">
                  <p className="text-xs text-[#4AEEFF]/80 uppercase font-bold tracking-wider">Experience Level</p>
                  <p className="font-semibold text-white mt-1">{profile.refereeProfile.experienceYears || 0} Professional Years</p>
                </div>
              </div>
            </section>
          )}

          {/* Admin properties profile template */}
          {profile.role === "ADMIN" && profile.adminProfile && (
            <section className="rounded-[16px] border border-white/20 bg-[#061D23]/5 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <IdentificationIcon className="h-5 w-5 text-[#4AEEFF]" />
                <h3 className="font-bold uppercase tracking-wider text-white">Management Details</h3>
              </div>
              <div className="rounded-[12px] bg-[#061D23]/60 p-4 border border-white/5">
                <p className="text-xs text-[#4AEEFF]/80 uppercase font-bold tracking-wider">Department Domain</p>
                <p className="font-semibold text-white mt-1">{profile.adminProfile.department || "General Administration"}</p>
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
              <label className="block text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-2">First Name</label>
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
              <label className="block text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-2">Last Name</label>
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
            <label className="block text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-2">Phone Info</label>
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
            <h3 className="text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-3">Avatar Settings</h3>

            <div className="flex flex-wrap items-center gap-5">
              {profile.profileImage && (
                <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-white/20 bg-[#061D23]">
                  <img src={profile.profileImage} alt="Current profile" className="h-full w-full object-cover" />
                </div>
              )}

              {imagePreview && (
                <div className="relative h-16 w-16 rounded-full border-2 border-[#4AEEFF] p-0.5">
                  <img src={imagePreview} alt="Preview" className="h-full w-full rounded-full object-cover" />
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
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
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
            <p className="mt-2 text-[10px] text-white/50 uppercase tracking-wider">Accepted file weights: JPG, PNG, GIF up to 5MB.</p>
          </div>

          {user?.role === "PLAYER" && (
            <div className="grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-2">Skill Rating Tier</label>
                <select
                  name="skillLevel"
                  value={formData.playerProfile.skillLevel}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 px-4 py-3 text-sm text-white focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
                >
                  <option value="Beginner" className="bg-[#061D23] text-white">Beginner</option>
                  <option value="Intermediate" className="bg-[#061D23] text-white">Intermediate</option>
                  <option value="Advanced" className="bg-[#061D23] text-white">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.playerProfile.gender}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 px-4 py-3 text-sm text-white focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
                >
                  <option value="" className="bg-[#061D23] text-white">Select Gender</option>
                  <option value="MALE" className="bg-[#061D23] text-white">Male</option>
                  <option value="FEMALE" className="bg-[#061D23] text-white">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#4AEEFF] mb-2">League / Club Name</label>
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

      {/* ─── FOOTER MATCHED ONE-TO-ONE WITH DASHBOARD ─── */}
      <footer className="mt-auto rounded-[16px] border border-white/10 bg-[#061D23]/15 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.3)] backdrop-blur-md">
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

export default Profile;