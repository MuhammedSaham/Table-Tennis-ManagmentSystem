import React, { useEffect, useState } from "react";
import api, { getProfileImageUrl } from "../services/api";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import GlassSelect from "../components/GlassSelect";
import { TrophyIcon, CalendarIcon } from "@heroicons/react/24/outline";

interface Tournament {
  id: string;
  name: string;
  status: string;
}

interface Standing {
  playerId: string;
  playerName: string;
  profileImage?: string | null;
  teamId?: string | null;
  participantType?: "PLAYER" | "TEAM";
  members?: {
    playerId: string;
    playerName: string;
    profileImage?: string | null;
  }[];
  matchesPlayed: number;
  wins: number;
  losses: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
}

interface CategoryStanding {
  categoryId: string;
  categoryName: string;
  totalPlayers: number;
  completedMatches: number;
  standings: Standing[];
}

const capitalizeWords = (str: string): string => {
  if (!str) return "";
  return str
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const getInitials = (name: string): string => {
  if (!name) return "TT";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const PlayerAvatar: React.FC<{
  imageUrl?: string | null;
  name: string;
  sizeClass: string;
  ringClass?: string;
  fallbackBg: string;
  fallbackText: string;
}> = ({ imageUrl, name, sizeClass, ringClass = "", fallbackBg, fallbackText }) => {
  const [imgError, setImgError] = useState(false);
  const src = imageUrl ? getProfileImageUrl(imageUrl) : "";

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${ringClass} shadow-md select-none`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full ${fallbackBg} ${fallbackText} flex items-center justify-center shrink-0 ${ringClass} shadow-md select-none`}
    >
      {getInitials(name)}
    </div>
  );
};

interface ParticipantDisplayProps {
  player: {
    playerId: string;
    playerName: string;
    profileImage?: string | null;
    participantType?: "PLAYER" | "TEAM";
    members?: {
      playerId: string;
      playerName: string;
      profileImage?: string | null;
    }[];
  };
  avatarMap: Map<string, string>;
  variant: "podium-1" | "podium-2" | "podium-3" | "table" | "mobile";
  subtext?: React.ReactNode;
}

const ParticipantDisplay: React.FC<ParticipantDisplayProps> = ({
  player,
  avatarMap,
  variant,
  subtext,
}) => {
  const isTeam =
    player.participantType === "TEAM" ||
    (player.members && player.members.length >= 2) ||
    player.playerName.includes(" & ");

  let members = player.members || [];
  if (isTeam && members.length < 2 && player.playerName.includes(" & ")) {
    const names = player.playerName.split(/\s*&\s*/);
    members = names.map((name) => ({
      playerId: player.playerId,
      playerName: name.trim(),
      profileImage: null,
    }));
  }

  let avatarSize = "w-9 h-9";
  let teamAvatarSize = "w-8 h-8";
  let ringClass = "ring-1 ring-white/20";
  let fallbackBg = "bg-[#4AEEFF]/20 border border-[#4AEEFF]/40";
  let fallbackText = "text-[#4AEEFF] font-black text-xs";
  let nameClass = "font-bold text-white text-sm";
  let hoverClass = "hover:text-[#4AEEFF]";
  let defaultSubtext: React.ReactNode = (
    <div className="text-[11px] text-white/50 truncate">
      Sam&apos;s College TT Club
    </div>
  );

  if (variant === "podium-1") {
    avatarSize = "w-14 h-14";
    teamAvatarSize = "w-12 h-12";
    ringClass = "ring-4 ring-amber-400/80 shadow-lg";
    fallbackBg = "bg-amber-400";
    fallbackText = "text-slate-950 font-black text-base";
    nameClass = "font-black text-white text-base sm:text-lg leading-snug";
    hoverClass = "hover:text-amber-300";
    defaultSubtext = (
      <p className="text-xs text-amber-300 font-bold truncate">
        Tournament Leader
      </p>
    );
  } else if (variant === "podium-2") {
    avatarSize = "w-12 h-12";
    teamAvatarSize = "w-10 h-10";
    ringClass = "ring-2 ring-slate-300/80";
    fallbackBg = "bg-slate-200";
    fallbackText = "text-slate-900 font-extrabold text-sm";
    nameClass = "font-extrabold text-white text-base sm:text-lg leading-snug";
    hoverClass = "hover:text-[#4AEEFF]";
    defaultSubtext = (
      <p className="text-xs text-white/60 truncate">Sam&apos;s College TT</p>
    );
  } else if (variant === "podium-3") {
    avatarSize = "w-12 h-12";
    teamAvatarSize = "w-10 h-10";
    ringClass = "ring-2 ring-amber-500/60 shadow-sm";
    fallbackBg = "bg-amber-600";
    fallbackText = "text-white font-extrabold text-sm";
    nameClass = "font-extrabold text-white text-base sm:text-lg leading-snug";
    hoverClass = "hover:text-[#4AEEFF]";
    defaultSubtext = (
      <p className="text-xs text-white/60 truncate">Sam&apos;s College TT</p>
    );
  } else if (variant === "mobile") {
    avatarSize = "w-8 h-8";
    teamAvatarSize = "w-7 h-7";
    ringClass = "ring-1 ring-white/20";
    fallbackBg = "bg-[#4AEEFF]/20 border border-[#4AEEFF]/40";
    fallbackText = "text-[#4AEEFF] font-black text-xs";
    nameClass = "font-bold text-white text-sm";
    hoverClass = "hover:text-[#4AEEFF]";
    defaultSubtext = null;
  }

  // DOUBLES / TEAM DISPLAY (2 Avatars + 2 Separate Clickable Links)
  if (isTeam && members.length >= 2) {
    return (
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center -space-x-3 shrink-0">
          {members.slice(0, 2).map((m, idx) => {
            const avatarImg =
              m.profileImage || (m.playerId ? avatarMap.get(m.playerId) : null);
            const avatarElem = (
              <PlayerAvatar
                imageUrl={avatarImg}
                name={m.playerName}
                sizeClass={teamAvatarSize}
                ringClass={`${ringClass} ring-2 ring-[#061D23]`}
                fallbackBg={fallbackBg}
                fallbackText={fallbackText}
              />
            );

            return m.playerId ? (
              <Link
                key={m.playerId || idx}
                to={`/profile/${m.playerId}`}
                title={m.playerName}
                className="relative transition-transform hover:scale-110 hover:z-20 shrink-0 block"
                style={{ zIndex: 10 - idx }}
              >
                {avatarElem}
              </Link>
            ) : (
              <div
                key={idx}
                className="relative shrink-0"
                style={{ zIndex: 10 - idx }}
              >
                {avatarElem}
              </div>
            );
          })}
        </div>

        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 leading-snug">
            {members.slice(0, 2).map((m, idx) => (
              <React.Fragment key={m.playerId || idx}>
                {idx > 0 && (
                  <span className="text-white/40 font-bold text-xs select-none">
                    &amp;
                  </span>
                )}
                {m.playerId ? (
                  <Link
                    to={`/profile/${m.playerId}`}
                    className={`${nameClass} ${hoverClass} transition-colors truncate max-w-[130px] sm:max-w-[160px] inline-block hover:underline`}
                    title={m.playerName}
                  >
                    {capitalizeWords(m.playerName)}
                  </Link>
                ) : (
                  <span
                    className={`${nameClass} truncate max-w-[130px] sm:max-w-[160px] inline-block`}
                    title={m.playerName}
                  >
                    {capitalizeWords(m.playerName)}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
          {subtext !== undefined ? subtext : defaultSubtext}
        </div>
      </div>
    );
  }

  // SINGLE PARTICIPANT DISPLAY
  const singleAvatarImg =
    player.profileImage || (player.playerId ? avatarMap.get(player.playerId) : null);
  const singleName = capitalizeWords(player.playerName);

  return (
    <div className="flex items-center gap-3.5 min-w-0">
      {player.playerId ? (
        <Link
          to={`/profile/${player.playerId}`}
          title={singleName}
          className="shrink-0 transition-transform hover:scale-105 block"
        >
          <PlayerAvatar
            imageUrl={singleAvatarImg}
            name={player.playerName}
            sizeClass={avatarSize}
            ringClass={ringClass}
            fallbackBg={fallbackBg}
            fallbackText={fallbackText}
          />
        </Link>
      ) : (
        <PlayerAvatar
          imageUrl={singleAvatarImg}
          name={player.playerName}
          sizeClass={avatarSize}
          ringClass={ringClass}
          fallbackBg={fallbackBg}
          fallbackText={fallbackText}
        />
      )}

      <div className="min-w-0">
        {player.playerId ? (
          <Link
            to={`/profile/${player.playerId}`}
            className={`${nameClass} ${hoverClass} truncate block leading-snug transition-colors hover:underline`}
            title={singleName}
          >
            {singleName}
          </Link>
        ) : (
          <span className={`${nameClass} truncate block leading-snug`}>
            {singleName}
          </span>
        )}
        {subtext !== undefined ? subtext : defaultSubtext}
      </div>
    </div>
  );
};

const Leaderboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTournamentId = searchParams.get("tournament");
  const urlCategoryId = searchParams.get("category");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [standings, setStandings] = useState<CategoryStanding[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [avatarMap, setAvatarMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);

  useEffect(() => {
    const loadAvatars = async () => {
      try {
        const res = await api.get("/users/public/players");
        const map = new Map<string, string>();
        for (const p of res.data.data || []) {
          if (p.profileImage) map.set(p.id, p.profileImage);
        }
        setAvatarMap(map);
      } catch {
        // silent fail
      }
    };
    loadAvatars();
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      setSelectedCategory("");
      fetchStandings();
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const response = await api.get("/tournaments");
      const list = response.data.data;
      setTournaments(list);
      if (list.length > 0) {
        const matched = urlTournamentId
          ? list.find((t: Tournament) => t.id === urlTournamentId)
          : null;
        setSelectedTournament(matched ? matched.id : list[0].id);
      }
    } catch (error) {
      toast.error("Failed to fetch tournaments");
    } finally {
      setLoading(false);
    }
  };

  const fetchStandings = async () => {
    setLoadingStandings(true);

    try {
      const [standingsResponse, playersResponse] = await Promise.all([
        api.get(`/results/tournaments/${selectedTournament}/standings`),
        api.get("/users/public/players"),
      ]);

      // Identify all Club Players using their User IDs.
      const clubPlayerIds = new Set<string>(
        playersResponse.data.data
          .filter(
            (player: { id: string; isClubMember: boolean }) =>
              player.isClubMember === true,
          )
          .map((player: { id: string }) => player.id),
      );

      const filteredStandings: CategoryStanding[] =
        standingsResponse.data.data.map((category: CategoryStanding) => {
          const eligibleStandings = category.standings.filter((entry) => {
            if (entry.participantType === "TEAM") {
              return (
                entry.members?.length === 2 &&
                entry.members.every((member) =>
                  clubPlayerIds.has(member.playerId),
                )
              );
            }
            return clubPlayerIds.has(entry.playerId);
          });

          return {
            ...category,
            standings: eligibleStandings,
            totalPlayers: eligibleStandings.length,
          };
        });

      setStandings(filteredStandings);
      if (filteredStandings.length > 0) {
        setSelectedCategory((prev) => {
          if (urlCategoryId && filteredStandings.some((cat) => cat.categoryId === urlCategoryId)) {
            return urlCategoryId;
          }
          const exists = filteredStandings.some((cat) => cat.categoryId === prev);
          return exists && prev ? prev : filteredStandings[0].categoryId;
        });
      } else {
        setSelectedCategory("");
      }
    } catch (error) {
      toast.error("Failed to fetch standings");
    } finally {
      setLoadingStandings(false);
    }
  };

  const selectedTourneyObj = tournaments.find((t) => t.id === selectedTournament);
  const currentCategory =
    standings.find((cat) => cat.categoryId === selectedCategory) ||
    standings[0];
  const displayedStandings = currentCategory ? [currentCategory] : [];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white flex flex-col">
      {/* ─── BG.PNG FIXED FULL-BLEED BACKGROUND ─── */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      <div className="fixed inset-0 bg-[#061D23]/25 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35 pointer-events-none" />

      {/* ─── MAIN BODY CONTENT ─── */}
      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 py-6 sm:py-8 space-y-6 flex-1">
        {/* ─── 1. COMPACT GLASS HEADER MODULE WITH DUAL DROPDOWNS ─── */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl border border-white/20 bg-[#061D23]/20 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
          {/* Left: Leaderboard title */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
              LEADERBOARD
            </h1>
            <p className="mt-1 text-xs uppercase tracking-widest text-[#4AEEFF]">
              Official Standings
            </p>
          </div>

          {/* Right: Dual Control Dropdowns (Tournament + Category) */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
            {/* 1. Tournament Switcher Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/70 hidden sm:flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-[#4AEEFF]" />
                Tournament:
              </span>
              {loading ? (
                <div className="h-9 w-44 bg-white/10 rounded-xl animate-pulse" />
              ) : (
                <GlassSelect
                  value={selectedTournament}
                  onChange={(e) => {
                    const newTId = e.target.value;
                    setSelectedTournament(newTId);
                    setSearchParams({ tournament: newTId });
                  }}
                  aria-label="Select tournament"
                >
                  {tournaments.map((tournament) => (
                    <option
                      key={tournament.id}
                      value={tournament.id}
                      className="bg-[#061D23] text-white"
                    >
                      {tournament.name} ({tournament.status})
                    </option>
                  ))}
                </GlassSelect>
              )}
            </div>

            {/* 2. Category Dropdown (Clean, non-cramped selector) */}
            {standings.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/70 hidden sm:inline-block">
                  Category:
                </span>
                <GlassSelect
                  value={selectedCategory || standings[0]?.categoryId}
                  onChange={(e) => {
                    const newCId = e.target.value;
                    setSelectedCategory(newCId);
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set("category", newCId);
                      return next;
                    });
                  }}
                  aria-label="Select category"
                >
                  {standings.map((cat) => (
                    <option
                      key={cat.categoryId}
                      value={cat.categoryId}
                      className="bg-[#061D23] text-white"
                    >
                      {cat.categoryName} ({cat.totalPlayers} {cat.totalPlayers === 1 ? "Player" : "Players"})
                    </option>
                  ))}
                </GlassSelect>
              </div>
            )}
          </div>
        </header>

        {/* Category Standings Content */}
        {loadingStandings ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-white/20 border-t-[#4AEEFF] rounded-full animate-spin" />
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-[#4AEEFF]">
              Loading standings...
            </p>
          </div>
        ) : standings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-[#061D23]/40 backdrop-blur-xl p-12 text-center">
            <TrophyIcon className="mx-auto mb-3 h-10 w-10 text-white/40" />
            <p className="text-base font-bold text-white">
              No standings available for {selectedTourneyObj?.name || "this tournament"} yet.
            </p>
            <p className="mt-1 text-xs text-white/60">
              Complete tournament matches to calculate group standings and ranking points.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {displayedStandings.map((category) => {
              const top1 = category.standings[0];
              const top2 = category.standings[1];
              const top3 = category.standings[2];

              return (
                <section
                  key={category.categoryId}
                  className="space-y-4"
                >
                  {category.standings.length > 0 && (
                    /* ─── TOP 3 PODIUM HERO SHOWCASE (Frosted Glass Cards) ─── */
                    <div
                      key={`podium-${selectedTournament}-${category.categoryId}`}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2 pb-4 items-end"
                    >
                      {/* #2 SILVER (Left) */}
                      {top2 ? (
                        <div className="order-2 md:order-1 rounded-2xl border border-white/20 bg-[#061D23]/30 p-5 shadow-[0_20px_50px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl hover:border-slate-300/50 transition-all duration-300 transform hover:-translate-y-1 animate-fade-up-1 relative overflow-hidden flex flex-col justify-between h-[195px]">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-200/90 text-slate-900 font-extrabold text-xs shadow-sm ring-1 ring-white/40">
                              #2 SILVER
                            </span>
                            <span className="text-xs font-bold text-white/70">
                              {top2.wins}W - {top2.losses}L
                            </span>
                          </div>
                          <div className="my-auto">
                            <ParticipantDisplay
                              player={top2}
                              avatarMap={avatarMap}
                              variant="podium-2"
                              subtext={<p className="text-xs text-white/60 truncate">Sam&apos;s College TT</p>}
                            />
                          </div>
                          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                            <span className="text-xs font-medium text-white/60">{top2.matchesPlayed} Matches</span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#061D23] text-[#4AEEFF] font-black text-sm border border-[#4AEEFF]/30 shadow-sm">
                              {top2.points} <span className="text-[10px] text-[#4AEEFF]/70 font-normal">pts</span>
                            </span>
                          </div>
                        </div>
                      ) : <div className="order-2 md:order-1" />}

                      {/* #1 GOLD CHAMPION (Center / Taller / Prominent) */}
                      {top1 && (
                        <div className="order-1 md:order-2 rounded-2xl border-2 border-amber-400/80 bg-gradient-to-b from-[#061D23]/60 via-[#061D23]/40 to-[#061D23]/50 p-6 shadow-[0_0_35px_rgba(251,191,36,0.2)] hover:shadow-[0_0_45px_rgba(251,191,36,0.3)] backdrop-blur-xl transition-all duration-300 transform hover:-translate-y-2 animate-fade-up-2 relative overflow-hidden flex flex-col justify-between h-[225px]">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md ring-2 ring-amber-300">
                              ★ #1 CHAMPION
                            </span>
                            <span className="text-xs font-bold text-emerald-400">
                              {top1.wins}W - {top1.losses}L
                            </span>
                          </div>
                          <div className="my-auto">
                            <ParticipantDisplay
                              player={top1}
                              avatarMap={avatarMap}
                              variant="podium-1"
                              subtext={<p className="text-xs text-amber-300 font-bold truncate">Tournament Leader</p>}
                            />
                          </div>
                          <div className="pt-2.5 border-t border-amber-400/20 flex items-center justify-between">
                            <span className="text-xs font-medium text-white/70">{top1.matchesPlayed} Matches</span>
                            <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-lg bg-[#061D23] text-[#4AEEFF] font-black text-base border border-[#4AEEFF]/40 shadow-md">
                              {top1.points} <span className="text-xs text-[#4AEEFF]/70 font-normal">pts</span>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* #3 BRONZE (Right) */}
                      {top3 ? (
                        <div className="order-3 rounded-2xl border border-white/20 bg-[#061D23]/30 p-5 shadow-[0_20px_50px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl hover:border-amber-500/50 transition-all duration-300 transform hover:-translate-y-1 animate-fade-up-3 relative overflow-hidden flex flex-col justify-between h-[185px]">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-amber-700/90 text-amber-100 font-extrabold text-xs shadow-sm ring-1 ring-amber-400/40">
                              #3 BRONZE
                            </span>
                            <span className="text-xs font-bold text-white/70">
                              {top3.wins}W - {top3.losses}L
                            </span>
                          </div>
                          <div className="my-auto">
                            <ParticipantDisplay
                              player={top3}
                              avatarMap={avatarMap}
                              variant="podium-3"
                              subtext={<p className="text-xs text-white/60 truncate">Sam&apos;s College TT</p>}
                            />
                          </div>
                          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                            <span className="text-xs font-medium text-white/60">{top3.matchesPlayed} Matches</span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#061D23] text-[#4AEEFF] font-black text-sm border border-[#4AEEFF]/30 shadow-sm">
                              {top3.points} <span className="text-[10px] text-[#4AEEFF]/70 font-normal">pts</span>
                            </span>
                          </div>
                        </div>
                      ) : <div className="order-3" />}
                    </div>
                  )}

                  {category.standings.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-[#061D23]/30 backdrop-blur-xl p-6 text-center text-xs text-white/60">
                      No completed fixtures in this category yet.
                    </div>
                  ) : (
                    /* ─── FROSTED GLASS CARD CONTAINER (Table + Mobile Cards) ─── */
                    <div className="rounded-2xl border border-white/20 bg-[#061D23]/20 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl overflow-hidden text-white">
                      {/* DESKTOP STANDINGS TABLE */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/15 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-[#4AEEFF]">
                              <th className="px-5 py-3.5 text-center w-20">Rank</th>
                              <th className="px-5 py-3.5">Player / Participant</th>
                              <th className="px-5 py-3.5 text-center">Played</th>
                              <th className="px-5 py-3.5 text-center">Won</th>
                              <th className="px-5 py-3.5 text-center">Lost</th>
                              <th className="px-5 py-3.5 text-center">Games (W - L)</th>
                              <th className="px-5 py-3.5 text-right w-28">Points</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10 text-sm">
                            {category.standings.map((player, index) => {
                              const rankNumber = index + 1;
                              const isTop1 = rankNumber === 1;
                              const isTop2 = rankNumber === 2;
                              const isTop3 = rankNumber === 3;

                              return (
                                <tr
                                  key={player.playerId}
                                  className={`group transition-colors ${
                                    isTop1
                                      ? "bg-amber-400/10 hover:bg-amber-400/15"
                                      : "hover:bg-white/5"
                                  }`}
                                >
                                  {/* Rank */}
                                  <td className="px-5 py-4 text-center">
                                    {isTop1 ? (
                                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm shadow-sm ring-2 ring-amber-300/50">
                                        #1
                                      </span>
                                    ) : isTop2 ? (
                                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-bold text-sm ring-1 ring-slate-300">
                                        #2
                                      </span>
                                    ) : isTop3 ? (
                                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-sm ring-1 ring-amber-300/60">
                                        #3
                                      </span>
                                    ) : (
                                      <span className="text-white/60 font-bold text-sm">
                                        #{rankNumber}
                                      </span>
                                    )}
                                  </td>

                                  {/* Player Name & Avatar */}
                                  <td className="px-5 py-4">
                                    <ParticipantDisplay
                                      player={player}
                                      avatarMap={avatarMap}
                                      variant="table"
                                      subtext={
                                        <div className="text-[11px] text-white/50 truncate">
                                          Sam&apos;s College TT Club
                                        </div>
                                      }
                                    />
                                  </td>

                                  {/* Played */}
                                  <td className="px-5 py-4 text-center font-semibold text-white/80">
                                    {player.matchesPlayed}
                                  </td>

                                  {/* Won */}
                                  <td className="px-5 py-4 text-center font-bold text-emerald-400">
                                    {player.wins}
                                  </td>

                                  {/* Lost */}
                                  <td className="px-5 py-4 text-center font-medium text-white/50">
                                    {player.losses}
                                  </td>

                                  {/* Games Won - Lost */}
                                  <td className="px-5 py-4 text-center font-semibold text-white/80">
                                    <span className="text-white">{player.gamesWon}</span>
                                    <span className="text-white/40 mx-1">–</span>
                                    <span className="text-white/70">{player.gamesLost}</span>
                                  </td>

                                  {/* Points Badge */}
                                  <td className="px-5 py-4 text-right">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#061D23] text-[#4AEEFF] font-black text-sm border border-[#4AEEFF]/30 shadow-sm">
                                      <span>{player.points}</span>
                                      <span className="text-[10px] text-[#4AEEFF]/70 font-normal">pts</span>
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* MOBILE STANDINGS CARDS */}
                      <div className="space-y-3 sm:hidden p-4">
                        {category.standings.map((player, index) => {
                          const rankNumber = index + 1;
                          const isTop1 = rankNumber === 1;

                          return (
                            <div
                              key={player.playerId}
                              className={`rounded-xl border p-4 shadow-sm transition-all ${
                                isTop1
                                  ? "bg-amber-400/10 border-amber-400/40"
                                  : "bg-white/5 border-white/10"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                    #{rankNumber}
                                  </span>
                                  <ParticipantDisplay
                                    player={player}
                                    avatarMap={avatarMap}
                                    variant="mobile"
                                    subtext={
                                      <span className="text-[10px] text-white/50 block truncate">
                                        {player.matchesPlayed} played · {player.wins}W - {player.losses}L
                                      </span>
                                    }
                                  />
                                </div>

                                <div className="shrink-0 text-right">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#061D23] text-[#4AEEFF] font-black text-xs border border-[#4AEEFF]/30">
                                    {player.points} <span className="text-[8px] text-[#4AEEFF]/70">pts</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
