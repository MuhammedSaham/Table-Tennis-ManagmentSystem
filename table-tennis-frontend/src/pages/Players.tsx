import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getProfileImageUrl } from "../services/api";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  ranking?: number;
  isClubMember?: boolean;
  profileImage?: string;
  createdAt: string;
  totalFavorites?: number;
  playerProfile?: {
    skillLevel: string | null;
    clubAffiliation: string | null;
    dateOfBirth: string | null;
  };
}

const skillColors: Record<string, { badge: string }> = {
  BEGINNER: { badge: "border-sky-400/40 bg-sky-400/10 text-sky-300" },
  INTERMEDIATE: { badge: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
  ADVANCED: { badge: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" },
  PROFESSIONAL: { badge: "border-purple-400/40 bg-purple-400/10 text-purple-300" },
};

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

type TabType = "CLUB" | "GUEST";

const Players: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filtered, setFiltered] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<TabType>("CLUB");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      return "list";
    }
    return "grid";
  });

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

  useEffect(() => {
    fetchPlayers();
  }, []);

  // Split players by tab — use isClubMember set by admin on creation
  const clubPlayers = players.filter((p) => p.isClubMember === true);
  const guestPlayers = players.filter((p) => !p.isClubMember);
  const tabPlayers = activeTab === "CLUB" ? clubPlayers : guestPlayers;

  useEffect(() => {
    let result = tabPlayers;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.playerProfile?.clubAffiliation?.toLowerCase().includes(q)
      );
    }
    if (skillFilter !== "ALL") {
      result = result.filter(
        (p) => p.playerProfile?.skillLevel?.toUpperCase() === skillFilter
      );
    }
    setFiltered(result);
  }, [search, skillFilter, players, activeTab]);

  const initials = (p: Player) =>
    `${p.firstName?.[0] || ""}${p.lastName?.[0] || ""}`.toUpperCase() || "P";

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
      {/* ─── BG.PNG FIXED FULL-BLEED BACKGROUND ─── */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      {/* Light overlay for text legibility */}
      <div className="fixed inset-0 bg-[#061D23]/25" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-4 sm:space-y-6 px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* HEADER MODULE */}
        <header className="flex flex-col justify-between gap-3 rounded-[16px] border border-white/20 bg-[#061D23]/15 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 sm:mb-3 h-[3px] w-12 sm:w-16 bg-[#4AEEFF]" />
            <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 align-middle mb-1.5">
              Community Directory
            </span>
            <h1 className="text-2xl font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white sm:text-4xl">
              Players
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.15em] sm:tracking-[0.3em] text-[#4AEEFF]/90">
              Browse all registered players and view their profiles
            </p>
          </div>
        </header>

        {/* ── TABS MODULE (Side-by-side on mobile & desktop) ── */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
          <button
            id="tab-club-members"
            onClick={() => { setActiveTab("CLUB"); setSearch(""); setSkillFilter("ALL"); }}
            className={`flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4AEEFF] ${
              activeTab === "CLUB"
                ? "bg-[#4AEEFF] text-[#061D23] shadow-lg shadow-[#4AEEFF]/25 scale-[1.01]"
                : "bg-[#061D23]/40 text-white/80 border border-white/15 hover:border-[#4AEEFF]/50 hover:text-white"
            }`}
          >
            <span className="truncate">🏅 Club Members</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                activeTab === "CLUB"
                  ? "bg-[#061D23]/25 text-[#061D23]"
                  : "bg-white/10 text-[#4AEEFF]"
              }`}
            >
              {clubPlayers.length}
            </span>
          </button>

          <button
            id="tab-guest-players"
            onClick={() => { setActiveTab("GUEST"); setSearch(""); setSkillFilter("ALL"); }}
            className={`flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4AEEFF] ${
              activeTab === "GUEST"
                ? "bg-[#4AEEFF] text-[#061D23] shadow-lg shadow-[#4AEEFF]/25 scale-[1.01]"
                : "bg-[#061D23]/40 text-white/80 border border-white/15 hover:border-[#4AEEFF]/50 hover:text-white"
            }`}
          >
            <span className="truncate">👤 Guest Players</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                activeTab === "GUEST"
                  ? "bg-[#061D23]/25 text-[#061D23]"
                  : "bg-white/10 text-[#4AEEFF]"
              }`}
            >
              {guestPlayers.length}
            </span>
          </button>
        </div>

        {/* Tab description pill */}
        <div className="rounded-xl border border-white/10 bg-[#061D23]/30 px-3.5 py-2 text-xs text-white/75 backdrop-blur-md flex items-center gap-2">
          <span className="text-sm shrink-0">{activeTab === "CLUB" ? "🏅" : "👤"}</span>
          <p className="leading-snug">
            {activeTab === "CLUB" ? (
              <>
                <strong className="text-white">Club Members:</strong> Officially registered players with assigned club rankings.
              </>
            ) : (
              <>
                <strong className="text-white">Guest Players:</strong> Self-registered community players without an official ranking yet.
              </>
            )}
          </p>
        </div>

        {/* Filters & Search */}
        <div className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/40">🔍</span>
              <input
                type="text"
                placeholder="Search by name or club..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-xl bg-[#061D23]/70 border border-white/20 text-white placeholder-white/40 outline-none text-sm focus:border-[#4AEEFF] focus:ring-1 focus:ring-[#4AEEFF] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Skill filter pills & View Switcher */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar flex-1 min-w-0">
                {["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSkillFilter(s)}
                    className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all focus:outline-none ${
                      skillFilter === s
                        ? "bg-[#4AEEFF] text-[#061D23] shadow-md shadow-[#4AEEFF]/25 scale-105"
                        : "bg-[#061D23]/50 text-white/70 border border-white/10 hover:border-[#4AEEFF]/40 hover:text-white"
                    }`}
                  >
                    {s === "ALL" ? "All Levels" : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-[#061D23]/60 border border-white/15 rounded-lg p-0.5 shrink-0 ml-1">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  title="List View"
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === "list"
                      ? "bg-[#4AEEFF] text-[#061D23] shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === "grid"
                      ? "bg-[#4AEEFF] text-[#061D23] shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#4AEEFF]/90 font-mono tracking-wider pt-2 border-t border-white/10">
            <span>
              {filtered.length} PLAYER{filtered.length !== 1 ? "S" : ""} FOUND
            </span>
            {skillFilter !== "ALL" && (
              <button
                onClick={() => setSkillFilter("ALL")}
                className="text-white/60 hover:text-[#4AEEFF] text-[11px] underline"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-white/20 border-t-[#4AEEFF] rounded-full animate-spin" />
            <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
              Loading players...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-[16px] border border-white/20 bg-[#061D23]/15 p-12 text-center backdrop-blur-xl">
            <div className="text-4xl mb-3">{activeTab === "CLUB" ? "🏅" : "👤"}</div>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
              No {activeTab === "CLUB" ? "club members" : "guest players"} found
            </h3>
            <p className="mt-1 text-xs text-white/60">
              Try adjusting your search or skill level filter
            </p>
          </div>
        )}

        {/* Player Roster: LIST VIEW (Sleek, High-Density for Mobile & Desktop) */}
        {!loading && filtered.length > 0 && viewMode === "list" && (
          <div className="flex flex-col gap-2.5 sm:gap-3 pb-8">
            {filtered.map((player) => {
              const skill = player.playerProfile?.skillLevel?.toUpperCase();
              const skillBadgeClass =
                skill && skillColors[skill]
                  ? skillColors[skill].badge
                  : "border-white/20 bg-white/5 text-white/60";
              const age =
                player.playerProfile?.dateOfBirth
                  ? calculateAge(player.playerProfile.dateOfBirth)
                  : null;
              const isClubMember = player.isClubMember === true;

              return (
                <Link
                  key={player.id}
                  to={`/profile/${player.id}`}
                  className="group relative flex items-center justify-between rounded-xl sm:rounded-2xl border border-white/15 bg-[#061D23]/30 p-3 sm:p-4 shadow-[0_15px_35px_-10px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all duration-200 hover:border-[#4AEEFF]/60 hover:bg-[#061D23]/50 hover:-translate-y-0.5 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#4AEEFF]/40 to-transparent group-hover:via-[#4AEEFF] transition-all" />

                  {/* Left: Avatar + Player Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {player.profileImage ? (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#4AEEFF] to-[#12679E] shadow-sm">
                          <img
                            src={getProfileImageUrl(player.profileImage)}
                            alt={player.firstName}
                            className="w-full h-full rounded-full object-cover bg-[#061D23]"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#061D23] border border-[#4AEEFF]/50 flex items-center justify-center text-sm sm:text-base font-black text-white group-hover:border-[#4AEEFF] group-hover:shadow-[0_0_12px_rgba(74,238,255,0.35)] transition-all">
                          {initials(player)}
                        </div>
                      )}
                      {(player.totalFavorites ?? 0) > 0 && (
                        <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-[#FF4B72] text-white shadow-sm">
                          ❤️{player.totalFavorites}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-white capitalize truncate group-hover:text-[#4AEEFF] transition-colors">
                          {player.firstName} {player.lastName}
                        </h3>
                        {isClubMember ? (
                          <span className="shrink-0 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/30">
                            Club
                          </span>
                        ) : (
                          <span className="shrink-0 px-2 py-0.5 text-[9px] font-medium uppercase rounded bg-white/10 text-white/60">
                            Guest
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                        {isClubMember && player.ranking ? (
                          <span className="px-2 py-0.5 text-[10px] font-black rounded bg-[#4AEEFF] text-[#061D23]">
                            Rank #{player.ranking}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-white/10 text-white/60">
                            Unranked
                          </span>
                        )}

                        {player.playerProfile?.skillLevel && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${skillBadgeClass}`}>
                            {player.playerProfile.skillLevel}
                          </span>
                        )}

                        {age !== null && (
                          <span className="text-[11px] text-white/50 hidden xs:inline">
                            {age} yrs
                          </span>
                        )}
                      </div>

                      {player.playerProfile?.clubAffiliation && (
                        <p className="text-[11px] text-white/60 truncate mt-1 flex items-center gap-1">
                          <span>🏛️</span>
                          <span className="truncate">{player.playerProfile.clubAffiliation}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Arrow */}
                  <div className="shrink-0 pl-3">
                    <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#4AEEFF] group-hover:translate-x-1 transition-transform">
                      <span className="hidden sm:inline">Profile</span>
                      <span>→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Player Roster: GRID VIEW (Compact & Balanced for Mobile & Desktop) */}
        {!loading && filtered.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 pb-8">
            {filtered.map((player) => {
              const skill = player.playerProfile?.skillLevel?.toUpperCase();
              const skillBadgeClass =
                skill && skillColors[skill]
                  ? skillColors[skill].badge
                  : "border-white/20 bg-white/5 text-white/60";
              const age =
                player.playerProfile?.dateOfBirth
                  ? calculateAge(player.playerProfile.dateOfBirth)
                  : null;
              const isClubMember = player.isClubMember === true;

              return (
                <Link
                  key={player.id}
                  to={`/profile/${player.id}`}
                  className="group relative flex flex-col justify-between rounded-[16px] border border-white/20 bg-[#061D23]/20 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all duration-200 hover:border-[#4AEEFF]/60 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Subtle top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#4AEEFF]/50 to-transparent group-hover:via-[#4AEEFF] transition-all" />

                  {/* Corner light blur */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#4AEEFF]/5 rounded-full blur-2xl group-hover:bg-[#4AEEFF]/10 transition-all pointer-events-none" />

                  {/* Favorites badge */}
                  {(player.totalFavorites ?? 0) > 0 && (
                    <span className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#FF4B72]/15 text-[#FF4B72] border border-[#FF4B72]/30 backdrop-blur-md">
                      <span>❤️</span>
                      <span>{player.totalFavorites}</span>
                    </span>
                  )}

                  {/* Club member / Guest badge */}
                  {isClubMember ? (
                    <span className="absolute top-3.5 right-3.5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40">
                      🏅 Club
                    </span>
                  ) : (
                    <span className="absolute top-3.5 right-3.5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-white/10 text-white/60 border border-white/15">
                      👤 Guest
                    </span>
                  )}

                  <div>
                    {/* Avatar */}
                    <div className="relative my-1.5 sm:my-2 flex justify-center">
                      {player.profileImage ? (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-gradient-to-tr from-[#4AEEFF] to-[#12679E] shadow-md shadow-[#4AEEFF]/20">
                          <img
                            src={getProfileImageUrl(player.profileImage)}
                            alt={player.firstName}
                            className="w-full h-full rounded-full object-cover bg-[#061D23]"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#061D23] border-2 border-[#4AEEFF]/60 flex items-center justify-center text-lg sm:text-xl font-black text-white group-hover:border-[#4AEEFF] group-hover:shadow-[0_0_15px_rgba(74,238,255,0.3)] transition-all">
                          {initials(player)}
                        </div>
                      )}
                    </div>

                    {/* Player Info */}
                    <div className="text-center mt-2 sm:mt-3 mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-xl font-bold capitalize text-white group-hover:text-[#4AEEFF] transition-colors">
                        {player.firstName} {player.lastName}
                      </h3>
                      {isClubMember ? (
                        <div className="mt-1">
                          <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF] text-[#061D23]">
                            Rank #{player.ranking}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold tracking-wider rounded-md bg-white/10 text-white/60 border border-white/10">
                            Unranked
                          </span>
                        </div>
                      )}
                      {player.playerProfile?.dateOfBirth && (
                        <p className="text-white/50 text-[11px] sm:text-xs mt-1">
                          DOB: {formatDateOfBirth(player.playerProfile.dateOfBirth)}
                          {age !== null ? ` (${age} yrs)` : ""}
                        </p>
                      )}
                    </div>

                    {/* Club Affiliation */}
                    {player.playerProfile?.clubAffiliation && (
                      <div className="mt-1.5 sm:mt-2 pt-2.5 sm:pt-3 border-t border-white/10 text-center text-xs text-white/80 flex items-center justify-center gap-1.5 font-medium truncate">
                        <span>🏛️</span>
                        <span className="truncate">{player.playerProfile.clubAffiliation}</span>
                      </div>
                    )}
                  </div>

                  {/* Skill Badge & Profile Link */}
                  <div className="mt-3 sm:mt-5 pt-2.5 sm:pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider border ${skillBadgeClass}`}>
                      {player.playerProfile?.skillLevel || "NO LEVEL SET"}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-[#4AEEFF] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Profile →
                    </span>
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
