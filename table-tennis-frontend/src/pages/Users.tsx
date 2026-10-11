import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  PlusCircleIcon,
  UserIcon,
  EnvelopeIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "REFEREE" | "PLAYER";
  phone: string | null;
  createdAt: string;
  isSuperAdmin: boolean;
  ranking?: number | null;
  rankingNote?: string | null;
  isClubMember?: boolean;
}

const Users: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [createdPlayerData, setCreatedPlayerData] = useState<{
    email: string;
    name: string;
    password: string;
  } | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    gender: "",
    skillLevel: "Intermediate",
    clubAffiliation: "",
    dateOfBirth: "",
  });
  const [editingRankId, setEditingRankId] = useState<string | null>(null);
  const [rankingInput, setRankingInput] = useState<string>("");
  const [rankingNote, setRankingNote] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "CLUB" | "GUEST" | "REFEREE" | "ADMIN"
  >("CLUB");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);
  const [removingMembership, setRemovingMembership] = useState(false);
  const [userForPermissions, setUserForPermissions] = useState<User | null>(null);

  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.isSuperAdmin;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Split players and roles for tabs
  const clubMembers = users.filter(
    (u) => u.role === "PLAYER" && u.isClubMember === true,
  );
  const guestPlayers = users.filter(
    (u) => u.role === "PLAYER" && !u.isClubMember,
  );
  const referees = users.filter((u) => u.role === "REFEREE");
  const admins = users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN");

  useEffect(() => {
    if (activeTab === "REFEREE" && referees.length === 0) {
      setActiveTab("CLUB");
    } else if (activeTab === "ADMIN" && admins.length === 0) {
      setActiveTab("CLUB");
    }
  }, [users, activeTab, referees.length, admins.length]);

  let tabUsers: User[] = [];
  if (activeTab === "CLUB") tabUsers = clubMembers;
  else if (activeTab === "GUEST") tabUsers = guestPlayers;
  else if (activeTab === "REFEREE") tabUsers = referees;
  else if (activeTab === "ADMIN") tabUsers = admins;

  // Filter displayed users by searchQuery (matches first name, last name, full name, or email)
  const displayedUsers = tabUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);

    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success(
        `User "${userToDelete.firstName} ${userToDelete.lastName}" deleted successfully`,
      );
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const confirmRemoveMembership = async () => {
    if (!memberToRemove) return;

    setRemovingMembership(true);

    try {
      await api.patch(`/club-membership/players/${memberToRemove.id}/remove`);

      toast.success(
        `${memberToRemove.firstName} ${memberToRemove.lastName} is now a guest player`,
      );

      setMemberToRemove(null);

      // Refresh users so player moves CLUB -> GUEST
      await fetchUsers();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to remove club membership",
      );
    } finally {
      setRemovingMembership(false);
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      toast.success("Role updated successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleUpdateRanking = async (userId: string) => {
    if (!rankingInput) {
      toast.error("Please enter a ranking number");
      return;
    }

    try {
      await api.patch(`/users/${userId}/ranking`, {
        ranking: parseInt(rankingInput),
        rankingNote: rankingNote || null,
      });
      toast.success("Ranking updated successfully!");
      setEditingRankId(null);
      setRankingInput("");
      setRankingNote("");
      fetchUsers();
    } catch (error: any) {
      console.error("Ranking update error:", error);
      toast.error(error.response?.data?.message || "Failed to update ranking");
    }
  };

  const generateRandomPassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const all = uppercase + lowercase + numbers;

    let password = "";
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));

    for (let i = 0; i < 8; i++) {
      password += all.charAt(Math.floor(Math.random() * all.length));
    }

    return password;
  };

  const openAddPlayerModal = () => {
    setCreatedPlayerData(null);
    setGeneratedPassword(generateRandomPassword());
    setNewPlayer({
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      gender: "",
      skillLevel: "Intermediate",
      clubAffiliation: "",
      dateOfBirth: "",
    });
    setShowAddPlayerModal(true);
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const playerData = {
        email: newPlayer.email,
        password: generatedPassword,
        firstName: newPlayer.firstName,
        lastName: newPlayer.lastName,
        phone: newPlayer.phone,
        role: "PLAYER",
        playerProfile: {
          gender: newPlayer.gender,
          skillLevel: newPlayer.skillLevel,
          clubAffiliation: newPlayer.clubAffiliation,
          dateOfBirth: newPlayer.dateOfBirth
            ? new Date(newPlayer.dateOfBirth)
            : undefined,
          isClubMember: true,
        },
      };

      await api.post("/auth/register", playerData);
      toast.success(
        `Player ${newPlayer.firstName} ${newPlayer.lastName} added successfully!`,
      );

      setCreatedPlayerData({
        email: newPlayer.email,
        name: `${newPlayer.firstName} ${newPlayer.lastName}`,
        password: generatedPassword,
      });

      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add player");
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success("Password copied to clipboard!");
  };

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-amber-500/20 text-amber-300 border border-amber-500/40";
      case "ADMIN":
        return "bg-purple-500/20 text-purple-300 border border-purple-500/40";
      case "REFEREE":
        return "bg-blue-500/20 text-blue-300 border border-blue-500/40";
      case "PLAYER":
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
      default:
        return "bg-white/10 text-white/70 border border-white/20";
    }
  };

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

  if (!isSuperAdmin && !hasPermission("MANAGE_USERS")) {
    return wrapInBaseLayout(
      <div className="rounded-[16px] border border-red-500/30 bg-[#061D23]/40 p-12 text-center backdrop-blur-xl shadow-2xl">
        <p className="font-black uppercase tracking-widest text-red-400">
          Access denied. User Management permission required.
        </p>
      </div>,
    );
  }

  if (loading) {
    return wrapInBaseLayout(
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#4AEEFF]"></div>
        <div className="text-sm font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
          Loading user records...
        </div>
      </div>,
    );
  }

  return wrapInBaseLayout(
    <>
      {/* PREMIUM HEADER CONTROLS MODULE */}
      <header className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-3 h-[3px] w-16 bg-[#4AEEFF]" />
          <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white sm:text-4xl">
            User Records
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-[#4AEEFF]/90 mt-1">
            Manage system permissions, profiles, and tournament rankings
          </p>
        </div>
        <button
          onClick={openAddPlayerModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#4AEEFF] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#061D23] transition-all duration-200 hover:bg-white self-start sm:self-center"
        >
          <PlusCircleIcon className="w-4 h-4 stroke-[2.5]" />
          Add Player
        </button>
      </header>

      {/* SEARCH AND TABS CONTROL BAR */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* TABS */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="tab-club-members-admin"
            onClick={() => setActiveTab("CLUB")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all duration-200 focus:outline-none ${
              activeTab === "CLUB"
                ? "bg-[#4AEEFF] text-[#061D23] shadow-lg"
                : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
            }`}
          >
            🏅 Club Members
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "CLUB"
                  ? "bg-[#061D23]/30 text-[#061D23]"
                  : "bg-[#4AEEFF]/20 text-[#4AEEFF]"
              }`}
            >
              {clubMembers.length}
            </span>
          </button>

          <button
            id="tab-guest-players-admin"
            onClick={() => setActiveTab("GUEST")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all duration-200 focus:outline-none ${
              activeTab === "GUEST"
                ? "bg-[#4AEEFF] text-[#061D23] shadow-lg"
                : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
            }`}
          >
            👤 Guest Players
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "GUEST"
                  ? "bg-[#061D23]/30 text-[#061D23]"
                  : "bg-[#4AEEFF]/20 text-[#4AEEFF]"
              }`}
            >
              {guestPlayers.length}
            </span>
          </button>

          {/* Referees Button - Only displays when there are Referees */}
          {referees.length > 0 && (
            <button
              id="tab-referees-admin"
              onClick={() => setActiveTab("REFEREE")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all duration-200 focus:outline-none ${
                activeTab === "REFEREE"
                  ? "bg-[#4AEEFF] text-[#061D23] shadow-lg"
                  : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
              }`}
            >
              🛡️ Referees
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === "REFEREE"
                    ? "bg-[#061D23]/30 text-[#061D23]"
                    : "bg-[#4AEEFF]/20 text-[#4AEEFF]"
                }`}
              >
                {referees.length}
              </span>
            </button>
          )}

          {/* Admins Button - Only displays when there are Admins */}
          {admins.length > 0 && (
            <button
              id="tab-admins-admin"
              onClick={() => setActiveTab("ADMIN")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all duration-200 focus:outline-none ${
                activeTab === "ADMIN"
                  ? "bg-[#4AEEFF] text-[#061D23] shadow-lg"
                  : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
              }`}
            >
              👑 Admins
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === "ADMIN"
                    ? "bg-[#061D23]/30 text-[#061D23]"
                    : "bg-[#4AEEFF]/20 text-[#4AEEFF]"
                }`}
              >
                {admins.length}
              </span>
            </button>
          )}
        </div>

        {/* PLAYER SEARCH MODULE */}
        <div className="flex items-center gap-2 w-full lg:w-96">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4AEEFF]/80" />
            <input
              type="text"
              placeholder="Search player by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-white/20 bg-[#061D23]/60 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#4AEEFF] transition-all shadow-inner font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-white/50 hover:text-white transition-colors"
                title="Clear search"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => {}}
            className="px-4 py-2.5 rounded-xl bg-[#4AEEFF] text-[#061D23] hover:bg-white text-xs font-black uppercase tracking-wider transition-all shadow-md shrink-0"
          >
            Search
          </button>
        </div>
      </div>

      {/* CORE INDUSTRIAL DATA LAYER */}
      <main className="rounded-[16px] border border-white/20 bg-[#061D23]/10 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl overflow-hidden">
        {/* DESKTOP TABLE VIEW (Visible on tablet and desktop screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#061D23]/30 text-xs font-black uppercase tracking-widest text-[#4AEEFF]">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role Matrix</th>
                {activeTab === "CLUB" && (
                  <th className="px-6 py-4">Leaderboard Rank</th>
                )}
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-base">
              {displayedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === "CLUB" ? 6 : 5}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 rounded-full bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 text-[#4AEEFF]">
                        <MagnifyingGlassIcon className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-white/80">
                        {searchQuery.trim()
                          ? `No players found matching "${searchQuery}"`
                          : "No player records found"}
                      </p>
                      {searchQuery.trim() && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-[#4AEEFF] font-mono transition-all"
                        >
                          Reset Search Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayedUsers.map((userItem) => (
                  <tr
                    key={userItem.id}
                    className="group hover:bg-[#12679E]/10 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <Link
                        to={`/profile/${userItem.id}`}
                        className="flex items-center gap-3 group/player cursor-pointer"
                        title="Click to view player profile"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#061D23]/60 font-bold text-[#4AEEFF] group-hover/player:border-[#4AEEFF] transition-colors tracking-tighter">
                          {userItem.firstName[0].toUpperCase()}
                          {userItem.lastName[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover/player:text-[#4AEEFF] transition-colors text-base flex items-center gap-1">
                            <span>
                              {userItem.firstName} {userItem.lastName}
                            </span>
                            <span className="text-xs text-[#4AEEFF] opacity-0 group-hover/player:opacity-100 transition-opacity">
                              ↗
                            </span>
                          </p>
                          {userItem.phone && (
                            <p className="text-sm text-white/50 font-mono mt-0.5">
                              {userItem.phone}
                            </p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-white/80 font-mono text-sm break-all">
                      {userItem.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded-md ${getRoleBadgeStyles(userItem.role)}`}
                      >
                        {userItem.role}
                      </span>
                    </td>
                    {activeTab === "CLUB" && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {userItem.ranking ? (
                            <>
                              <span className="font-black text-[#4AEEFF] text-lg">
                                #{userItem.ranking}
                              </span>
                              {userItem.rankingNote && (
                                <span className="text-sm text-white/60 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                                  {userItem.rankingNote}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm italic text-white/40">
                              Unranked
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-white/70 font-mono">
                      {new Date(userItem.createdAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Inline Ranking Control Config - Strictly for Club Members */}
                        {userItem.role === "PLAYER" &&
                          userItem.isClubMember &&
                          (editingRankId === userItem.id ? (
                            <div className="flex items-center gap-1.5 bg-[#061D23]/90 border border-[#4AEEFF]/40 rounded-lg p-1 animate-fadeIn">
                              <input
                                type="number"
                                min="1"
                                max="999"
                                placeholder="Rank"
                                value={rankingInput}
                                onChange={(e) =>
                                  setRankingInput(e.target.value)
                                }
                                className="w-16 px-2 py-1 text-xs border border-white/10 rounded bg-[#061D23] text-white focus:outline-none focus:border-[#4AEEFF]"
                                autoFocus
                              />
                              <input
                                type="text"
                                placeholder="Note"
                                value={rankingNote}
                                onChange={(e) => setRankingNote(e.target.value)}
                                className="w-20 px-2 py-1 text-xs border border-white/10 rounded bg-[#061D23] text-white focus:outline-none focus:border-[#4AEEFF]"
                              />
                              <button
                                onClick={() => handleUpdateRanking(userItem.id)}
                                className="px-1 text-emerald-400 text-xs font-black hover:text-emerald-300"
                                title="Save"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRankId(null);
                                  setRankingInput("");
                                  setRankingNote("");
                                }}
                                className="px-1 text-white/40 text-xs font-black hover:text-white"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingRankId(userItem.id);
                                setRankingInput(
                                  userItem.ranking?.toString() || "",
                                );
                                setRankingNote(userItem.rankingNote || "");
                              }}
                              className="rounded-lg p-2 text-white/70 border border-white/10 bg-[#061D23]/40 hover:border-[#4AEEFF] hover:text-[#4AEEFF] transition-all text-xs"
                              title={
                                userItem.ranking
                                  ? "Edit Ranking"
                                  : "Set Ranking"
                              }
                            >
                              🏆
                            </button>
                          ))}

                        {/* Interactive Role Selector Dropdown */}
                        {userItem.id !== user?.id &&
                          !userItem.isSuperAdmin &&
                          (() => {
                            const currentIsSuperAdmin =
                              (user as any)?.isSuperAdmin ?? false;
                            const canChangeRole =
                              currentIsSuperAdmin || userItem.role !== "ADMIN";

                            // Guest players are users who are not club members
                            const isGuestPlayer = !userItem.isClubMember;

                            return canChangeRole ? (
                              <select
                                value={userItem.role}
                                onChange={(e) =>
                                  handleRoleChange(userItem.id, e.target.value)
                                }
                                className="text-xs border border-white/10 rounded-md bg-[#061D23] text-white py-1.5 px-2 focus:outline-none focus:border-[#4AEEFF] cursor-pointer"
                              >
                                <option value="PLAYER">Player</option>
                                <option value="REFEREE">Referee</option>
                                {!isGuestPlayer && currentIsSuperAdmin && (
                                  <option value="ADMIN">Admin</option>
                                )}
                              </select>
                            ) : null;
                          })()}

                        {/* Badges Stack */}
                        {userItem.isSuperAdmin && (
                          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⭐ Main Admin
                          </span>
                        )}

                        {userItem.id === user?.id && (
                          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md bg-white/10 text-white/60 border border-white/10">
                            You
                          </span>
                        )}

                        {/* Manage Permissions for Admin Users */}
                        {isSuperAdmin && userItem.role === "ADMIN" && (
                          <button
                            onClick={() => setUserForPermissions(userItem)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-black uppercase tracking-wider text-[#4AEEFF] border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 hover:bg-[#4AEEFF]/20 transition-all flex items-center gap-1"
                            title="Manage Permissions"
                          >
                            🔑 Permissions
                          </button>
                        )}

                        {/* Remove Club Membership */}
                        {activeTab === "CLUB" &&
                          userItem.role === "PLAYER" &&
                          userItem.isClubMember && (
                            <button
                              onClick={() => setMemberToRemove(userItem)}
                              className="rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wider text-amber-300 border border-amber-500/20 bg-[#061D23]/40 hover:border-amber-400 hover:bg-amber-500/10 transition-all"
                              title="Remove Club Membership"
                            >
                              Remove Membership
                            </button>
                          )}

                        {/* Row Delete Option */}
                        {userItem.id !== user?.id && !userItem.isSuperAdmin && (
                          <button
                            onClick={() => setUserToDelete(userItem)}
                            className="rounded-lg p-2 text-red-400 border border-red-500/10 bg-[#061D23]/40 hover:border-red-500 hover:bg-red-500/10 transition-all"
                            title="Delete User"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS VIEW (Visible exclusively on mobile screens) */}
        <div className="block md:hidden divide-y divide-white/10">
          {displayedUsers.map((userItem) => (
            <div
              key={userItem.id}
              className="p-4 bg-[#061D23]/30 hover:bg-[#12679E]/10 transition-colors space-y-3"
            >
              {/* Top: Avatar, Name & Role Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#4AEEFF]/30 bg-[#061D23] font-bold text-white shadow-sm text-sm">
                    {userItem.firstName[0].toUpperCase()}
                    {userItem.lastName[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-base leading-tight truncate">
                      {userItem.firstName} {userItem.lastName}
                    </p>
                    {userItem.phone && (
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        📞 {userItem.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${getRoleBadgeStyles(
                      userItem.role,
                    )}`}
                  >
                    {userItem.role}
                  </span>
                  {userItem.isSuperAdmin && (
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ⭐ Main
                    </span>
                  )}
                  {userItem.id === user?.id && (
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-white/10 text-white/60 border border-white/10">
                      You
                    </span>
                  )}
                </div>
              </div>

              {/* Info Details Box */}
              <div className="rounded-xl bg-[#061D23]/60 border border-white/5 p-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-300">
                  <EnvelopeIcon className="w-3.5 h-3.5 text-[#4AEEFF] shrink-0" />
                  <span className="font-mono text-gray-200 truncate select-all">
                    {userItem.email}
                  </span>
                </div>

                {userItem.role === "PLAYER" && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-gray-400 font-medium">Rank:</span>
                    {userItem.ranking ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-[#4AEEFF]">
                          #{userItem.ranking}
                        </span>
                        {userItem.rankingNote && (
                          <span className="text-[10px] text-white/60 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                            {userItem.rankingNote}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">Unranked</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-gray-400">
                  <span>Joined Date:</span>
                  <span className="font-mono text-gray-300">
                    {new Date(userItem.createdAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
              </div>

              {/* Inline Rank Edit Form on Mobile (if currently editing) */}
              {userItem.role === "PLAYER" && editingRankId === userItem.id && (
                <div className="flex items-center gap-2 bg-[#061D23] border border-[#4AEEFF]/40 rounded-xl p-2 animate-fadeIn">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    placeholder="Rank"
                    value={rankingInput}
                    onChange={(e) => setRankingInput(e.target.value)}
                    className="w-20 px-2 py-1.5 text-xs border border-white/10 rounded-lg bg-[#082229] text-white focus:outline-none focus:border-[#4AEEFF]"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Note"
                    value={rankingNote}
                    onChange={(e) => setRankingNote(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-white/10 rounded-lg bg-[#082229] text-white focus:outline-none focus:border-[#4AEEFF]"
                  />
                  <button
                    onClick={() => handleUpdateRanking(userItem.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingRankId(null);
                      setRankingInput("");
                      setRankingNote("");
                    }}
                    className="px-2 py-1.5 text-white/50 text-xs font-black"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Mobile Actions Toolbar */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <Link
                  to={`/profile/${userItem.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/80 border border-white/10 bg-[#061D23]/60 hover:border-[#4AEEFF] hover:text-[#4AEEFF]"
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </Link>

                <div className="flex items-center gap-2">
                  {/* Rank Edit Toggle for Players */}
                  {userItem.role === "PLAYER" &&
                    editingRankId !== userItem.id && (
                      <button
                        onClick={() => {
                          setEditingRankId(userItem.id);
                          setRankingInput(userItem.ranking?.toString() || "");
                          setRankingNote(userItem.rankingNote || "");
                        }}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-white/80 border border-white/10 bg-[#061D23]/60 hover:border-[#4AEEFF] hover:text-[#4AEEFF]"
                        title="Set / Edit Rank"
                      >
                        🏆 Rank
                      </button>
                    )}

                  {/* Role Change Dropdown */}
                  {userItem.id !== user?.id &&
                    !userItem.isSuperAdmin &&
                    (() => {
                      const currentIsSuperAdmin =
                        (user as any)?.isSuperAdmin ?? false;
                      const canChangeRole =
                        currentIsSuperAdmin || userItem.role !== "ADMIN";

                      return canChangeRole ? (
                        <select
                          value={userItem.role}
                          onChange={(e) =>
                            handleRoleChange(userItem.id, e.target.value)
                          }
                          className="text-xs border border-white/10 rounded-lg bg-[#061D23] text-white py-1.5 px-2 focus:outline-none focus:border-[#4AEEFF] cursor-pointer"
                        >
                          <option value="PLAYER">Player</option>
                          <option value="REFEREE">Referee</option>
                          {currentIsSuperAdmin && (
                            <option value="ADMIN">Admin</option>
                          )}
                        </select>
                      ) : null;
                    })()}

                  {/* Manage Permissions for Admin Users (Mobile) */}
                  {isSuperAdmin && userItem.role === "ADMIN" && (
                    <button
                      onClick={() => setUserForPermissions(userItem)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#4AEEFF] border border-[#4AEEFF]/30 bg-[#4AEEFF]/10 hover:bg-[#4AEEFF]/20"
                      title="Manage Permissions"
                    >
                      🔑 Permissions
                    </button>
                  )}

                  {/* Remove Club Membership */}
                  {activeTab === "CLUB" &&
                    userItem.role === "PLAYER" &&
                    userItem.isClubMember && (
                      <button
                        onClick={() => setMemberToRemove(userItem)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-300 border border-amber-500/20 bg-[#061D23]/60 hover:bg-amber-500/10"
                        title="Remove Club Membership"
                      >
                        Remove Membership
                      </button>
                    )}

                  {/* Delete Button */}
                  {userItem.id !== user?.id && !userItem.isSuperAdmin && (
                    <button
                      onClick={() => setUserToDelete(userItem)}
                      className="rounded-lg p-1.5 text-red-400 border border-red-500/20 bg-[#061D23]/60 hover:bg-red-500/20"
                      title="Delete User"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* PLAYER REGISTRATION DIALOG MODAL */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-24 backdrop-blur-sm animate-fadeIn sm:pt-28">
          <div className="w-full max-w-4xl rounded-2xl border border-white/20 bg-[#061D23]/90 p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-8">
            {createdPlayerData ? (
              <div className="text-center py-2 space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4AEEFF]/20 border border-[#4AEEFF]/40 text-3xl">
                  ✅
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-widest text-white">
                    Player Created Successfully!
                  </h2>
                  <p className="text-sm text-[#4AEEFF] uppercase tracking-wider mt-1">
                    Save or share the login credentials with the player
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#061D23]/80 p-5 text-left space-y-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-white/50 block mb-1">
                      Player Name
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {createdPlayerData.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-white/50 block mb-1">
                      Login Email
                    </span>
                    <span className="text-sm font-mono text-[#4AEEFF] break-all">
                      {createdPlayerData.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-white/50 block mb-1">
                      Temporary Password
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-mono font-bold text-sm bg-white/10 px-3 py-2.5 rounded-lg text-[#4AEEFF] border border-[#4AEEFF]/30 tracking-wider">
                        {createdPlayerData.password}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            createdPlayerData.password,
                          );
                          toast.success("Password copied to clipboard!");
                        }}
                        className="px-4 py-2.5 rounded-lg bg-[#4AEEFF] text-sm font-black uppercase tracking-wider text-[#061D23] hover:bg-white transition-all shadow-md"
                      >
                        Copy Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const creds = `Table Tennis Portal Login\nEmail: ${createdPlayerData.email}\nPassword: ${createdPlayerData.password}`;
                      navigator.clipboard.writeText(creds);
                      toast.success("Full credentials copied!");
                    }}
                    className="flex-1 rounded-lg border border-white/20 bg-transparent py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                  >
                    📋 Copy Full Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPlayerModal(false);
                      setCreatedPlayerData(null);
                    }}
                    className="flex-1 rounded-lg bg-[#4AEEFF] py-3 text-sm font-black uppercase tracking-widest text-[#061D23] hover:bg-white transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-white mb-1">
                  Register Profile
                </h2>
                <p className="text-sm text-[#4AEEFF] uppercase tracking-wider mb-6">
                  Create an operational table tennis player record
                </p>

                <form onSubmit={handleAddPlayer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-1.5">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={newPlayer.firstName}
                        onChange={(e) =>
                          setNewPlayer({
                            ...newPlayer,
                            firstName: e.target.value,
                          })
                        }
                        required
                        className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-1.5">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={newPlayer.lastName}
                        onChange={(e) =>
                          setNewPlayer({
                            ...newPlayer,
                            lastName: e.target.value,
                          })
                        }
                        required
                        className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newPlayer.email}
                      onChange={(e) =>
                        setNewPlayer({ ...newPlayer, email: e.target.value })
                      }
                      required
                      className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-1.5">
                      Automated Security Access Token
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedPassword}
                        readOnly
                        className="flex-1 rounded-lg border border-white/10 bg-[#061D23] px-3 py-2 text-sm font-mono text-[#4AEEFF] tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={copyPassword}
                        className="rounded-lg border border-white/20 bg-transparent px-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-all"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setGeneratedPassword(generateRandomPassword())
                        }
                        className="rounded-lg bg-[#4AEEFF] px-3 text-[#061D23] hover:bg-white transition-all"
                        title="Regenerate string"
                      >
                        🔄
                      </button>
                    </div>
                    <p className="text-xs font-bold text-amber-400 mt-1.5 uppercase tracking-wide">
                      ⚠️ Save credential. Hidden past submission phase.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newPlayer.phone}
                        onChange={(e) =>
                          setNewPlayer({ ...newPlayer, phone: e.target.value })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 focus:border-[#4AEEFF] focus:outline-none"
                        placeholder="e.g., 071-1234567"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-1.5">
                        Gender *
                      </label>

                      <select
                        value={newPlayer.gender}
                        onChange={(e) =>
                          setNewPlayer({ ...newPlayer, gender: e.target.value })
                        }
                        required
                        className="w-full rounded-lg border border-white/10 bg-[#061D23] p-2.5 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-1.5">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={newPlayer.dateOfBirth}
                        onChange={(e) =>
                          setNewPlayer({
                            ...newPlayer,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white focus:border-[#4AEEFF] focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-1.5">
                        Skill Classification
                      </label>
                      <select
                        value={newPlayer.skillLevel}
                        onChange={(e) =>
                          setNewPlayer({
                            ...newPlayer,
                            skillLevel: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#061D23] p-2.5 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-white/70 mb-1.5">
                        Club / Academy Branch
                      </label>
                      <input
                        type="text"
                        value={newPlayer.clubAffiliation}
                        onChange={(e) =>
                          setNewPlayer({
                            ...newPlayer,
                            clubAffiliation: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 focus:border-[#4AEEFF] focus:outline-none"
                        placeholder="e.g., City Table Tennis Club"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-[#4AEEFF] py-3 text-sm font-black uppercase tracking-widest text-[#061D23] transition-all hover:bg-white disabled:opacity-50"
                    >
                      {submitting ? "Processing..." : "Add Player"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddPlayerModal(false)}
                      className="flex-1 rounded-lg border border-white/20 bg-transparent py-3 text-sm font-black uppercase tracking-widest text-[#4AEEFF] transition-all hover:bg-white/5"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#061D23]/95 p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(239,68,68,0.3)] backdrop-blur-2xl text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 border border-red-500/40 text-red-400">
              <TrashIcon className="h-8 w-8 stroke-[2]" />
            </div>

            <div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white">
                Delete Player
              </h3>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-bold text-[#4AEEFF]">
                  {userToDelete.firstName} {userToDelete.lastName}
                </span>
                ?
              </p>
              <p className="text-xs text-red-400 font-mono mt-1 font-semibold">
                ⚠️ This operation is permanent and cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-red-600 disabled:opacity-50 shadow-lg shadow-red-500/20"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE CLUB MEMBERSHIP CONFIRMATION */}
      {memberToRemove && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#061D23] p-6 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-xl font-black uppercase tracking-wider text-white">
                Remove Club Membership?
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Are you sure you want to remove{" "}
                <span className="font-bold text-white">
                  {memberToRemove.firstName} {memberToRemove.lastName}
                </span>{" "}
                from the club?
              </p>

              <p className="mt-3 text-xs leading-relaxed text-amber-300">
                The player will become a guest player. Their account, rankings,
                tournament records and match history will not be deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={removingMembership}
                className="flex-1 rounded-lg border border-white/20 px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmRemoveMembership}
                disabled={removingMembership}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#061D23] hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {removingMembership ? "Removing..." : "Remove Membership"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PERMISSIONS MODAL */}
      {userForPermissions && (
        <ManagePermissionsModal
          targetUser={userForPermissions}
          onClose={() => setUserForPermissions(null)}
          onUpdated={fetchUsers}
        />
      )}

      {/* SHADED BOTTOM FOOTER BRANDING MODULE */}
      <footer className="mt-auto rounded-[16px] border border-white/10 bg-[#061D23]/25 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <UserIcon className="h-4 w-4 text-[#4AEEFF]" />
            <span>Active Operator Identity:</span>
            <span className="rounded bg-[#4AEEFF]/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[#4AEEFF]">
              {user?.role || "GUEST"}
            </span>
          </div>
          {user?.email && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <EnvelopeIcon className="h-4 w-4 text-[#4AEEFF]/80" />
              <span className="font-mono text-xs">{user.email}</span>
            </div>
          )}
        </div>
      </footer>
    </>,
  );
};

const ALL_PERMISSIONS = [
  { id: "MANAGE_USERS", name: "Manage Users", desc: "View, update user accounts, roles & permissions" },
  { id: "MANAGE_PLAYERS", name: "Manage Players", desc: "Create, edit, rank, and manage player profiles" },
  { id: "MANAGE_REFEREES", name: "Manage Referees", desc: "Manage referee assignments and information" },
  { id: "MANAGE_TOURNAMENTS", name: "Manage Tournaments", desc: "Create, edit, and manage tournaments" },
  { id: "MANAGE_REGISTRATIONS", name: "Manage Registrations", desc: "Approve, reject, or modify tournament registrations" },
  { id: "MANAGE_MATCHES", name: "Manage Matches", desc: "Schedule matches, assign referees, and update scores" },
  { id: "MANAGE_RESULTS", name: "Manage Results", desc: "Record, verify, and publish tournament results" },
  { id: "MANAGE_RANKINGS", name: "Manage Rankings", desc: "Update official player rankings and points" },
  { id: "MANAGE_CLUB_MEMBERSHIPS", name: "Manage Club Memberships", desc: "Grant or revoke player club memberships" },
];

interface ManagePermissionsModalProps {
  targetUser: User;
  onClose: () => void;
  onUpdated: () => void;
}

const ManagePermissionsModal: React.FC<ManagePermissionsModalProps> = ({
  targetUser,
  onClose,
  onUpdated,
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, [targetUser.id]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/${targetUser.id}/permissions`);
      setSelectedPermissions(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId],
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/users/${targetUser.id}/permissions`, {
        permissions: selectedPermissions,
      });
      toast.success(`Permissions updated for ${targetUser.firstName} ${targetUser.lastName}`);
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl rounded-2xl border border-[#4AEEFF]/30 bg-[#061D23]/95 p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2">
              🔑 Admin Permissions
            </h3>
            <p className="text-xs text-[#4AEEFF] font-mono mt-1">
              Configure access scope for: <span className="font-bold text-white">{targetUser.firstName} {targetUser.lastName}</span> ({targetUser.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors p-1"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#4AEEFF] mx-auto"></div>
            <p className="text-xs font-mono text-[#4AEEFF] mt-3">Loading permissions...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-white/70 uppercase tracking-wider font-bold">
              Select module access permissions:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {ALL_PERMISSIONS.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.id);
                return (
                  <div
                    key={perm.id}
                    onClick={() => togglePermission(perm.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? "bg-[#4AEEFF]/10 border-[#4AEEFF] text-white"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-[#4AEEFF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-sm block leading-tight">
                        {perm.name}
                      </span>
                      <span className="text-xs text-white/50 block mt-0.5 font-mono">
                        {perm.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-white/20 bg-white/5 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 rounded-xl bg-[#4AEEFF] py-3 text-xs font-black uppercase tracking-wider text-[#061D23] transition-all hover:bg-white disabled:opacity-50 font-bold shadow-lg"
          >
            {saving ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Users;
