import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  TrophyIcon,
  ChartBarIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: string;
  gamesStats: {
    won: number;
    lost: number;
    total: number;
  };
  pointsStats: {
    scored: number;
    conceded: number;
    averagePerGame: string;
  };
  recentMatches: Array<{
    id: string;
    tournamentName: string;
    categoryName: string;
    opponent: string;
    result: string;
    score: string;
    date: string;
  }>;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  profileImage?: string;
  playerProfile?: {
    skillLevel: string;
    clubAffiliation: string;
    dateOfBirth: string | null;
  };
  refereeProfile?: {
    certification: string;
    experienceYears: number;
  };
  adminProfile?: {
    department: string;
  };
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    playerProfile: {
      skillLevel: "Intermediate",
      clubAffiliation: "",
    },
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [_statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user?.role === "PLAYER") {
      fetchPlayerStats();
    }
  }, [user]);

  const fetchPlayerStats = async () => {
    if (user?.role !== "PLAYER") return;

    setStatsLoading(true);
    try {
      const response = await api.get("/matches/my-performance");
      setPlayerStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch player stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get("/users/profile");
      setProfile(response.data.data);
      setFormData({
        firstName: response.data.data.firstName,
        lastName: response.data.data.lastName,
        phone: response.data.data.phone || "",
        playerProfile: {
          skillLevel:
            response.data.data.playerProfile?.skillLevel || "Intermediate",
          clubAffiliation:
            response.data.data.playerProfile?.clubAffiliation || "",
        },
      });
    } catch (error) {
      toast.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };

      if (user?.role === "PLAYER") {
        updateData.playerProfile = formData.playerProfile;
      }

      await api.patch("/users/profile", updateData);
      toast.success("Profile updated successfully!");
      setEditing(false);
      fetchProfile();
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "skillLevel" || name === "clubAffiliation") {
      setFormData({
        ...formData,
        playerProfile: {
          ...formData.playerProfile,
          [name]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-12">Profile not found</div>;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUploadProfileImage = async () => {
    if (!profileImage) {
      toast.error("Please select an image first");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profileImage", profileImage);

      await api.post("/users/upload-profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Profile picture updated successfully!");
      fetchProfile(); // Refresh profile data
      setProfileImage(null);
      setImagePreview(null);
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setUploading(false);
    }
  };

  // Calculate age and category based on client requirements
  const getPlayerAgeCategory = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    let category = "";
    if (age < 9) category = "Under 9";
    else if (age < 11) category = "Under 11";
    else if (age < 13) category = "Under 13";
    else if (age < 15) category = "Under 15";
    else if (age < 17) category = "Under 17";
    else if (age < 19) category = "Under 19";
    else if (age < 40) category = "Open";
    else if (age < 50) category = "Seniors (40+)";
    else if (age < 60) category = "Masters (50+)";
    else category = "Veterans (60+)";

    return { age, category };
  };

  // In Profile display section
  {
    profile.role === "PLAYER" && profile.playerProfile && (
      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-900 mb-3">Player Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Date of Birth</p>
            <p className="font-medium">
              {profile.playerProfile.dateOfBirth
                ? new Date(
                    profile.playerProfile.dateOfBirth,
                  ).toLocaleDateString()
                : "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Age</p>
            <p className="font-medium">
              {profile.playerProfile.dateOfBirth
                ? getPlayerAgeCategory(
                    new Date(profile.playerProfile.dateOfBirth),
                  ).age
                : "N/A"}{" "}
              years
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Age Category</p>
            <p className="font-medium">
              {profile.playerProfile.dateOfBirth
                ? getPlayerAgeCategory(
                    new Date(profile.playerProfile.dateOfBirth),
                  ).category
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Skill Level</p>
            <p className="font-medium">{profile.playerProfile.skillLevel}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-primary">
            Edit Profile
          </button>
        )}
      </div>

      {!editing ? (
        // View Mode
        <div className="card space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b">
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-primary-500"
              />
            ) : (
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-primary-600">
                  {profile.firstName[0]}
                  {profile.lastName[0]}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-500">{profile.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{profile.phone || "Not provided"}</p>
            </div>
          </div>

          {profile.role === "PLAYER" && profile.playerProfile && (
            <>
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Player Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Skill Level</p>
                    <p className="font-medium">
                      {profile.playerProfile.skillLevel}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Club Affiliation</p>
                    <p className="font-medium">
                      {profile.playerProfile.clubAffiliation || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {user?.role === "PLAYER" && playerStats && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-primary-600" />
                Performance Analysis
              </h3>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {playerStats.totalMatches}
                  </p>
                  <p className="text-sm text-gray-600">Total Matches</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {playerStats.wins}
                  </p>
                  <p className="text-sm text-gray-600">Wins</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {playerStats.losses}
                  </p>
                  <p className="text-sm text-gray-600">Losses</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {playerStats.winRate}
                  </p>
                  <p className="text-sm text-gray-600">Win Rate</p>
                </div>
              </div>

              {/* Games Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Games Breakdown
                  </h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Games Won</p>
                      <p className="text-xl font-bold text-green-600">
                        {playerStats.gamesStats.won}
                      </p>
                    </div>
                    <div className="text-gray-400">vs</div>
                    <div>
                      <p className="text-sm text-gray-500">Games Lost</p>
                      <p className="text-xl font-bold text-red-600">
                        {playerStats.gamesStats.lost}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-xl font-bold text-gray-700">
                        {playerStats.gamesStats.total}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${playerStats.gamesStats.total > 0 ? (playerStats.gamesStats.won / playerStats.gamesStats.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Points Statistics
                  </h4>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Points Scored</p>
                      <p className="text-xl font-bold text-green-600">
                        {playerStats.pointsStats.scored}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Points Conceded</p>
                      <p className="text-xl font-bold text-red-600">
                        {playerStats.pointsStats.conceded}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Avg/Game</p>
                      <p className="text-xl font-bold text-blue-600">
                        {playerStats.pointsStats.averagePerGame}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Matches */}
              {playerStats.recentMatches.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Recent Matches
                  </h4>
                  <div className="space-y-2">
                    {playerStats.recentMatches.map((match) => (
                      <div
                        key={match.id}
                        className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {match.tournamentName}
                          </p>
                          <p className="text-sm text-gray-500">
                            vs {match.opponent}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(match.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              match.result === "Win"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {match.result}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">
                            {match.score}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {playerStats.totalMatches === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <TrophyIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No match history yet.</p>
                  <p className="text-sm text-gray-400">
                    Play some matches to see your statistics!
                  </p>
                </div>
              )}
            </div>
          )}

          {profile.role === "REFEREE" && profile.refereeProfile && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Referee Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Certification</p>
                  <p className="font-medium">
                    {profile.refereeProfile.certification || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Experience Years</p>
                  <p className="font-medium">
                    {profile.refereeProfile.experienceYears || 0} years
                  </p>
                </div>
              </div>
            </div>
          )}

          {profile.role === "ADMIN" && profile.adminProfile && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Admin Details
              </h3>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">
                  {profile.adminProfile.department || "General"}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Edit Mode
        <form onSubmit={handleUpdate} className="card space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="Optional"
            />
          </div>

          {/* Profile Picture Upload Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Profile Picture
            </h3>

            {/* Current Profile Picture */}
            {profile.profileImage && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Current Picture</p>
                <img
                  src={`http://localhost:3000${profile.profileImage}`}
                  alt="Current profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary-500"
                />
              </div>
            )}

            {/* Upload New Picture */}
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}

              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                {imagePreview ? "Change Photo" : "Choose New Photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {imagePreview && (
                <button
                  type="button"
                  onClick={handleUploadProfileImage}
                  disabled={uploading}
                  className="btn-primary disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload Picture"}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG or GIF. Max 5MB.
            </p>
          </div>

          {user?.role === "PLAYER" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Level
                </label>
                <select
                  name="skillLevel"
                  value={formData.playerProfile.skillLevel}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Club Affiliation
                </label>
                <input
                  type="text"
                  name="clubAffiliation"
                  value={formData.playerProfile.clubAffiliation}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., City Table Tennis Club"
                />
              </div>
            </>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
