import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicPlayerProfile {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
  createdAt: string;
  playerProfile?: {
    skillLevel: string | null;
    clubAffiliation: string | null;
    dateOfBirth: string | null;
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

// ─── Shared card surface (matches Users.tsx <main> treatment exactly) ─────────
const CARD =
  "rounded-[16px] border border-white/20 bg-[#061D23]/10 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl";

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) => (
  <div className={`relative overflow-hidden ${CARD} p-5 text-center`}>
    <div className="absolute inset-x-0 top-0 h-[3px] bg-[#4AEEFF]" />
    <div className="font-black text-3xl leading-none text-[#4AEEFF] tracking-wide">
      {value}
    </div>
    <div className="mt-2 text-[11px] font-bold uppercase tracking-widest text-white/60">
      {label}
    </div>
  </div>
);

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

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      // Use the new public endpoint — no auth required
      const res = await api.get(`/users/public/${userId}`);
      setProfile(res.data.data);

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
      <div className="text-xs text-white/50">
        <Link to="/tournaments" className="hover:text-[#4AEEFF] transition-colors">
          Tournaments
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white/80">
          {profile.firstName} {profile.lastName}
        </span>
      </div>

      {/* ── Hero Card (matches Users.tsx <header> treatment exactly) ── */}
      <header className={`relative overflow-hidden ${CARD.replace("bg-[#061D23]/10", "bg-[#061D23]/15")} p-6`}>
        <div className="absolute inset-y-0 left-0 w-[5px] bg-gradient-to-b from-[#4AEEFF] to-[#12679E]" />

        <div className="flex flex-wrap items-center gap-7 pl-2 sm:pl-4">
          {/* Avatar */}
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt={profile.firstName}
              className="h-24 w-24 flex-shrink-0 rounded-full border-2 border-[#4AEEFF] object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#4AEEFF] bg-gradient-to-br from-[#12679E] to-[#061D23] text-3xl font-black tracking-tight text-white">
              {initials}
            </div>
          )}

          {/* Name & badges */}
          <div className="min-w-[200px] flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#4AEEFF] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#061D23]">
                Player
              </span>
              {ageCategory && (
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
                  {ageCategory}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white sm:text-4xl">
              {profile.firstName}{" "}
              <span className="text-[#4AEEFF]">{profile.lastName}</span>
            </h1>

            <div className="mt-3 flex flex-wrap gap-5">
              {profile.playerProfile?.clubAffiliation && (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <span>🏓</span>
                  <span>{profile.playerProfile.clubAffiliation}</span>
                </div>
              )}
              {age !== null && (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <span>🎂</span>
                  <span>{age} years old</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>📅</span>
                <span>Since {new Date(profile.createdAt).getFullYear()}</span>
              </div>
            </div>
          </div>

          {/* Win Rate Circle */}
          {stats && (
            <div className="flex-shrink-0 text-center">
              <svg width="92" height="92" viewBox="0 0 88 88">
                <circle
                  cx="44"
                  cy="44"
                  r="36"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <circle
                  cx="44"
                  cy="44"
                  r="36"
                  fill="none"
                  stroke="#4AEEFF"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(winRateNum / 100) * 226} 226`}
                  transform="rotate(-90 44 44)"
                />
                <text
                  x="44"
                  y="41"
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="16"
                  fontWeight="800"
                >
                  {stats.winRate}
                </text>
                <text
                  x="44"
                  y="55"
                  textAnchor="middle"
                  fill="#4AEEFF"
                  fontSize="9"
                  fontWeight="700"
                  letterSpacing="0.5"
                >
                  WIN RATE
                </text>
              </svg>
            </div>
          )}
        </div>
      </header>

      {/* ── Stats Row ── */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard value={stats.totalMatches} label="Matches" />
          <StatCard value={stats.wins} label="Wins" />
          <StatCard value={stats.losses} label="Losses" />
          <StatCard value={stats.gamesStats.total} label="Games Played" />
          <StatCard value={stats.pointsStats.scored} label="Points Scored" />
        </div>
      )}

      {/* ── Tabs (wrapped in the same card surface as the table header row in Users.tsx) ── */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="flex gap-1 border-b border-white/10 bg-[#061D23]/30 px-2">
          {(["overview", "matches"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`-mb-px border-b-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-colors ${
                activeTab === tab
                  ? "border-[#4AEEFF] text-[#4AEEFF]"
                  : "border-transparent text-white/50 hover:text-white/80"
              }`}
            >
              {tab === "overview"
                ? "Overview"
                : `Recent Matches ${stats ? `(${stats.recentMatches.length})` : ""}`}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── Overview Tab ── */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Skill Level */}
              {profile.playerProfile?.skillLevel && (
                <div className={`${CARD} p-6`}>
                  <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-white/50">
                    Skill Level
                  </p>
                  <div className="mb-3 flex items-center gap-3">
                    <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${skillBadge}`}>
                      {profile.playerProfile.skillLevel}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#4AEEFF] transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-white/40">
                    <span>Beginner</span>
                    <span>Intermediate</span>
                    <span>Advanced</span>
                    <span>Pro</span>
                  </div>
                </div>
              )}

              {/* Club */}
              {profile.playerProfile?.clubAffiliation && (
                <div className={`${CARD} p-6`}>
                  <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-white/50">
                    Club Affiliation
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#4AEEFF]/10 text-xl">
                      🏓
                    </div>
                    <div>
                      <p className="font-bold text-white">
                        {profile.playerProfile.clubAffiliation}
                      </p>
                      <p className="text-xs text-white/50">Active Member</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Games breakdown */}
              {stats && (
                <div className={`${CARD} p-6`}>
                  <p className="mb-4 text-[11px] font-black uppercase tracking-widest text-white/50">
                    Games Breakdown
                  </p>
                  <div className="flex gap-4">
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-black text-emerald-400">
                        {stats.gamesStats.won}
                      </div>
                      <div className="text-[11px] font-bold text-white/50">WON</div>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-black text-red-400">
                        {stats.gamesStats.lost}
                      </div>
                      <div className="text-[11px] font-bold text-white/50">LOST</div>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-black text-[#4AEEFF]">
                        {stats.gamesStats.total}
                      </div>
                      <div className="text-[11px] font-bold text-white/50">TOTAL</div>
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
                      className="bg-red-400 transition-all duration-700"
                      style={{
                        width: `${stats.gamesStats.total ? (stats.gamesStats.lost / stats.gamesStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Points */}
              {stats && (
                <div className={`${CARD} p-6`}>
                  <p className="mb-4 text-[11px] font-black uppercase tracking-widest text-white/50">
                    Points Stats
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Points Scored</span>
                      <span className="text-base font-bold text-emerald-400">
                        {stats.pointsStats.scored}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Points Conceded</span>
                      <span className="text-base font-bold text-red-400">
                        {stats.pointsStats.conceded}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="text-sm text-white/60">Avg / Game</span>
                      <span className="text-lg font-black text-[#4AEEFF]">
                        {stats.pointsStats.averagePerGame}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* No stats fallback */}
              {!stats && (
                <div className="rounded-[16px] border border-dashed border-white/20 bg-[#061D23]/20 p-10 text-center sm:col-span-2">
                  <div className="mb-3 text-4xl">🏓</div>
                  <p className="text-sm text-white/50">No match statistics yet.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Recent Matches Tab ── */}
          {activeTab === "matches" && (
            <div>
              {stats && stats.recentMatches.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {stats.recentMatches.map((match) => {
                    const isWin = match.result === "Win";
                    return (
                      <div
                        key={match.id}
                        className={`flex items-center gap-4 ${CARD} p-4`}
                        style={{
                          borderLeft: `4px solid ${isWin ? "#34d399" : "#f87171"}`,
                        }}
                      >
                        <div
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base ${
                            isWin
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {isWin ? "✓" : "✗"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-white">
                            {match.tournamentName}
                          </p>
                          <p className="mt-0.5 text-xs text-white/60">
                            vs <strong className="text-white/80">{match.opponent}</strong> ·{" "}
                            {match.categoryName}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p
                            className={`text-base font-black ${
                              isWin ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {match.score}
                          </p>
                          <p className="mt-0.5 text-[11px] text-white/40">
                            {new Date(match.date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[16px] border border-dashed border-white/20 bg-[#061D23]/20 p-16 text-center">
                  <div className="mb-3 text-5xl">🏓</div>
                  <p className="text-sm text-white/50">No matches played yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>,
  );
};

export default PublicProfile;