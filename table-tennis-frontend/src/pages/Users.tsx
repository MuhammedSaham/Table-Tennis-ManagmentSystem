import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { EyeIcon, PlusCircleIcon } from "@heroicons/react/24/outline";

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
      await api.patch(`/users/${id}/role`, {
        role,
      });

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
      toast.custom(
        (t) => (
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm mx-auto border-l-4 border-green-500">
            <p className="font-semibold text-gray-900">✅ Player Created!</p>
            <p className="text-sm text-gray-600 mt-1">
              Email: {newPlayer.email}
            </p>
            <p className="text-sm text-gray-600">
              Password:{" "}
              <span className="font-mono font-bold bg-gray-100 px-1 rounded">
                {generatedPassword}
              </span>
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedPassword);
                toast.success("Password copied!");
                toast.dismiss(t.id);
              }}
              className="mt-2 text-primary-600 text-sm hover:underline"
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "REFEREE":
        return "bg-blue-100 text-blue-800";
      case "PLAYER":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="card text-center py-12">
        <p className="text-red-600">Access denied. Admin only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={openAddPlayerModal}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PlusCircleIcon className="w-5 h-5" />
          Add Player
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Ranking
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Joined
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {userItem.firstName} {userItem.lastName}
                      </p>
                      {userItem.phone && (
                        <p className="text-xs text-gray-500">
                          {userItem.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {userItem.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(userItem.role)}`}
                    >
                      {userItem.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {userItem.role === "PLAYER" && (
                      <div>
                        {userItem.ranking ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary-600 text-lg">
                              #{userItem.ranking}
                            </span>
                            {userItem.rankingNote && (
                              <span className="text-xs text-gray-500">
                                ({userItem.rankingNote})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Not ranked
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(userItem.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/profile/${userItem.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Profile"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>

                      {/* Ranking button - only for players */}
                      {userItem.role === "PLAYER" &&
                        (editingRankId === userItem.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max="999"
                              placeholder="Rank"
                              value={rankingInput}
                              onChange={(e) => setRankingInput(e.target.value)}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              autoFocus
                            />
                            <input
                              type="text"
                              placeholder="Note"
                              value={rankingNote}
                              onChange={(e) => setRankingNote(e.target.value)}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                            <button
                              onClick={() => handleUpdateRanking(userItem.id)}
                              className="p-1 text-green-600 hover:text-green-800 font-semibold"
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
                              className="p-1 text-gray-400 hover:text-gray-600"
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
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title={
                              userItem.ranking ? "Edit Ranking" : "Set Ranking"
                            }
                          >
                            🏆
                          </button>
                        ))}

                      {/* Role change - only for non-super-admin and not current user */}
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
                              className="text-xs border rounded-md px-2 py-1"
                            >
                              <option value="PLAYER">Player</option>
                              <option value="REFEREE">Referee</option>
                              {currentIsSuperAdmin && (
                                <option value="ADMIN">Admin</option>
                              )}
                            </select>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                              ADMIN
                            </span>
                          );
                        })()}

                      {/* Super admin badge */}
                      {userItem.isSuperAdmin && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          ⭐ Main Admin
                        </span>
                      )}

                      {/* Current user badge */}
                      {userItem.id === user?.id && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          You
                        </span>
                      )}

                      {/* Delete button - never show for own row or super admin */}
                      {userItem.id !== user?.id && !userItem.isSuperAdmin && (
                        <button
                          onClick={() => handleDeleteUser(userItem.id)}
                          className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Player Modal */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add New Player
            </h2>

            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newPlayer.firstName}
                    onChange={(e) =>
                      setNewPlayer({ ...newPlayer, firstName: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newPlayer.lastName}
                    onChange={(e) =>
                      setNewPlayer({ ...newPlayer, lastName: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newPlayer.email}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, email: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Generated Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedPassword}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono"
                  />
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="bg-gray-200 hover:bg-gray-300 px-3 rounded-md text-sm"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGeneratedPassword(generateRandomPassword())
                    }
                    className="bg-primary-600 hover:bg-primary-700 text-white px-3 rounded-md text-sm"
                    title="Generate new password"
                  >
                    🔄
                  </button>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Save this password - it won't be shown again!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newPlayer.phone}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="071-1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={newPlayer.dateOfBirth}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, dateOfBirth: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill Level
                </label>
                <select
                  value={newPlayer.skillLevel}
                  onChange={(e) =>
                    setNewPlayer({ ...newPlayer, skillLevel: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Club/Academy
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., City Table Tennis Club"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-md disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Player"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
