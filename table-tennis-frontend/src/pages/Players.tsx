import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { getProfileImageUrl } from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  gender?: "MALE" | "FEMALE" | null;
  ranking?: number | null;
  isClubMember?: boolean;
  profileImage?: string;
  createdAt: string;
  totalFavorites?: number;
  playerProfile?: {
    skillLevel: string | null;
    clubAffiliation: string | null;
    dateOfBirth: string | null;
    gender?: "MALE" | "FEMALE" | null;
    ranking?: number | null;
    isClubMember?: boolean;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calculateAge = (dob: string | null | undefined): number | null => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
};

const PAGE_SIZE = 10;

// ─── Player Avatar Component ──────────────────────────────────────────────────

const PlayerAvatar: React.FC<{ player: Player }> = ({ player }) => {
  const [imageError, setImageError] = useState(false);
  const initials =
    `${player.firstName?.[0] || ""}${player.lastName?.[0] || ""}`.toUpperCase() ||
    "P";

  if (player.profileImage && !imageError) {
    return (
      <img
        src={getProfileImageUrl(player.profileImage)}
        alt={`${player.firstName} ${player.lastName}`}
        onError={() => setImageError(true)}
        className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/20 shadow-sm"
      />
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-full bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 font-bold text-sm flex items-center justify-center shrink-0 select-none shadow-inner"
      aria-label={initials}
    >
      {initials}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Players: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Gender filter, Sorting, Pagination
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"MALE" | "FEMALE">("MALE");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/users/public/players");
      setPlayers(res.data.data || []);
    } catch {
      setError("Failed to load players directory. Please try again.");
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Search Submission
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchQuery(searchInput.trim());
    setCurrentPage(1);
  };

  // Filter & Sort Players
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        // Gender filter
        const pGender = p.gender || p.playerProfile?.gender;
        if (genderFilter === "MALE" && pGender !== "MALE") return false;
        if (genderFilter === "FEMALE" && pGender !== "FEMALE") return false;

        // Search query
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
          return (
            fullName.includes(q) ||
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        const rankA = a.ranking ?? a.playerProfile?.ranking ?? null;
        const rankB = b.ranking ?? b.playerProfile?.ranking ?? null;

        // Unranked players always go after ranked players
        const aIsRanked = rankA !== null && rankA > 0;
        const bIsRanked = rankB !== null && rankB > 0;

        if (aIsRanked && !bIsRanked) return -1;
        if (!aIsRanked && bIsRanked) return 1;

        if (aIsRanked && bIsRanked) {
          return sortAsc ? (rankA as number) - (rankB as number) : (rankB as number) - (rankA as number);
        }

        // Secondary stable alphabetical sort
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [players, genderFilter, searchQuery, sortAsc]);

  // Pagination calculation
  const totalCount = filteredPlayers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIdx = (effectivePage - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, totalCount);
  const paginatedPlayers = filteredPlayers.slice(startIdx, endIdx);

  const toggleSort = () => {
    setSortAsc((prev) => !prev);
    setCurrentPage(1);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
      {/* ─── BG.PNG FIXED FULL-BLEED BACKGROUND ─── */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      {/* Light overlay for text legibility */}
      <div className="fixed inset-0 bg-[#061D23]/25 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35 pointer-events-none" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col space-y-6 px-4 sm:px-6 lg:px-10 xl:px-14 py-6 sm:py-8">
        {/* ─── 1. COMPACT GLASS HEADER MODULE ─── */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 rounded-2xl border border-white/20 bg-[#061D23]/20 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
              PLAYERS
            </h1>
            <p className="mt-1 text-xs uppercase tracking-widest text-[#4AEEFF]">
              Sam&apos;s College TT Club Directory
            </p>
          </div>
        </header>

        {/* ─── 2. GLASS DIRECTORY SECTION ─── */}
        <section aria-label="Players directory" className="space-y-6">
          {/* ── Toolbar: Search, Men/Women Selection, Count ── */}
          <div className="rounded-2xl border border-white/20 bg-[#061D23]/20 p-3.5 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
            {/* Search Input + Button */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center w-full md:w-[460px] lg:w-[480px] rounded-xl overflow-hidden bg-white/10 border border-white/20 focus-within:border-[#4AEEFF] focus-within:ring-1 focus-within:ring-[#4AEEFF] transition-all"
            >
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  setSearchQuery(val.trim());
                  setCurrentPage(1);
                }}
                placeholder="Search players by name..."
                aria-label="Search players by name"
                className="flex-1 bg-transparent px-3.5 sm:px-4 py-2.5 text-sm text-white placeholder-white/50 outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="bg-[#4AEEFF] hover:bg-white text-[#061D23] px-4 py-2.5 transition-colors flex items-center justify-center shrink-0 font-bold"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>

            {/* Men / Women Segmented Pill Controls */}
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setGenderFilter("MALE");
                  setCurrentPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  genderFilter === "MALE"
                    ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                    : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                Men
              </button>

              <button
                type="button"
                onClick={() => {
                  setGenderFilter("FEMALE");
                  setCurrentPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  genderFilter === "FEMALE"
                    ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/45 shadow-[0_0_14px_rgba(74,238,255,0.18)] backdrop-blur-md"
                    : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                Women
              </button>
            </div>

            {/* Total Players Count */}
            <div className="text-sm text-white/70 font-medium md:text-right shrink-0">
              {totalCount} {totalCount === 1 ? "player" : "players"}
            </div>
          </div>

          {/* ── Error State ── */}
          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center my-6 backdrop-blur-xl">
              <p className="text-sm font-semibold text-rose-300">{error}</p>
              <button
                type="button"
                onClick={fetchPlayers}
                className="mt-3 px-4 py-2 bg-[#4AEEFF] text-[#061D23] text-xs font-bold rounded-lg hover:bg-white transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Glass Table Container ── */}
          {!error && (
            <div className="rounded-2xl border border-white/20 bg-[#061D23]/20 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-white/15 text-white/60">
                    {/* Club Rank (14%) */}
                    <th
                      scope="col"
                      className="w-[14%] py-3.5 pr-4 text-xs font-bold uppercase tracking-wider text-[#4AEEFF]"
                    >
                      <button
                        type="button"
                        onClick={toggleSort}
                        aria-label={`Sort by club rank ${sortAsc ? "descending" : "ascending"}`}
                        className="inline-flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4AEEFF] rounded"
                      >
                        <span>CLUB RANK</span>
                        <span className="text-sm font-bold text-white/80">
                          {sortAsc ? "↑" : "↓"}
                        </span>
                      </button>
                    </th>

                    {/* Player (54%) */}
                    <th
                      scope="col"
                      className="w-[54%] py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-[#4AEEFF]"
                    >
                      PLAYER
                    </th>

                    {/* Gender (18%) */}
                    <th
                      scope="col"
                      className="w-[18%] py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-[#4AEEFF]"
                    >
                      GENDER
                    </th>

                    {/* Age (14%) */}
                    <th
                      scope="col"
                      className="w-[14%] py-3.5 pl-4 text-xs font-bold uppercase tracking-wider text-[#4AEEFF]"
                    >
                      AGE
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {/* Loading State */}
                  {loading &&
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="h-[72px] animate-pulse">
                        <td className="py-4 pr-4">
                          <div className="h-5 w-8 rounded bg-white/10" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-full bg-white/10" />
                            <div className="h-5 w-36 rounded bg-white/10" />
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-5 w-16 rounded bg-white/10" />
                        </td>
                        <td className="py-4 pl-4">
                          <div className="h-5 w-10 rounded bg-white/10" />
                        </td>
                      </tr>
                    ))}

                  {/* Empty State */}
                  {!loading && paginatedPlayers.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-16 text-center text-white/60 text-sm"
                      >
                        {searchQuery
                          ? `No players found matching "${searchQuery}".`
                          : `No ${genderFilter === "MALE" ? "men" : "women"} registered in the club directory yet.`}
                      </td>
                    </tr>
                  )}

                  {/* Player Rows */}
                  {!loading &&
                    paginatedPlayers.map((player) => {
                      const rank = player.ranking ?? player.playerProfile?.ranking;
                      const dob = player.playerProfile?.dateOfBirth;
                      const age = calculateAge(dob);
                      const pGender = player.gender || player.playerProfile?.gender;
                      const genderLabel =
                        pGender === "FEMALE"
                          ? "Female"
                          : pGender === "MALE"
                          ? "Male"
                          : "—";

                      return (
                        <tr
                          key={player.id}
                          className="h-[72px] hover:bg-white/5 focus-within:bg-white/5 transition-colors"
                        >
                          {/* Club Rank with Podium Badges */}
                          <td className="py-4 pr-4 align-middle text-base font-bold text-white">
                            {rank !== null && rank !== undefined && rank > 0 ? (
                              rank === 1 ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm shadow-sm ring-2 ring-amber-300/50">
                                  #1
                                </span>
                              ) : rank === 2 ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-bold text-sm ring-1 ring-slate-300">
                                  #2
                                </span>
                              ) : rank === 3 ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-sm ring-1 ring-amber-300/60">
                                  #3
                                </span>
                              ) : (
                                <span className="text-white/80 font-bold text-sm pl-1">
                                  #{rank}
                                </span>
                              )
                            ) : (
                              <span className="text-white/40 font-normal text-xs pl-1">
                                Unranked
                              </span>
                            )}
                          </td>

                          {/* Player (Avatar + Name link) */}
                          <td className="py-4 px-4 align-middle">
                            <Link
                              to={`/profile/${player.id}`}
                              className="group inline-flex items-center gap-3.5 max-w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4AEEFF] rounded"
                            >
                              <PlayerAvatar player={player} />
                              <span className="text-base font-bold text-white group-hover:text-[#4AEEFF] transition-colors truncate">
                                {player.firstName} {player.lastName}
                              </span>
                            </Link>
                          </td>

                          {/* Gender */}
                          <td className="py-4 px-4 align-middle text-sm sm:text-base text-white/80">
                            {genderLabel}
                          </td>

                          {/* Age */}
                          <td className="py-4 pl-4 align-middle text-sm sm:text-base text-white/80 font-medium">
                            {age !== null ? age : "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && !error && totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
              <span className="text-sm text-white/60">
                Showing {startIdx + 1}–{endIdx} of {totalCount}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={effectivePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={`px-4 py-1.5 rounded-xl border text-sm font-semibold transition-all ${
                    effectivePage <= 1
                      ? "border-white/10 text-white/30 cursor-not-allowed bg-white/5"
                      : "border-white/20 bg-white/10 text-white hover:bg-white/20 active:scale-95"
                  }`}
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={effectivePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={`px-4 py-1.5 rounded-xl border text-sm font-semibold transition-all inline-flex items-center gap-1 ${
                    effectivePage >= totalPages
                      ? "border-white/10 text-white/30 cursor-not-allowed bg-white/5"
                      : "border-[#4AEEFF]/40 bg-[#4AEEFF] text-[#061D23] hover:bg-white active:scale-95 shadow-sm font-bold"
                  }`}
                >
                  <span>Next</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Players;
