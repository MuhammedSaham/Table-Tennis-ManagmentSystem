import React, { useEffect, useState } from "react";
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
  const [filtered, setFiltered] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("ALL");

  // Original fetchPlayers function
  // const fetchPlayers = async () => {
  //   try {
  //     const res = await api.get("/users/public/players");
  //     setPlayers(res.data.data);
  //     setFiltered(res.data.data);
  //   } catch {
  //     setPlayers([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchPlayers = async () => {
    try {
      const res = await api.get("/users/public/players");
      setPlayers(res.data.data);
      setFiltered(res.data.data);
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    let result = players;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.playerProfile?.clubAffiliation?.toLowerCase().includes(q),
      );
    }
    if (skillFilter !== "ALL") {
      result = result.filter(
        (p) => p.playerProfile?.skillLevel?.toUpperCase() === skillFilter,
      );
    }
    setFiltered(result);
  }, [search, skillFilter, players]);

  const initials = (p: Player) =>
    `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#061D23] via-[#12679E] to-[#4AEEFF] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#4AEEFF] to-[#FFFFFF] rounded-full flex items-center justify-center">
              <span className="text-2xl">🏓</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">Players</h1>
          </div>
          <p className="text-[#4AEEFF] text-lg">Browse all registered players and view their profiles</p>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">🔍</span>
              <input
                type="text"
                placeholder="Search by name or club..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#4AEEFF]"
              />
            </div>

            {/* Skill filter pills */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-end">
              {["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSkillFilter(s)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#4AEEFF] ${
                    skillFilter === s
                      ? "bg-gradient-to-r from-[#4AEEFF] to-[#12679E] text-[#061D23] shadow-sm"
                      : "bg-gradient-to-r from-[#4AEEFF]/40 to-[#12679E]/30 text-white border border-white/20 hover:bg-gradient-to-r hover:from-[#061D23] hover:to-[#0b2b33] hover:text-white"
                  }`}
                >
                  {s === "ALL" ? "All Levels" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="text-white/80 text-sm mt-4">{filtered.length} player{filtered.length !== 1 ? "s" : ""} found</div>
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
                <Link key={player.id} to={`/profile/${player.id}`} className="group">
                  <div className="relative h-full bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-sm rounded-2xl p-8 border border-white/30 hover:border-[#4AEEFF]/60 transition-all duration-300 hover:shadow-2xl hover:scale-105 overflow-hidden">
                    {/* Accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4AEEFF] via-[#12679E] to-transparent"></div>

                    {/* Background decoration */}
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#4AEEFF]/10 rounded-full blur-2xl"></div>

                    {/* Avatar */}
                    <div className="relative mb-6 flex justify-center">
                      {player.profileImage ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#4AEEFF] to-[#12679E] rounded-full p-1">
                            <img
                              src={player.profileImage}
                              alt={player.firstName}
                              className="w-20 h-20 rounded-full object-cover bg-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#061D23] to-[#12679E] flex items-center justify-center border-2 border-[#4AEEFF]">
                          <span className="text-2xl font-bold text-white">{initials(player)}</span>
                        </div>
                      )}
                    </div>

                    {/* Player Info */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-[#061D23] mb-1">
                        {player.firstName} {player.lastName}
                      </h3>
                      {player.ranking !== undefined && (
                        <div className="inline-block bg-gradient-to-r from-[#4AEEFF] to-[#12679E] text-[#061D23] px-3 py-1 rounded-full text-xs font-bold mb-2">
                          Rank #{player.ranking}
                        </div>
                      )}
                      {age !== null && (
                        <p className="text-gray-600 text-sm">{age} years old</p>
                      )}
                    </div>

                    {/* Club */}
                    {player.playerProfile?.clubAffiliation && (
                      <div className="text-center mb-4 pb-4 border-b border-gray-200">
                        <p className="text-gray-700 font-medium text-sm">
                          <span className="mr-2">🏛️</span>
                          {player.playerProfile.clubAffiliation}
                        </p>
                      </div>
                    )}

                    {/* Skill Badge */}
                    <div className="flex justify-between items-center">
                      {skill ? (
                        <span
                          style={{ background: skillStyle.bg, color: skillStyle.text }}
                          className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider"
                        >
                          {player.playerProfile?.skillLevel}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">No level set</span>
                      )}
                      <span className="text-[#4AEEFF] font-bold group-hover:translate-x-1 transition-transform">→</span>
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
