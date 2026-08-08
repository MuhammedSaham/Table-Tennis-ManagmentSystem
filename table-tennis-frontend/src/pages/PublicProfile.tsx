import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

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

const calculateAge = (dob: string) => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) age--;
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

const StatCard = ({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
    <div className="text-2xl font-bold text-white">{value}</div>
    <div className="mt-2 text-xs font-medium uppercase tracking-wider text-cyan-400">
      {label}
    </div>
  </div>
);

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "matches">("overview");

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/public/${userId}`);
      setProfile(res.data.data);

      try {
        const statsRes = await api.get(`/matches/player-performance/${userId}`);
        setStats(statsRes.data.data);
      } catch {
        setStats(null);
      }

      if (user && user.id !== userId) {
        await api
          .post(`/users/${userId}/profile-view`, {
            viewerId: user.id,
            viewerName: `${user.firstName} ${user.lastName}`,
          })
          .catch(() => {});
      }
    } catch {
      toast.error("Player not found");
      navigate("/tournaments");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
        <p className="text-sm text-slate-400">Loading player profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  const age = profile.playerProfile?.dateOfBirth ? calculateAge(profile.playerProfile.dateOfBirth) : null;
  const ageCategory = age !== null ? getAgeCategory(age) : null;
  const progress = skillProgress(profile.playerProfile?.skillLevel ?? null);
  const winRateNum = stats ? parseFloat(stats.winRate) : 0;
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

  return (
    <div
      className="relative min-h-screen bg-cover bg-fixed bg-center"
      style={{ backgroundImage: "url('/bg1.png')" }}
    >
      <div className="absolute inset-0 bg-slate-950/80" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        <div className="mb-5 text-sm text-slate-400">
          <Link to="/tournaments" className="transition-colors hover:text-cyan-300">
            Tournaments
          </Link>
          <span className="mx-2 text-slate-600">/</span>
          <span className="text-slate-200">
            {profile.firstName} {profile.lastName}
          </span>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center backdrop-blur-md shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt={profile.firstName}
                className="h-32 w-32 rounded-full object-cover ring-4 ring-cyan-500/40 shadow-lg"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-700 text-4xl font-bold text-white ring-4 ring-cyan-500/40 shadow-lg">
                {initials}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                PLAYER
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                {ageCategory ?? "UNDER 17"}
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-bold text-white">
              {profile.firstName} {profile.lastName}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {profile.playerProfile?.clubAffiliation ?? "Independent player"}
            </p>

            <div className="mt-6 flex flex-col items-center gap-3">
              <div
                className="relative flex h-40 w-40 items-center justify-center rounded-full"
                style={{
                  background: "conic-gradient(#22d3ee " + winRateNum * 3.6 + "deg, rgba(15, 23, 42, 0.7) 0deg)",
                }}
              >
                <div className="flex h-[calc(100%-18px)] w-[calc(100%-18px)] items-center justify-center rounded-full border border-slate-800 bg-slate-950/95 text-center">
                  <div>
                    <div className="text-3xl font-bold text-white">{stats?.winRate ?? "0%"}</div>
                    <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.25em] text-slate-400">
                      Win Rate
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Performance Snapshot</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-md shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                Player Bio & Overview
              </h3>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Active Member
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Skill Level</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-300">
                    {profile.playerProfile?.skillLevel ?? "Unrated"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Club</p>
                <div className="mt-2 flex items-center gap-2 text-slate-100">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="font-semibold">{profile.playerProfile?.clubAffiliation ?? "Not listed"}</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Age / Category</p>
                <div className="mt-2 text-sm font-semibold text-slate-100">
                  {age !== null ? age + " years old - " + ageCategory : ageCategory ?? "Not available"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Member Since</p>
                <div className="mt-2 text-sm font-semibold text-slate-100">
                  {new Date(profile.createdAt).getFullYear()}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Availability / Status</p>
                <div className="mt-2 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                  Active Member
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Skill Progress</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all duration-700"
                    style={{ width: progress + "%" }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Beginner</span>
                  <span>Intermediate</span>
                  <span>Advanced</span>
                  <span>Pro</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
            <StatCard value={stats.totalMatches} label="Matches" />
            <StatCard value={stats.wins} label="Wins" />
            <StatCard value={stats.losses} label="Losses" />
            <StatCard value={stats.gamesStats.total} label="Games Played" />
            <StatCard value={stats.pointsStats.scored} label="Points Scored" />
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          {(["overview", "matches"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                activeTab === tab
                  ? "rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm font-medium text-cyan-400 shadow-[0_10px_30px_rgba(34,211,238,0.12)]"
                  : "rounded-full border border-slate-800 bg-slate-900/50 px-5 py-2 text-sm font-medium text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }
            >
              {tab === "overview" ? "Overview" : "Recent Matches" + (stats ? " (" + stats.recentMatches.length + ")" : "")}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {profile.playerProfile?.skillLevel && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-[0_18px_42px_rgba(0,0,0,0.16)]">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Skill Level</p>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
                    {profile.playerProfile.skillLevel}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all duration-700"
                    style={{ width: progress + "%" }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Beginner</span>
                  <span>Intermediate</span>
                  <span>Advanced</span>
                  <span>Pro</span>
                </div>
              </div>
            )}

            {profile.playerProfile?.clubAffiliation && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-[0_18px_42px_rgba(0,0,0,0.16)]">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Club Affiliation</p>
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-sm font-bold text-cyan-300">
                    TT
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-100">{profile.playerProfile.clubAffiliation}</p>
                    <p className="text-sm text-slate-400">Active Member</p>
                  </div>
                </div>
              </div>
            )}

            {stats && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-[0_18px_42px_rgba(0,0,0,0.16)]">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Games Breakdown</p>
                <div className="flex gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-emerald-400">{stats.gamesStats.won}</div>
                    <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">Won</div>
                  </div>
                  <div className="w-px bg-slate-800" />
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-rose-400">{stats.gamesStats.lost}</div>
                    <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">Lost</div>
                  </div>
                  <div className="w-px bg-slate-800" />
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-cyan-400">{stats.gamesStats.total}</div>
                    <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">Total</div>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-700"
                    style={{ width: stats.gamesStats.total ? (stats.gamesStats.won / stats.gamesStats.total) * 100 + "%" : "0%" }}
                  />
                  <div
                    className="h-full bg-rose-400 transition-all duration-700"
                    style={{ width: stats.gamesStats.total ? (stats.gamesStats.lost / stats.gamesStats.total) * 100 + "%" : "0%" }}
                  />
                </div>
              </div>
            )}

            {stats && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-[0_18px_42px_rgba(0,0,0,0.16)]">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Points Stats</p>
                <div className="flex flex-col gap-3 text-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Points Scored</span>
                    <span className="text-base font-semibold text-emerald-400">{stats.pointsStats.scored}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Points Conceded</span>
                    <span className="text-base font-semibold text-rose-400">{stats.pointsStats.conceded}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                    <span className="text-sm text-slate-400">Avg / Game</span>
                    <span className="text-lg font-bold text-cyan-300">{stats.pointsStats.averagePerGame}</span>
                  </div>
                </div>
              </div>
            )}

            {!stats && (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center backdrop-blur-md lg:col-span-2">
                <div className="mb-3 text-4xl text-cyan-300">TT</div>
                <p className="text-sm text-slate-400">No match statistics yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "matches" && (
          <div>
            {stats && stats.recentMatches.length > 0 ? (
              <div className="flex flex-col gap-3">
                {stats.recentMatches.map((match) => {
                  const isWin = match.result === "Win";
                  return (
                    <div
                      key={match.id}
                      className={
                        "flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md shadow-[0_14px_30px_rgba(0,0,0,0.12)] " +
                        (isWin ? "ring-1 ring-emerald-500/20" : "ring-1 ring-rose-500/20")
                      }
                    >
                      <div
                        className={
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold " +
                          (isWin ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300")
                        }
                      >
                        {isWin ? "W" : "L"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">{match.tournamentName}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          vs <span className="font-semibold text-slate-200">{match.opponent}</span> - {match.categoryName}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className={"text-sm font-bold " + (isWin ? "text-emerald-400" : "text-rose-400")}>{match.score}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
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
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-14 text-center backdrop-blur-md">
                <div className="mb-3 text-5xl text-cyan-300">TT</div>
                <p className="text-sm text-slate-400">No matches played yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
