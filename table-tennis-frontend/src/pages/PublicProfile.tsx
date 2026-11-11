import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import BackButton from "../components/BackButton";
import { useAuth } from "../context/AuthContext";
import api, { getProfileImageUrl } from "../services/api";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicPlayerProfile {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
  createdAt: string;
  totalFavorites?: number;
  isFavorited?: boolean;
  tournamentsCount?: number;
  playerProfile?: {
    skillLevel: string | null;
    clubAffiliation: string | null;
    dateOfBirth: string | null;
    ranking?: number | null;
    rankingNote?: string | null;
    gender?: "MALE" | "FEMALE" | null;
    isClubMember?: boolean;
  };
}

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: string;
  gamesStats: { won: number; lost: number; total: number };
  pointsStats: { scored: number; conceded: number; averagePerGame: string };
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calculateAge = (dob: string): number => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return isNaN(age) || age < 0 ? 0 : age;
};

const formatDateOfBirth = (dob: string): string => {
  try {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "—";
  }
};

const formatMatchDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const getAgeCategory = (age: number): string => {
  if (age < 9) return "Under 9";
  if (age < 11) return "Under 11";
  if (age < 13) return "Under 13";
  if (age < 15) return "Under 15";
  if (age < 17) return "Under 17";
  if (age < 19) return "Under 19";
  if (age < 40) return "Open";
  if (age < 50) return "Seniors 40+";
  if (age < 60) return "Masters 50+";
  return "Veterans 60+";
};

const capitalizeWords = (str: string): string => {
  if (!str) return "";
  return str
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "matches">("overview");
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [totalFavorites, setTotalFavorites] = useState<number>(0);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    setLoading(true);
    setFetchError(false);
    try {
      const res = await api.get(`/users/public/${userId}`);
      const profileData: PublicPlayerProfile = res.data.data;
      setProfile(profileData);
      setIsFavorited(Boolean(profileData.isFavorited));
      setTotalFavorites(Number(profileData.totalFavorites) || 0);

      // Fetch match stats
      try {
        const statsRes = await api.get(`/matches/player-performance/${userId}`);
        setStats(statsRes.data.data);
      } catch {
        setStats(null);
      }

      // Record profile view if authenticated
      if (user && user.id !== userId) {
        api.post(`/users/${userId}/profile-view`, {
          viewerId: user.id,
          viewerName: `${user.firstName} ${user.lastName}`,
        }).catch(() => {});
      }
    } catch {
      setFetchError(true);
      toast.error("Player profile could not be found");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please sign in to like this player!", { icon: "❤️" });
      navigate("/login");
      return;
    }

    if (isFavoriteLoading || !profile) return;
    setIsFavoriteLoading(true);

    const prevFavorited = isFavorited;
    const prevTotal = totalFavorites;

    // Optimistic UI update
    const nextFavorited = !prevFavorited;
    const nextTotal = nextFavorited ? prevTotal + 1 : Math.max(0, prevTotal - 1);
    setIsFavorited(nextFavorited);
    setTotalFavorites(nextTotal);

    try {
      const res = await api.post(`/users/${userId}/favorite`);
      const { favorited, totalFavorites: newTotal } = res.data.data;
      setIsFavorited(favorited);
      setTotalFavorites(newTotal);
      if (favorited) {
        toast.success(`Liked ${profile.firstName}!`, { icon: "❤️" });
      } else {
        toast.success(`Unliked ${profile.firstName}`);
      }
    } catch (err: any) {
      // Rollback on failure
      setIsFavorited(prevFavorited);
      setTotalFavorites(prevTotal);
      toast.error(err.response?.data?.message || "Failed to update like");
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  // ─── Loading Skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] w-full bg-[#061D23] text-white lg:overflow-hidden flex flex-col justify-center">
        {/* Background artwork with dark teal overlay */}
        <div
          className="fixed inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: "url('/bg1.png')" }}
        />
        <div className="fixed inset-0 bg-[#061D23]/25 pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35 pointer-events-none" />

        <div className="relative z-10 w-full h-full max-w-[1600px] mx-auto p-4 sm:p-5 lg:px-10 xl:px-14 lg:py-4 xl:py-5 flex flex-col lg:flex-row gap-5">
          {/* Left card skeleton */}
          <div className="w-full lg:w-[440px] lg:shrink-0 h-[480px] lg:h-full rounded-[22px] border border-white/20 bg-[#061D23]/30 backdrop-blur-xl p-8 flex flex-col justify-between animate-pulse shadow-2xl">
            <div className="space-y-4">
              <div className="w-24 h-4 bg-white/20 rounded" />
              <div className="w-28 h-28 rounded-full bg-white/20 mt-4" />
              <div className="w-48 h-8 bg-white/20 rounded mt-3" />
              <div className="flex gap-2">
                <div className="w-20 h-6 bg-white/20 rounded-full" />
                <div className="w-16 h-6 bg-white/20 rounded-full" />
              </div>
            </div>
            <div className="space-y-3 pt-6 border-t border-white/10">
              <div className="w-full h-16 bg-white/10 rounded-[14px]" />
              <div className="w-full h-24 bg-white/10 rounded-[14px]" />
            </div>
          </div>

          {/* Right column skeleton */}
          <div className="flex-1 min-w-0 h-full flex flex-col gap-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-[#061D23]/20 rounded-[18px] border border-white/15 backdrop-blur-xl animate-pulse p-4" />
              ))}
            </div>
            <div className="flex-1 bg-[#061D23]/20 rounded-[18px] border border-white/15 backdrop-blur-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────────

  if (fetchError || !profile) {
    return (
      <div className="relative min-h-[calc(100vh-72px)] w-full bg-[#061D23] text-white flex items-center justify-center p-6">
        <div
          className="fixed inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: "url('/bg1.png')" }}
        />
        <div className="fixed inset-0 bg-[#061D23]/25 pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35 pointer-events-none" />

        <div className="relative z-10 max-w-md w-full bg-[#061D23]/35 backdrop-blur-xl rounded-[22px] border border-white/20 p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 text-[#4AEEFF] flex items-center justify-center mx-auto mb-4 text-2xl font-black">
            ?
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Player Not Found</h2>
          <p className="text-sm text-white/70 mb-6 leading-relaxed">
            The requested player profile does not exist or has been removed from the directory.
          </p>
          <Link
            to="/players"
            className="inline-flex items-center justify-center gap-2 bg-[#4AEEFF] hover:bg-white text-[#061D23] font-bold text-sm px-6 py-3 rounded-xl shadow-sm transition-all"
          >
            <span>←</span>
            <span>Return to Players Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Data Derivations ────────────────────────────────────────────────────────

  const firstNameCapitalized = capitalizeWords(profile.firstName);
  const fullName = capitalizeWords(`${profile.firstName} ${profile.lastName}`);
  const initials = `${profile.firstName?.charAt(0) || ""}${profile.lastName?.charAt(0) || ""}`.toUpperCase() || "TT";
  const avatarUrl = profile.profileImage ? getProfileImageUrl(profile.profileImage) : null;

  const age = profile.playerProfile?.dateOfBirth ? calculateAge(profile.playerProfile.dateOfBirth) : null;
  const dobFormatted = profile.playerProfile?.dateOfBirth ? formatDateOfBirth(profile.playerProfile.dateOfBirth) : "—";
  const ageCategory = age !== null ? getAgeCategory(age) : "Open";

  const genderRaw = profile.playerProfile?.gender;
  const genderCategory = genderRaw === "FEMALE" ? "Women's" : genderRaw === "MALE" ? "Men's" : "Club Player";

  const clubName = profile.playerProfile?.clubAffiliation?.trim() || "Sam's College";
  const memberSinceYear = profile.createdAt ? new Date(profile.createdAt).getFullYear() : "2026";

  const isClubMember = profile.playerProfile?.isClubMember === true;
  const ranking = profile.playerProfile?.ranking;
  const rankingValue = isClubMember && ranking ? `#${ranking}` : "Unranked";

  const totalMatches = stats?.totalMatches ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const winRateDisplay = totalMatches > 0 && stats?.winRate ? stats.winRate : "—";

  // Tournament count: prefer backend tournamentRegistrations count, fallback to distinct tournaments in matches
  const tournamentsCount =
    profile.tournamentsCount !== undefined
      ? profile.tournamentsCount
      : stats?.allMatches
      ? new Set(stats.allMatches.map((m) => m.tournament?.id || m.tournamentId)).size
      : 0;

  // Last 5 matches for Recent Form
  const recent5 = stats?.recentMatches?.slice(0, 5) ?? [];
  const recentFormSlots = Array.from({ length: 5 }, (_, idx) => recent5[idx] || null);

  return (
    <div className="relative min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] w-full bg-[#061D23] text-white flex flex-col justify-between lg:overflow-hidden">
      {/* ─── Page Background Fixed Art & Gradient Overlays ─── */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      <div className="fixed inset-0 bg-[#061D23]/25 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35 pointer-events-none" />

      {/* ─── Body Layout (Single-View desktop, 2 columns) ─── */}
      <main className="relative z-10 w-full flex-1 max-w-[1600px] mx-auto p-4 sm:p-5 lg:px-8 xl:px-12 lg:py-3.5 xl:py-4 flex flex-col lg:flex-row gap-4 xl:gap-5 min-h-0">

        {/* ════ LEFT COLUMN: IDENTITY CARD (geometric teal circles bg, 420px width) ════ */}
        <section
          aria-label="Player Identity"
          className="w-full lg:w-[410px] xl:w-[430px] lg:shrink-0 rounded-[22px] shadow-[0_25px_60px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl overflow-hidden relative flex flex-col bg-[#082A33] border border-white/20"
        >
          {/* Geometric curved teal circles background */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{ backgroundImage: "url('/player-card-bg.png')" }}
          />

          {/* Identity Card Content */}
          <div className="relative z-10 p-4 sm:p-5 xl:p-6 pb-5 sm:pb-6 flex flex-col h-full gap-2.5 sm:gap-3 text-white justify-between overflow-y-auto lg:overflow-visible">

            {/* Top Identity Block */}
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {/* 1. Header row: Back link (left) + Like button (top-right side) */}
              <div className="flex items-center justify-between">
                <BackButton to="/players" label="Back to Players" />

                {/* Like button + counter on the top right */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={isFavoriteLoading}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 backdrop-blur-md transition-all hover:scale-105 active:scale-95 disabled:opacity-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4AEEFF]"
                    aria-label={isFavorited ? "Unlike player" : "Like player"}
                  >
                    <svg
                      className={`w-3.5 h-3.5 ${isFavorited ? "fill-[#E0245E] text-[#E0245E]" : "fill-none stroke-current stroke-2"}`}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                      />
                    </svg>
                    <span>Like</span>
                  </button>
                  <span className="text-white/70 text-xs font-medium">
                    {totalFavorites} {totalFavorites === 1 ? "like" : "likes"}
                  </span>
                </div>
              </div>

              {/* 2. Avatar: compact circle with cyan ring and fallback */}
              <div className="relative w-[80px] h-[80px] sm:w-[86px] sm:h-[86px] xl:w-[92px] xl:h-[92px] rounded-full ring-4 ring-white/20 overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#22B8C6] to-[#0E8A99] shrink-0 shadow-lg">
                {avatarUrl && !imageError ? (
                  <img
                    src={avatarUrl}
                    alt={`Profile of ${fullName}`}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-[30px] sm:text-[34px] xl:text-[38px] font-black text-white uppercase tracking-tight select-none">
                    {initials}
                  </span>
                )}
              </div>

              {/* 3. Player name */}
              <div>
                <h1 className="text-[22px] sm:text-[26px] xl:text-[28px] font-heading font-bold text-white tracking-tight leading-tight truncate">
                  {fullName}
                </h1>
              </div>

              {/* 4. Chips: age group + gender category */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-bold text-white bg-white/10 border border-white/20 backdrop-blur-md select-none">
                  {ageCategory}
                </span>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold text-[#4AEEFF] bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 backdrop-blur-md select-none">
                  {genderCategory}
                </span>
              </div>
            </div>

            {/* Bottom Group: Ranking panel + Details list */}
            <div className="flex flex-col gap-2 sm:gap-2.5 pt-1">
              {/* Ranking panel */}
              <div className="rounded-[14px] bg-gradient-to-r from-[#061D23]/90 to-[#0A2E35]/90 border border-[#4AEEFF]/40 p-2.5 sm:p-[10px_16px] backdrop-blur-md shrink-0 shadow-[0_0_20px_rgba(74,238,255,0.15)]">
                <div className="text-[10px] font-black tracking-[0.14em] uppercase text-[#4AEEFF] mb-0.5">
                  CLUB RANKING
                </div>
                <div className="text-[24px] sm:text-[28px] font-black text-white leading-tight">
                  {rankingValue}
                </div>
                <div className="text-[11px] font-medium text-cyan-200/80 mt-0.5">
                  {genderCategory} · {ageCategory}
                </div>
              </div>

              {/* Details list inside structured frosted container */}
              <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-0.5 divide-y divide-white/10 text-xs sm:text-[13px] shrink-0 mb-0.5">
                <div className="flex items-center justify-between py-1.5 sm:py-2">
                  <span className="text-white/80 font-medium">Age</span>
                  <span className="text-white font-semibold">{age !== null ? age : "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 sm:py-2">
                  <span className="text-white/80 font-medium">Date of birth</span>
                  <span className="text-white font-semibold">{dobFormatted}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 sm:py-2">
                  <span className="text-white/80 font-medium">Club</span>
                  <span className="text-white font-semibold truncate max-w-[200px] text-right">
                    {clubName}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 sm:py-2">
                  <span className="text-white/80 font-medium">Member since</span>
                  <span className="text-white font-semibold">{memberSinceYear}</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ════ RIGHT COLUMN (Frosted Glass Performance Deck) ════ */}
        <section aria-label="Player Performance" className="flex-1 min-w-0 h-full flex flex-col gap-4">

          {/* ─── A. STATS ROW: 4 Frosted Glass Tiles ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 xl:gap-4 shrink-0">

            {/* Card 1: Matches played */}
            <div className="bg-[#061D23]/20 rounded-[18px] border border-white/20 p-[12px_16px] xl:p-[16px_20px] shadow-[0_20px_50px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl flex items-center gap-3 xl:gap-3.5 hover:border-[#4AEEFF]/50 hover:-translate-y-0.5 transition-all">
              <div className="w-[42px] h-[42px] rounded-xl bg-[#4AEEFF]/15 border border-[#4AEEFF]/30 flex items-center justify-center shrink-0 text-[#4AEEFF] shadow-inner">
                <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-[12px] xl:text-[13px] text-white/80 font-medium leading-tight truncate">Matches played</div>
                <div className="text-[22px] xl:text-[26px] font-black text-white leading-tight mt-0.5 tracking-tight">
                  {totalMatches}
                </div>
              </div>
            </div>

            {/* Card 2: Win – loss */}
            <div className="bg-[#061D23]/20 rounded-[18px] border border-white/20 p-[12px_16px] xl:p-[16px_20px] shadow-[0_20px_50px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl flex items-center gap-3 xl:gap-3.5 hover:border-[#4AEEFF]/50 hover:-translate-y-0.5 transition-all">
              <div className="w-[42px] h-[42px] rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-300 shadow-inner">
                <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-[12px] xl:text-[13px] text-white/80 font-medium leading-tight truncate">Win – loss</div>
                <div className="text-[22px] xl:text-[26px] font-black text-white leading-tight mt-0.5 tracking-tight">
                  <span className="text-emerald-400">{wins}</span>
                  <span className="text-white/40 mx-1">–</span>
                  <span className="text-rose-300">{losses}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Win rate */}
            <div className="bg-[#061D23]/20 rounded-[18px] border border-white/20 p-[12px_16px] xl:p-[16px_20px] shadow-[0_20px_50px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl flex items-center gap-3 xl:gap-3.5 hover:border-[#4AEEFF]/50 hover:-translate-y-0.5 transition-all">
              <div className="w-[42px] h-[42px] rounded-xl bg-[#4AEEFF]/15 border border-[#4AEEFF]/30 flex items-center justify-center shrink-0 text-[#4AEEFF] shadow-inner">
                <span className="text-lg font-black leading-none">%</span>
              </div>
              <div className="min-w-0">
                <div className="text-[12px] xl:text-[13px] text-white/80 font-medium leading-tight truncate">Win rate</div>
                <div className="text-[22px] xl:text-[26px] font-black text-white leading-tight mt-0.5 tracking-tight">
                  {winRateDisplay}
                </div>
              </div>
            </div>

            {/* Card 4: Tournaments */}
            <div className="bg-[#061D23]/20 rounded-[18px] border border-white/20 p-[12px_16px] xl:p-[16px_20px] shadow-[0_20px_50px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl flex items-center gap-3 xl:gap-3.5 hover:border-[#4AEEFF]/50 hover:-translate-y-0.5 transition-all">
              <div className="w-[42px] h-[42px] rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300 shadow-inner">
                <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.003 0V7.5a4.5 4.5 0 00-9 0v6.75m9 0H7.5" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-[12px] xl:text-[13px] text-white/80 font-medium leading-tight truncate">Tournaments</div>
                <div className="text-[22px] xl:text-[26px] font-black text-white leading-tight mt-0.5 tracking-tight">
                  {tournamentsCount}
                </div>
              </div>
            </div>

          </div>

          {/* ─── B. PERFORMANCE CARD (Teal Performance Hub) ─── */}
          <div className="flex-1 min-h-0 bg-[#061D23]/35 rounded-[18px] border border-white/20 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl overflow-hidden flex flex-col relative">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-25"
              style={{ backgroundImage: "url('/player-card-bg.png')" }}
            />
            <div className="absolute inset-0 bg-[#061D23]/60 pointer-events-none" />

            {/* Card Header: "Performance" + Segmented Control */}
            <div className="relative z-10 p-[14px_22px] flex items-center justify-between border-b border-white/15 shrink-0">
              <h2 className="text-[18px] font-bold text-white tracking-tight">Performance</h2>

              {/* Segmented control: "Overview" & "Match history" */}
              <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex items-center gap-1.5 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`text-xs px-3.5 py-1.5 rounded-lg transition-all focus:outline-none ${
                    activeTab === "overview"
                      ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] font-bold backdrop-blur-md"
                      : "text-white/70 hover:text-white hover:bg-white/5 font-semibold"
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("matches")}
                  className={`text-xs px-3.5 py-1.5 rounded-lg transition-all focus:outline-none ${
                    activeTab === "matches"
                      ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] font-bold backdrop-blur-md"
                      : "text-white/70 hover:text-white hover:bg-white/5 font-semibold"
                  }`}
                >
                  Match history
                </button>
              </div>
            </div>

            {/* Recent form band: Label + 5 circles */}
            <div className="relative z-10 px-6 py-2.5 flex items-center justify-between border-b border-white/10 bg-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Recent form</span>
                <span className="text-xs text-white/50 font-normal">Last 5 matches</span>
              </div>

              {/* 5 Form Circles */}
              <div className="flex items-center gap-2">
                {recentFormSlots.map((matchItem, idx) => {
                  if (!matchItem) {
                    return (
                      <span
                        key={idx}
                        title="No match played"
                        className="w-8 h-8 sm:w-[38px] sm:h-[38px] rounded-full border-2 border-dashed border-white/35 text-white/50 bg-white/[0.04] flex items-center justify-center font-semibold text-sm select-none"
                      >
                        –
                      </span>
                    );
                  }

                  const isWin = matchItem.result?.toLowerCase() === "win";
                  return isWin ? (
                    <span
                      key={idx}
                      title={`Won vs ${matchItem.opponent}`}
                      className="w-8 h-8 sm:w-[38px] sm:h-[38px] rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-black text-sm shadow-sm transition-transform hover:scale-105 cursor-default select-none"
                    >
                      W
                    </span>
                  ) : (
                    <span
                      key={idx}
                      title={`Lost vs ${matchItem.opponent}`}
                      className="w-8 h-8 sm:w-[38px] sm:h-[38px] rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center font-bold text-sm transition-transform hover:scale-105 cursor-default select-none"
                    >
                      L
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Tab content area */}
            <div className="relative z-10 flex-1 min-h-0 overflow-y-auto p-6">
              {totalMatches === 0 ? (
                /* EMPTY STATE */
                <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center py-6">
                  <div className="relative mb-4 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-white/5 flex items-center justify-center ring-8 ring-white/5 border border-white/10">
                      <div className="w-16 h-16 rounded-full bg-[#4AEEFF]/15 border border-[#4AEEFF]/30 flex items-center justify-center text-[#4AEEFF] shadow-inner">
                        <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="16" cy="16" r="9" />
                          <path d="M22.5 22.5L29 29" strokeWidth="3" />
                          <circle cx="27" cy="11" r="2.5" fill="#4AEEFF" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-[20px] sm:text-[22px] font-bold text-white mb-1.5">
                    No matches recorded yet
                  </h3>
                  <p className="text-[14px] sm:text-[15px] text-white/60 max-w-[420px] leading-relaxed">
                    Statistics and match history will appear here once {firstNameCapitalized} completes their first match.
                  </p>
                </div>
              ) : activeTab === "overview" ? (
                /* OVERVIEW TAB CONTENT */
                <div className="space-y-6">
                  {/* Win / Loss Visual Bar */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                    <div className="flex justify-between items-center text-sm font-bold text-white mb-2">
                      <span>Match Distribution</span>
                      <span className="text-white/80 font-semibold">{wins} Wins ({winRateDisplay}) · {losses} Losses</span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex border border-white/10">
                      <div
                        style={{ width: `${totalMatches > 0 ? (wins / totalMatches) * 100 : 0}%` }}
                        className="bg-gradient-to-r from-[#4AEEFF] to-[#0E8A99] h-full transition-all duration-500 shadow-[0_0_12px_rgba(74,238,255,0.4)]"
                        title={`${wins} Wins`}
                      />
                      <div
                        style={{ width: `${totalMatches > 0 ? (losses / totalMatches) * 100 : 0}%` }}
                        className="bg-white/15 h-full transition-all duration-500"
                        title={`${losses} Losses`}
                      />
                    </div>
                  </div>

                  {/* Games & Points 2-Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Games card */}
                    <div className="p-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#4AEEFF] mb-1">
                        Games Statistics
                      </div>
                      <div className="text-2xl font-black text-white">
                        {stats?.gamesStats?.won ?? 0}
                        <span className="text-sm font-bold text-emerald-400 ml-1">Won</span>
                        <span className="mx-2 text-white/30">/</span>
                        {stats?.gamesStats?.lost ?? 0}
                        <span className="text-sm font-medium text-rose-300 ml-1">Lost</span>
                      </div>
                      <div className="text-xs text-white/60 mt-2">
                        Total Games: {stats?.gamesStats?.total ?? 0}
                      </div>
                    </div>

                    {/* Points card */}
                    <div className="p-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#4AEEFF] mb-1">
                        Points Statistics
                      </div>
                      <div className="text-2xl font-black text-white">
                        {stats?.pointsStats?.scored ?? 0}
                        <span className="text-sm font-bold text-[#4AEEFF] ml-1">Scored</span>
                        <span className="mx-2 text-white/30">/</span>
                        {stats?.pointsStats?.conceded ?? 0}
                        <span className="text-sm font-medium text-white/60 ml-1">Conceded</span>
                      </div>
                      <div className="text-xs text-white/60 mt-2">
                        Average per Game: {stats?.pointsStats?.averagePerGame ?? "0"} pts
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* MATCH HISTORY TAB CONTENT */
                <div className="space-y-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/15 bg-white/5 text-[11px] font-bold text-[#4AEEFF] uppercase tracking-wider">
                          <th className="py-2.5 pr-4 pl-3">Date</th>
                          <th className="py-2.5 px-4">Tournament</th>
                          <th className="py-2.5 px-4">Opponent</th>
                          <th className="py-2.5 px-4">Score</th>
                          <th className="py-2.5 pl-4 pr-3 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-sm">
                        {(stats?.recentMatches ?? []).map((match) => {
                          const isWin = match.result?.toLowerCase() === "win";
                          return (
                            <tr key={match.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 pr-4 pl-3 text-xs text-white/60 whitespace-nowrap">
                                {formatMatchDate(match.date)}
                              </td>
                              <td className="py-3 px-4 text-xs font-semibold text-white max-w-[180px] truncate">
                                {match.tournamentName || "Tournament Match"}
                              </td>
                              <td className="py-3 px-4 text-xs font-bold text-white">
                                {match.opponent || "Opponent"}
                              </td>
                              <td className="py-3 px-4 text-xs text-[#4AEEFF] font-mono font-bold">
                                {match.score || "—"}
                              </td>
                              <td className="py-3 pl-4 pr-3 text-right">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wide ${
                                    isWin
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                  }`}
                                >
                                  {isWin ? "W" : "L"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>

        </section>

      </main>
    </div>
  );
};

export default PublicProfile;
