import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { UserGroupIcon, MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  playerProfile?: {
    skillLevel: string;
    clubAffiliation: string;
    dateOfBirth: string | null;
  };
  _count?: { registrations: number };
}

const skillColors: Record<string, string> = {
  Beginner:     "bg-[#4AEEFF]/10 text-[#4AEEFF] border border-[#4AEEFF]/30",
  Intermediate: "bg-[#12679E]/30 text-[#CFF9FF] border border-[#12679E]",
  Advanced:     "bg-[#FFFFFF]/10 text-white border border-white/30",
};

const Players: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filtered, setFiltered] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("ALL");

  useEffect(() => { fetchPlayers(); }, []);

  useEffect(() => {
    let result = players;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.playerProfile?.clubAffiliation ?? "").toLowerCase().includes(q)
      );
    }
    if (skillFilter !== "ALL") {
      result = result.filter((p) => p.playerProfile?.skillLevel === skillFilter);
    }
    setFiltered(result);
  }, [search, skillFilter, players]);

  const fetchPlayers = async () => {
    try {
      const response = await api.get("/users?role=PLAYER");
      setPlayers(response.data.data);
      setFiltered(response.data.data);
    } catch {
      toast.error("Failed to fetch players");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#061D23_0%,#123B4A_100%)]">
      <p className="text-[#4AEEFF] text-lg uppercase tracking-[0.2em]">Loading players...</p>
    </div>
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[linear-gradient(180deg,#061D23_0%,#123B4A_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col space-y-6">

        {/* Header — matches Dashboard header card */}
        <div className="rounded-[24px] border border-[#12679E] bg-[linear-gradient(135deg,#123B4A_0%,#061D23_100%)] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
          <div className="mb-4 h-1 w-24 rounded-full bg-[#CFF9FF]" />
          <div className="flex items-center gap-3">
            <UserGroupIcon className="h-8 w-8 text-[#4AEEFF]" />
            <div>
              <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-white">Players</h1>
              <p className="text-sm uppercase tracking-[0.25em] text-[#D8FBFF]">{players.length} registered players</p>
            </div>
          </div>
        </div>

        {/* Search & Filter — matches Dashboard info card */}
        <div className="rounded-[24px] border border-[#12679E] bg-[linear-gradient(145deg,#123B4A_0%,#061D23_100%)] p-6 shadow-[0_14px_50px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Search */}
            <div className="flex-1">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">
                Search Players
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4AEEFF]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, email or club..."
                  className="w-full rounded-xl border border-[#12679E] bg-[#061D23] py-3 pl-10 pr-4 text-[15px] text-white placeholder:text-[#D8FBFF]/40 focus:border-[#4AEEFF] focus:outline-none"
                />
              </div>
            </div>

            {/* Skill filter */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#4AEEFF]">
                <FunnelIcon className="mr-1 inline h-3 w-3" />
                Skill Level
              </label>
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="rounded-xl border border-[#12679E] bg-[#061D23] px-4 py-3 text-[15px] text-white focus:border-[#4AEEFF] focus:outline-none"
              >
                <option value="ALL">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {(search || skillFilter !== "ALL") && (
            <p className="mt-3 text-xs text-[#D8FBFF]">
              Showing {filtered.length} of {players.length} players
            </p>
          )}
        </div>

        {/* Players grid — each card matches Dashboard quick-nav cards */}
        {filtered.length === 0 ? (
          <div className="rounded-[24px] border border-[#12679E] bg-[linear-gradient(145deg,#123B4A_0%,#061D23_100%)] p-12 text-center shadow-[0_14px_50px_rgba(0,0,0,0.2)]">
            <UserGroupIcon className="mx-auto mb-4 h-12 w-12 text-[#12679E]" />
            <p className="text-lg text-[#D8FBFF]">No players found.</p>
            {search && (
              <button
                onClick={() => { setSearch(""); setSkillFilter("ALL"); }}
                className="mt-4 rounded-full bg-[#FFFFFF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#061D23] transition hover:bg-[#4AEEFF]"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((player) => (
              <Link
                key={player.id}
                to={`/app/profile/${player.id}`}
                className="group rounded-[20px] border border-[#12679E] bg-[linear-gradient(160deg,#12679E_0%,#061D23_100%)] p-6 transition hover:border-[#4AEEFF] hover:shadow-[0_12px_35px_rgba(74,238,255,0.12)]"
              >
                {/* Avatar + name */}
                <div className="mb-4 flex items-center gap-3">
                  {player.profileImage ? (
                    <img
                      src={player.profileImage}
                      alt={`${player.firstName} ${player.lastName}`}
                      className="h-12 w-12 rounded-full border-2 border-[#4AEEFF] object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#4AEEFF] bg-[#12679E]">
                      <span className="text-base font-black text-white">
                        {player.firstName[0]}{player.lastName[0]}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white transition group-hover:text-[#CFF9FF]">
                      {player.firstName} {player.lastName}
                    </h3>
                    <p className="truncate text-xs text-[#D8FBFF]">{player.email}</p>
                  </div>
                </div>

                {/* Skill badge */}
                {player.playerProfile?.skillLevel && (
                  <div className="mb-3">
                    <span className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-[0.1em] ${skillColors[player.playerProfile.skillLevel] ?? skillColors.Beginner}`}>
                      {player.playerProfile.skillLevel}
                    </span>
                  </div>
                )}

                {/* Club */}
                {player.playerProfile?.clubAffiliation && (
                  <p className="truncate text-sm text-[#D8FBFF]">
                    🏓 {player.playerProfile.clubAffiliation}
                  </p>
                )}

                {/* Tournaments count */}
                {player._count && (
                  <div className="mt-4 border-t border-[#12679E] pt-3">
                    <p className="text-xs text-[#D8FBFF]">
                      {player._count.registrations} tournament{player._count.registrations !== 1 ? "s" : ""} joined
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Players;