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
    `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();

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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* HEADER MODULE */}
        <header className="flex flex-col justify-between gap-4 rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 h-[3px] w-16 bg-[#4AEEFF]" />
            <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 align-middle mb-2">
              Community Directory
            </span>
            <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white sm:text-4xl">
              Players
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#4AEEFF]/90">
              Browse all registered players and view their profiles
            </p>
          </div>
        </header>

        {/* ── TABS MODULE ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="tab-club-members"
            onClick={() => { setActiveTab("CLUB"); setSearch(""); setSkillFilter("ALL"); }}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4AEEFF] ${
              activeTab === "CLUB"
                ? "bg-[#4AEEFF] text-[#061D23] shadow-lg shadow-[#4AEEFF]/25 scale-[1.02]"
                : "bg-[#061D23]/40 text-white/80 border border-white/15 hover:border-[#4AEEFF]/50 hover:text-white"
            }`}
          >
            <span>🏅 Club Members</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
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
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4AEEFF] ${
              activeTab === "GUEST"
                ? "bg-[#4AEEFF] text-[#061D23] shadow-lg shadow-[#4AEEFF]/25 scale-[1.02]"
                : "bg-[#061D23]/40 text-white/80 border border-white/15 hover:border-[#4AEEFF]/50 hover:text-white"
            }`}
          >
            <span>👤 Guest Players</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === "GUEST"
                  ? "bg-[#061D23]/25 text-[#061D23]"
                  : "bg-white/10 text-[#4AEEFF]"
              }`}
            >
              {guestPlayers.length}
            </span>
          </button>
        </div>

        {/* Tab description */}
        <div className="text-xs text-white/70 px-1">
          {activeTab === "CLUB" ? (
            <p>
              🏅 <strong className="text-white">Club Members</strong> are officially registered players with a club ranking assigned by the admin.
            </p>
          ) : (
            <p>
              👤 <strong className="text-white">Guest Players</strong> self-registered from the public page and do not have an official club ranking yet.
            </p>
          )}
        </div>

        {/* Filters & Search */}
        <div className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/40">🔍</span>
              <input
                type="text"
                placeholder="Search by name or club..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#061D23]/70 border border-white/20 text-white placeholder-white/40 outline-none text-sm focus:border-[#4AEEFF] focus:ring-1 focus:ring-[#4AEEFF] transition-all"
              />
            </div>

            {/* Skill filter pills */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-end">
              {["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSkillFilter(s)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all focus:outline-none ${
                    skillFilter === s
                      ? "bg-[#4AEEFF] text-[#061D23] shadow-md shadow-[#4AEEFF]/25 scale-105"
                      : "bg-[#061D23]/50 text-white/70 border border-white/10 hover:border-[#4AEEFF]/40 hover:text-white"
                  }`}
                >
                  {s === "ALL" ? "All Levels" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[#4AEEFF]/90 text-xs font-mono tracking-wider mt-4">
            {filtered.length} PLAYER{filtered.length !== 1 ? "S" : ""} FOUND
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-28">
            <div className="w-12 h-12 border-4 border-white/20 border-t-[#4AEEFF] rounded-full animate-spin" />
            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
              Loading players...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-[16px] border border-white/20 bg-[#061D23]/15 p-16 text-center backdrop-blur-xl">
            <div className="text-5xl mb-4">{activeTab === "CLUB" ? "🏅" : "👤"}</div>
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              No {activeTab === "CLUB" ? "club members" : "guest players"} found
            </h3>
            <p className="mt-1 text-xs text-white/60">
              Try adjusting your search or skill level filter
            </p>
          </div>
        )}

        {/* Player Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
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
                  className="group relative flex flex-col justify-between rounded-[16px] border border-white/20 bg-[#061D23]/20 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition-all duration-200 hover:border-[#4AEEFF]/60 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Subtle top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#4AEEFF]/50 to-transparent group-hover:via-[#4AEEFF] transition-all" />

                  {/* Corner light blur */}
                  <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#4AEEFF]/5 rounded-full blur-2xl group-hover:bg-[#4AEEFF]/10 transition-all pointer-events-none" />

                  {/* Favorites badge (top-left corner) */}
                  {(player.totalFavorites ?? 0) > 0 && (
                    <span className="absolute top-4 left-4 z-10 flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#FF4B72]/15 text-[#FF4B72] border border-[#FF4B72]/30 backdrop-blur-md">
                      <span>❤️</span>
                      <span>{player.totalFavorites}</span>
                    </span>
                  )}

                  {/* Club member / Guest badge (top-right corner) */}
                  {isClubMember ? (
                    <span className="absolute top-4 right-4 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40">
                      🏅 Club
                    </span>
                  ) : (
                    <span className="absolute top-4 right-4 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-white/10 text-white/60 border border-white/15">
                      👤 Guest
                    </span>
                  )}

                  <div>
                    {/* Avatar */}
                    <div className="relative my-2 flex justify-center">
                      {player.profileImage ? (
                        <div className="relative w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-[#4AEEFF] to-[#12679E] shadow-md shadow-[#4AEEFF]/20">
                          <img
                            src={getProfileImageUrl(player.profileImage)}
                            alt={player.firstName}
                            className="w-full h-full rounded-full object-cover bg-[#061D23]"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="relative w-20 h-20 rounded-full bg-[#061D23] border-2 border-[#4AEEFF]/60 flex items-center justify-center text-xl font-black text-white group-hover:border-[#4AEEFF] group-hover:shadow-[0_0_15px_rgba(74,238,255,0.3)] transition-all">
                          {initials(player)}
                        </div>
                      )}
                    </div>

                    {/* Player Info */}
                    <div className="text-center mt-3 mb-4">
                      <h3 className="text-xl font-bold text-white group-hover:text-[#4AEEFF] transition-colors">
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
                        <p className="text-white/50 text-xs mt-1">
                          DOB: {formatDateOfBirth(player.playerProfile.dateOfBirth)}
                          {age !== null ? ` (${age} yrs)` : ""}
                        </p>
                      )}
                    </div>

                    {/* Club Affiliation */}
                    {player.playerProfile?.clubAffiliation && (
                      <div className="mt-2 pt-3 border-t border-white/10 text-center text-xs text-white/80 flex items-center justify-center gap-1.5 font-medium">
                        <span>🏛️</span>
                        <span>{player.playerProfile.clubAffiliation}</span>
                      </div>
                    )}
                  </div>

                  {/* Skill Badge & Profile Link */}
                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${skillBadgeClass}`}>
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
