import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  EyeIcon,
  PlusCircleIcon,
  UserIcon,
  EnvelopeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "REFEREE" | "PLAYER";
  phone: string | null;
  createdAt: string;
  isSuperAdmin: boolean;
  ranking?: number | null;
  rankingNote?: string | null;
}

const Users: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
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

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      toast.success("Role updated successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update role");
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
        },
      };

      await api.post("/auth/register", playerData);
      toast.success(
        `Player ${newPlayer.firstName} ${newPlayer.lastName} added successfully!`,
      );

      // Theme matching custom dark hot-toast injection layout
      toast.custom(
        (t) => (
          <div className="bg-[#061D23] border border-[#4AEEFF] rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 max-w-sm mx-auto backdrop-blur-xl text-white">
            <p className="font-black uppercase tracking-wider text-[#4AEEFF]">
              ✅ Player Created!
            </p>
            <p className="text-xs text-white/80 mt-2 break-all">
              Email: {newPlayer.email}
            </p>
            <p className="text-xs text-white/80 mt-1">
              Password:{" "}
              <span className="font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded text-[#4AEEFF]">
                {generatedPassword}
              </span>
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedPassword);
                toast.success("Password copied!");
                toast.dismiss(t.id);
              }}
              className="mt-3 block w-full text-center bg-[#12679E]/40 border border-[#4AEEFF]/30 text-xs font-black uppercase tracking-widest text-[#4AEEFF] py-1.5 rounded-lg hover:bg-[#4AEEFF] hover:text-[#061D23] transition-all"
            >
              Copy Password
            </button>
          </div>
        ),
        { duration: 15000 },
      );

      setShowAddPlayerModal(false);
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
      {/* ─── BG.PNG FIXED FULL-BLEED BACKGROUND ─── */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      {/* Light overlay for text legibility over the paper-texture artwork */}
      <div className="fixed inset-0 bg-[#061D23]/25" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-6 p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );

  if (user?.role !== "ADMIN") {
    return wrapInBaseLayout(
      <div className="rounded-[16px] border border-red-500/30 bg-[#061D23]/40 p-12 text-center backdrop-blur-xl shadow-2xl">
        <p className="font-black uppercase tracking-widest text-red-400">
          Access denied. Admin only.
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

      {/* CORE INDUSTRIAL DATA TABLE LAYER */}
      <main className="rounded-[16px] border border-white/20 bg-[#061D23]/10 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#061D23]/30 text-xs font-black uppercase tracking-widest text-[#4AEEFF]">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role Matrix</th>
                <th className="px-6 py-4">Leaderboard Rank</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-base">
              {users.map((userItem) => (
                <tr
                  key={userItem.id}
                  className="group hover:bg-[#12679E]/10 transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#061D23]/60 font-bold text-white tracking-tighter">
                        {userItem.firstName[0].toUpperCase()}
                        {userItem.lastName[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-[#4AEEFF] transition-colors text-base">
                          {userItem.firstName} {userItem.lastName}
                        </p>
                        {userItem.phone && (
                          <p className="text-sm text-white/50 font-mono mt-0.5">
                            {userItem.phone}
                          </p>
                        )}
                      </div>
                    </div>
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
                  <td className="px-6 py-4">
                    {userItem.role === "PLAYER" && (
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
                    )}
                  </td>
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
                      <Link
                        to={`/profile/${userItem.id}`}
                        className="rounded-lg p-2 text-white/70 border border-white/10 bg-[#061D23]/40 hover:border-[#4AEEFF] hover:text-[#4AEEFF] transition-all"
                        title="View Profile"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Link>

                      {/* Inline Ranking Control Config */}
                      {userItem.role === "PLAYER" &&
                        (editingRankId === userItem.id ? (
                          <div className="flex items-center gap-1.5 bg-[#061D23]/90 border border-[#4AEEFF]/40 rounded-lg p-1 animate-fadeIn">
                            <input
                              type="number"
                              min="1"
                              max="999"
                              placeholder="Rank"
                              value={rankingInput}
                              onChange={(e) => setRankingInput(e.target.value)}
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
                              userItem.ranking ? "Edit Ranking" : "Set Ranking"
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
                              {currentIsSuperAdmin && (
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

                      {/* Row Delete Option */}
                      {userItem.id !== user?.id && !userItem.isSuperAdmin && (
                        <button
                          onClick={() => handleDeleteUser(userItem.id)}
                          className="rounded-lg p-2 text-red-400 border border-red-500/10 bg-[#061D23]/40 hover:border-red-500 hover:bg-red-500/10 transition-all"
                          title="Delete User"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* COMPACT PLAYER REGISTRATION DIALOG MODAL */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-[16px] border border-white/20 bg-[#061D23]/55 p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black uppercase tracking-widest text-white mb-1">
              Register Profile
            </h2>
            <p className="text-xs text-[#4AEEFF] uppercase tracking-wider mb-6">
              Create an operational table tennis player record
            </p>

            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/70 mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newPlayer.firstName}
                    onChange={(e) =>
                      setNewPlayer({ ...newPlayer, firstName: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/70 mb-1.5">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newPlayer.lastName}
                    onChange={(e) =>
                      setNewPlayer({ ...newPlayer, lastName: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/70 mb-1.5">
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
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/70 mb-1.5">
                  Automated Security Access Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedPassword}
                    readOnly
                    className="flex-1 rounded-lg border border-white/10 bg-[#061D23] px-3 py-2 text-xs font-mono text-[#4AEEFF] tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="rounded-lg border border-white/20 bg-transparent px-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-all"
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
                <p className="text-[10px] font-bold text-amber-400 mt-1.5 uppercase tracking-wide">
                  ⚠️ Save credential. Hidden past submission phase.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/70 mb-1.5">
                    Phone Link
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
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/70 mb-1.5">
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
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/70 mb-1.5">
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
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/70 mb-1.5">
                    Skill Classification
                  </label>
                  <select
                    value={newPlayer.skillLevel}
                    onChange={(e) =>
                      setNewPlayer({ ...newPlayer, skillLevel: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#061D23] p-2.5 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-white/70 mb-1.5">
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
                  className="flex-1 rounded-lg bg-[#4AEEFF] py-3 text-xs font-black uppercase tracking-widest text-[#061D23] transition-all hover:bg-white disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Add Player"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="flex-1 rounded-lg border border-white/20 bg-transparent py-3 text-xs font-black uppercase tracking-widest text-[#4AEEFF] transition-all hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
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

export default Users;
