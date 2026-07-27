import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  ranking?: number;
  profileImage?: string;
  createdAt: string;
  playerProfile?: {
    skillLevel: string | null;
    clubAffiliation: string | null;
    dateOfBirth: string | null;
  };
}

const skillColors: Record<string, { bg: string; text: string }> = {
  BEGINNER: { bg: "#e0f2fe", text: "#0369a1" },
  INTERMEDIATE: { bg: "#fef3c7", text: "#92400e" },
  ADVANCED: { bg: "#dcfce7", text: "#166534" },
  PROFESSIONAL: { bg: "#ede9fe", text: "#4c1d95" },
};

const skillLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"] as const;

const getSkillBorder = (skill?: string) => {
  switch (skill) {
    case "BEGINNER":
      return "border-cyan-300/40 hover:border-cyan-300/80";
    case "INTERMEDIATE":
      return "border-amber-400/40 hover:border-amber-400/80";
    case "ADVANCED":
      return "border-emerald-400/40 hover:border-emerald-400/80";
    case "PROFESSIONAL":
      return "border-indigo-400/40 hover:border-indigo-400/80";
    default:
      return "border-white/15 hover:border-white/30";
  }
};

const calculateAge = (dob: string) => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const Players: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("ALL");

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await api.get("/users/public/players");
        setPlayers(res.data.data);
      } catch {
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const filtered = useMemo(() => {
    let result = players;
    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter(
        (p) =>
          p.firstName.toLowerCase().includes(query) ||
          p.lastName.toLowerCase().includes(query) ||
          p.playerProfile?.clubAffiliation?.toLowerCase().includes(query),
      );
    }

    if (skillFilter !== "ALL") {
      result = result.filter(
        (p) => p.playerProfile?.skillLevel?.toUpperCase() === skillFilter,
      );
    }

    return result;
  }, [players, search, skillFilter]);

  const skillCounts = useMemo(
    () =>
      skillLevels.reduce((acc, level) => {
        acc[level] = players.filter(
          (player) => player.playerProfile?.skillLevel?.toUpperCase() === level,
        ).length;
        return acc;
      }, {} as Record<string, number>),
    [players],
  );

  const initials = (p: Player) =>
    `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();

  return (
    <div
      className="min-h-screen py-8"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(7,19,31,0.85) 0%, rgba(11,61,89,0.75) 40%, rgba(13,94,130,0.7) 100%), url('/bg1.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-12 left-[-4rem] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-[-6rem] h-96 w-96 rounded-full bg-slate-200/5 blur-3xl" />
          <div className="absolute inset-x-0 top-48 h-px bg-white/5" />
          <div className="absolute inset-x-0 top-96 h-px bg-cyan-500/10" />
        </div>

        {/* Header */}
        <div className="relative mb-10">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-[#4AEEFF] to-[#22d3ee] rounded-full flex items-center justify-center shadow-xl shadow-cyan-500/20">
              <img src="/LOGO.png" alt="Logo" className="h-11 w-auto" />
            </div>
            <div className="min-w-0">
              <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">Players</h1>
              <p className="mt-2 max-w-2xl text-base md:text-lg text-cyan-100/85 leading-7">
                Browse all registered players and view their profiles in a premium, sports-inspired dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-950/80 backdrop-blur-xl rounded-[32px] p-6 mb-8 border border-white/10 shadow-2xl shadow-black/20">
          <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name or club..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-900/90 text-white placeholder-slate-400 outline-none border border-white/10 focus:ring-2 focus:ring-[#4AEEFF] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center xl:justify-end">
              {["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSkillFilter(s)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#4AEEFF] ${
                    skillFilter === s
                      ? "bg-gradient-to-r from-[#4AEEFF] to-[#12679E] text-slate-950 shadow-lg shadow-[#4AEEFF]/20"
                      : "bg-slate-900/80 text-white border border-white/10 hover:bg-slate-900/95"
                  }`}
                >
                  {s === "ALL" ? "All Levels" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mt-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-400">Total players</p>
              <p className="mt-2 text-3xl font-bold text-white">{players.length}</p>
            </div>
            {skillLevels.map((level) => (
              <div key={level} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-sm text-slate-400">{level.charAt(0) + level.slice(1).toLowerCase()}</p>
                <p className="mt-2 text-3xl font-bold text-white">{skillCounts[level]}</p>
              </div>
            ))}
          </div>

          <div className="text-white/80 text-sm mt-5">{filtered.length} player{filtered.length !== 1 ? "s" : ""} found</div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-white/30 border-t-[#4AEEFF] rounded-full animate-spin"></div>
            </div>
            <p className="text-white/80 mt-4 text-lg">Loading players…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏓</div>
            <p className="text-white text-xl font-semibold mb-2">No players found</p>
            <p className="text-white/70">Try adjusting your search or filter</p>
          </div>
        )}

        {/* Player Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((player) => {
              const skill = player.playerProfile?.skillLevel?.toUpperCase();
              const skillStyle = skill && skillColors[skill] ? skillColors[skill] : { bg: "#f1f5f9", text: "#475569" };
              const age = player.playerProfile?.dateOfBirth ? calculateAge(player.playerProfile.dateOfBirth) : null;

              return (
                <Link
                  key={player.id}
                  to={`/profile/${player.id}`}
                  className="group relative block h-full"
                  aria-label={`View profile for ${player.firstName} ${player.lastName}`}
                >
                  <div className={`relative h-full overflow-hidden rounded-[32px] border-2 ${getSkillBorder(skill)} bg-slate-950/75 backdrop-blur-xl p-8 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40`}>
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,222,255,0.18),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.10),transparent_20%)] opacity-80" />
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4AEEFF] via-[#12679E] to-transparent" />
                    <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-cyan-500/10 blur-3xl" />

                    <div className="relative z-10">
                      <div className="flex justify-center mb-6">
                        {player.profileImage ? (
                          <div className="relative rounded-full p-1 bg-gradient-to-br from-[#4AEEFF] to-[#12679E] shadow-[0_0_0_8px_rgba(74,222,255,0.08)]">
                            <img
                              src={player.profileImage}
                              alt={player.firstName}
                              className="w-24 h-24 rounded-full object-cover bg-white"
                            />
                          </div>
                        ) : (
                          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#061D23] to-[#12679E] border-4 border-cyan-400/30 shadow-[0_0_0_12px_rgba(74,222,255,0.08)]">
                            <span className="text-3xl font-bold text-white">{initials(player)}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-center mb-6">
                        <h3 className="text-3xl font-bold text-white tracking-tight mb-1">
                          {player.firstName} {player.lastName}
                        </h3>
                        {player.ranking !== undefined && (
                          <span className="inline-flex items-center rounded-full bg-cyan-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                            Rank #{player.ranking}
                          </span>
                        )}
                        {age !== null && (
                          <p className="mt-3 text-sm text-slate-300">{age} years old</p>
                        )}
                      </div>

                      {player.playerProfile?.clubAffiliation && (
                        <div className="text-center mb-6 rounded-3xl border border-white/10 bg-white/5 p-4">
                          <p className="text-slate-200 font-semibold text-sm">
                            <span className="mr-2">🏛️</span>
                            {player.playerProfile.clubAffiliation}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <span
                          style={{ background: skillStyle.bg, color: skillStyle.text }}
                          className="inline-flex px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.3em]"
                        >
                          {player.playerProfile?.skillLevel || "No level set"}
                        </span>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition-transform duration-200 group-hover:translate-x-1">
                          View profile
                          <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Players;
