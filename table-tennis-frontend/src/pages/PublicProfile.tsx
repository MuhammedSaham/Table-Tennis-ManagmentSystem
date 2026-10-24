import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  playerProfile?: {
    skillLevel: string | null;
    clubAffiliation: string | null;
    dateOfBirth: string | null;
    ranking?: number | null;
    rankingNote?: string | null;
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calculateAge = (dob: string) => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const formatDateOfBirth = (dob: string) => {
  try {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return dob;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dob;
  }
};

const getAgeCategory = (age: number) => {
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

const getSkillColor = (level: string | null) => {
  switch (level?.toUpperCase()) {
    case "BEGINNER":
      return "bg-sky-500/20 text-sky-300 border border-sky-500/40";
    case "INTERMEDIATE":
      return "bg-amber-500/20 text-amber-300 border border-amber-500/40";
    case "ADVANCED":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
    case "PROFESSIONAL":
      return "bg-purple-500/20 text-purple-300 border border-purple-500/40";
    default:
      return "bg-white/10 text-white/60 border border-white/20";
  }
};

const skillProgress = (level: string | null) => {
  switch (level?.toUpperCase()) {
    case "BEGINNER":
      return 25;
    case "INTERMEDIATE":
      return 50;
    case "ADVANCED":
      return 75;
    case "PROFESSIONAL":
      return 100;
    default:
      return 0;
  }
};



// ─── Main Component ───────────────────────────────────────────────────────────

const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "matches">(
    "overview",
  );
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [totalFavorites, setTotalFavorites] = useState<number>(0);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      // Use the new public endpoint — no auth required
      const res = await api.get(`/users/public/${userId}`);
      setProfile(res.data.data);
      setIsFavorited(Boolean(res.data.data.isFavorited));
      setTotalFavorites(Number(res.data.data.totalFavorites) || 0);

      // Fetch stats (match performance endpoint)
      try {
        const statsRes = await api.get(`/matches/player-performance/${userId}`);
        setStats(statsRes.data.data);
      } catch {
        // Stats are optional — continue without them
        setStats(null);
      }

      // Notify profile owner if a logged-in user is viewing
      if (user && user.id !== userId) {
        await api
          .post(`/users/${userId}/profile-view`, {
            viewerId: user.id,
            viewerName: `${user.firstName} ${user.lastName}`,
          })
          .catch(() => {}); // silent fail — not critical
      }
    } catch {
      toast.error("Player not found");
      navigate("/tournaments");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please log in to add this player to your favorites!", {
        icon: "❤️",
      });
      return;
    }

    if (isFavoriteLoading) return;
    setIsFavoriteLoading(true);

    try {
      const res = await api.post(`/users/${userId}/favorite`);
      const { favorited, totalFavorites: newTotal } = res.data.data;
      setIsFavorited(favorited);
      setTotalFavorites(newTotal);
      if (favorited) {
        toast.success(`Added ${profile?.firstName} to your favorites!`, {
          icon: "❤️",
        });
      } else {
        toast.success(`Removed from favorites`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update favorite");
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  // Matches Users.tsx wrapInBaseLayout exactly: max-w-7xl, space-y-6, p-4 sm:p-6 lg:p-8
  const wrapInBaseLayout = (children: React.ReactNode) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
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

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return wrapInBaseLayout(
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#4AEEFF]" />
        <div className="text-sm font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
          Loading player profile...
        </div>
      </div>,
    );
  }

  if (!profile) return null;

  const age = profile.playerProfile?.dateOfBirth
    ? calculateAge(profile.playerProfile.dateOfBirth)
    : null;
  const ageCategory = age !== null ? getAgeCategory(age) : null;
  const skillBadge = getSkillColor(profile.playerProfile?.skillLevel ?? null);
  const progress = skillProgress(profile.playerProfile?.skillLevel ?? null);
  const winRateNum = stats ? parseFloat(stats.winRate) : 0;

  const initials =
    `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

  return wrapInBaseLayout(
    <>
      {/* ── Breadcrumb ── */}
      <div className="text-xs text-white/50 flex items-center gap-2">
        <Link to="/tournaments" className="hover:text-[#4AEEFF] transition-colors">
          Tournaments
        </Link>
        <span>/</span>
        <span className="text-white/80 font-medium">
          {profile.firstName} {profile.lastName}
        </span>
      </div>

      {/* ── Option 3: Minimalist Frosted Glass Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#061D23]/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Subtle top edge frosted light */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left: Avatar + Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              {profile.profileImage ? (
                <img
                  src={getProfileImageUrl(profile.profileImage)}
                  alt={profile.firstName}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border border-white/20 object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-[#12679E]/40 to-white/5 text-2xl sm:text-3xl font-black text-white shadow-lg">
                  {initials}
                </div>
              )}
            </div>

            {/* Name, Badges & Metadata */}
            <div className="space-y-2">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white/10 border border-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Player
                </span>
                {ageCategory && (
                  <span className="rounded-md bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/70">
                    {ageCategory}
                  </span>
                )}
                {profile.playerProfile?.ranking && (
                  <span className="rounded-md bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                    🏆 #{profile.playerProfile.ranking}
                  </span>
                )}
                {profile.playerProfile?.skillLevel && (
                  <span className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${skillBadge}`}>
                    {profile.playerProfile.skillLevel}
                  </span>
                )}
              </div>

              {/* Player Name */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                {profile.firstName}{" "}
                <span className="text-[#4AEEFF]">{profile.lastName}</span>
              </h1>

              {/* Clean Metadata Info */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-white/60 pt-1">
                {profile.playerProfile?.dateOfBirth && (
                  <div className="flex items-center gap-1.5">
                    <span>🎂</span>
                    <span>
                      {formatDateOfBirth(profile.playerProfile.dateOfBirth)}
                      {age !== null && ` (${age} yrs)`}
                    </span>
                  </div>
                )}
                {profile.playerProfile?.clubAffiliation && (
                  <div className="flex items-center gap-1.5">
                    <span>🏓</span>
                    <span>{profile.playerProfile.clubAffiliation}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span>📅</span>
                  <span>Joined {new Date(profile.createdAt).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions & Circular Metric */}
          <div className="flex items-center gap-5 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
            {/* Win Rate Radial Gauge */}
            {stats && (
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <svg width="68" height="68" viewBox="0 0 68 68">
                    <circle
                      cx="34"
                      cy="34"
                      r="28"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="34"
                      cy="34"
                      r="28"
                      fill="none"
                      stroke="#4AEEFF"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(winRateNum / 100) * 175.9} 175.9`}
                      transform="rotate(-90 34 34)"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xs font-black text-white">
                      {stats.winRate}
                    </span>
                  </div>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] font-black uppercase tracking-wider text-white/40">
                    Rating
                  </div>
                  <div className="text-xs font-bold text-[#4AEEFF]">
                    Win Ratio
                  </div>
                </div>
              </div>
            )}

            {/* Fan Favorite Button */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={isFavoriteLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 text-xs font-bold backdrop-blur-md select-none ${
                isFavorited
                  ? "bg-[#FF4B72]/20 border-[#FF4B72]/70 text-[#FF4B72] shadow-[0_0_15px_rgba(255,75,114,0.3)]"
                  : "bg-white/[0.05] border-white/15 text-white/80 hover:border-[#FF4B72]/50 hover:bg-[#FF4B72]/10 hover:text-[#FF4B72]"
              } ${isFavoriteLoading ? "opacity-60 cursor-not-allowed" : "active:scale-95"}`}
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <span className={`text-base transition-transform duration-200 ${isFavorited ? "scale-110" : ""}`}>
                {isFavorited ? "❤️" : "🤍"}
              </span>
              <span>
                {totalFavorites} {totalFavorites === 1 ? "Fan" : "Fans"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Minimalist Glass Stat Cards ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Win Rate */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md text-center">
            <div className="text-2xl sm:text-3xl font-black text-[#4AEEFF] tracking-tight">
              {stats.winRate}
            </div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#4AEEFF]/70">
              Win Rate
            </div>
          </div>

          {/* Matches */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md text-center">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {stats.totalMatches}
            </div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-white/40">
              Total Matches
            </div>
          </div>

          {/* Wins */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {stats.wins}
            </div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-emerald-400/80 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Wins
            </div>
          </div>

          {/* Losses */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md text-center">
            <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
              {stats.losses}
            </div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-rose-400/80 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Losses
            </div>
          </div>

          {/* Games Won / Total */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md text-center col-span-2 sm:col-span-1">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {stats.gamesStats.won}
              <span className="text-base text-white/40 font-normal"> / {stats.gamesStats.total}</span>
            </div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-white/40">
              Games Won
            </div>
          </div>
        </div>
      )}

      {/* ── Minimalist Segmented Tabs Container ── */}
      <div className="rounded-2xl border border-white/10 bg-[#061D23]/60 backdrop-blur-xl shadow-xl p-6">
        {/* Segmented Controller Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4 mb-6">
          <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-white/10 text-white border border-white/15 shadow-sm"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              Performance Overview
            </button>
            <button
              onClick={() => setActiveTab("matches")}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "matches"
                  ? "bg-white/10 text-white border border-white/15 shadow-sm"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              Recent Matches {stats ? `(${stats.recentMatches.length})` : ""}
            </button>
          </div>

          {/* Small Skill Level Summary */}
          {profile.playerProfile?.skillLevel && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">
              <span className="text-white/40">Skill Progression:</span>
              <span className="font-bold text-white">
                {profile.playerProfile.skillLevel}
              </span>
              <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden ml-1">
                <div
                  className="h-full bg-[#4AEEFF] rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Overview Content ── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Games Breakdown */}
            {stats && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-white/50">
                    Games Ratio
                  </span>
                  <span className="text-xs text-white/40 font-mono">
                    {stats.gamesStats.won}W - {stats.gamesStats.lost}L
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center py-2">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                    <div className="text-2xl font-black text-emerald-400">
                      {stats.gamesStats.won}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-300/70 mt-0.5">WON</div>
                  </div>
                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
                    <div className="text-2xl font-black text-rose-400">
                      {stats.gamesStats.lost}
                    </div>
                    <div className="text-[10px] font-bold text-rose-300/70 mt-0.5">LOST</div>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                    <div className="text-2xl font-black text-[#4AEEFF]">
                      {stats.gamesStats.total}
                    </div>
                    <div className="text-[10px] font-bold text-white/50 mt-0.5">TOTAL</div>
                  </div>
                </div>

                <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="bg-emerald-400 transition-all duration-700"
                    style={{
                      width: `${stats.gamesStats.total ? (stats.gamesStats.won / stats.gamesStats.total) * 100 : 0}%`,
                    }}
                  />
                  <div
                    className="bg-rose-400 transition-all duration-700"
                    style={{
                      width: `${stats.gamesStats.total ? (stats.gamesStats.lost / stats.gamesStats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Points Stats */}
            {stats && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black uppercase tracking-wider text-white/50">
                      Points Overview
                    </span>
                    <span className="text-xs text-white/40">
                      Avg: <strong className="text-[#4AEEFF]">{stats.pointsStats.averagePerGame}</strong> / game
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Points Scored
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        {stats.pointsStats.scored}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400" /> Points Conceded
                      </span>
                      <span className="text-sm font-bold text-rose-400">
                        {stats.pointsStats.conceded}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                  <span>Scored / Conceded Differential</span>
                  <span className={`font-bold ${stats.pointsStats.scored >= stats.pointsStats.conceded ? "text-emerald-400" : "text-rose-400"}`}>
                    {stats.pointsStats.scored - stats.pointsStats.conceded >= 0 ? "+" : ""}
                    {stats.pointsStats.scored - stats.pointsStats.conceded}
                  </span>
                </div>
              </div>
            )}

            {!stats && (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-10 text-center sm:col-span-2">
                <div className="mb-3 text-4xl">🏓</div>
                <p className="text-sm text-white/50">No match statistics available yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Recent Matches Content ── */}
        {activeTab === "matches" && (
          <div>
            {stats && stats.recentMatches.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {stats.recentMatches.map((match) => {
                  const isWin = match.result === "Win";
                  return (
                    <div
                      key={match.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-md hover:bg-white/[0.05] hover:border-white/20 transition-all"
                      style={{
                        borderLeft: `3px solid ${isWin ? "#34d399" : "#f87171"}`,
                      }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            isWin
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {isWin ? "W" : "L"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white text-sm">
                            {match.tournamentName}
                          </p>
                          <p className="text-xs text-white/50 truncate">
                            vs <strong className="text-white/80">{match.opponent}</strong> · {match.categoryName}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <div
                          className={`text-base font-black font-mono ${
                            isWin ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {match.score}
                        </div>
                        <div className="text-[10px] text-white/40">
                          {new Date(match.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-16 text-center">
                <div className="mb-3 text-5xl">🏓</div>
                <p className="text-sm text-white/50">No matches played yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>,
  );
};

export default PublicProfile;