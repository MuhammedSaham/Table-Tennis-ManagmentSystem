import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

interface Category {
  name: string;
  type: "SINGLES" | "DOUBLES" | "TEAM";
  minAge?: number;
  maxAge?: number;
  gender?: "MALE" | "FEMALE" | "MIXED";
  maxParticipants: number;
}

const CreateTournament: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([
    {
      name: "",
      type: "SINGLES",
      minAge: undefined,
      maxAge: undefined,
      gender: undefined,
      maxParticipants: 32,
    },
  ]);
  const [tournamentType, setTournamentType] = useState("KNOCKOUT");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    venue: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    maxPlayers: "",
  });

  // Redirect if not admin
  if (user?.role !== "ADMIN") {
    navigate("/dashboard");
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Category handlers
  const handleCategoryChange = (
    index: number,
    field: keyof Category,
    value: string | number | undefined,
  ) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value,
    };
    setCategories(updatedCategories);
  };

  const addCategory = () => {
    setCategories([
      ...categories,
      {
        name: "",
        type: "SINGLES",
        minAge: undefined,
        maxAge: undefined,
        gender: undefined,
        maxParticipants: 32,
      },
    ]);
  };

  const removeCategory = (index: number) => {
    if (categories.length > 1) {
      const updatedCategories = categories.filter((_, i) => i !== index);
      setCategories(updatedCategories);
    } else {
      toast.error("You need at least one category");
    }
  };

  const getAgeCategoryLabel = (minAge?: number, maxAge?: number) => {
    if (minAge && maxAge) return `${minAge}-${maxAge} years`;
    if (minAge) return `${minAge}+ years`;
    if (maxAge) return `Under ${maxAge} years`;
    return "All ages";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!formData.name) {
      toast.error("Tournament name is required");
      return;
    }
    if (!formData.venue) {
      toast.error("Venue is required");
      return;
    }
    if (
      !formData.startDate ||
      !formData.endDate ||
      !formData.registrationDeadline
    ) {
      toast.error("Please fill all date fields");
      return;
    }

    // Validate categories
    for (const category of categories) {
      if (!category.name) {
        toast.error("Please fill all category names");
        return;
      }
      if (
        category.minAge &&
        category.maxAge &&
        category.minAge > category.maxAge
      ) {
        toast.error(`Invalid age range for ${category.name}`);
        return;
      }
    }

    setLoading(true);

    try {
      // Convert dates to ISO string
      const startDate = new Date(formData.startDate).toISOString();
      const endDate = new Date(formData.endDate).toISOString();
      const registrationDeadline = new Date(
        formData.registrationDeadline,
      ).toISOString();

      // Create tournament
      const tournamentResponse = await api.post("/tournaments", {
        name: formData.name,
        description: formData.description,
        venue: formData.venue,
        startDate,
        endDate,
        registrationDeadline,
        maxPlayers: formData.maxPlayers
          ? parseInt(formData.maxPlayers)
          : undefined,
        tournamentType,
      });

      const tournamentId = tournamentResponse.data.data.id;

      // Create categories for the tournament
      for (const category of categories) {
        await api.post(`/tournaments/${tournamentId}/categories`, {
          name: category.name,
          type: category.type,
          minAge: category.minAge,
          maxAge: category.maxAge,
          gender: category.gender,
          maxParticipants: category.maxParticipants,
        });
      }

      toast.success("Tournament and categories created successfully!");
      navigate("/tournaments");
    } catch (error: any) {
      console.error("Creation error:", error);
      toast.error(
        error.response?.data?.message || "Failed to create tournament",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-4xl mx-auto px-4 lg:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Create New Tournament
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Tournament Info */}
          <div className="card space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="e.g., City Open Championship 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="input-field"
                placeholder="Describe the tournament..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue *
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="e.g., City Sports Complex"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Deadline *
              </label>
              <input
                type="datetime-local"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleChange}
                required
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be before the start date
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Players (Optional)
              </label>
              <input
                type="number"
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., 64"
                min="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Format *
              </label>
              <select
                value={tournamentType}
                onChange={(e) => setTournamentType(e.target.value)}
                className="input-field"
              >
                <option value="KNOCKOUT">
                  🏆 Knockout (Direct Elimination)
                </option>
                <option value="GROUP_KNOCKOUT">
                  🏅 Group Stage + Knockout
                </option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {tournamentType === "KNOCKOUT"
                  ? "Players are directly placed in elimination bracket"
                  : "Players first play in groups, then top players advance to knockout"}
              </p>
            </div>
          </div>

          {/* Categories Section */}
          <div className="card space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Categories
              </h2>
              <button
                type="button"
                onClick={addCategory}
                className="bg-primary-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-primary-700"
              >
                + Add Category
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Define age groups and match types for this tournament
            </p>

            {categories.map((category, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">
                    Category {index + 1}
                  </h3>
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCategory(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) =>
                        handleCategoryChange(index, "name", e.target.value)
                      }
                      required
                      className="input-field"
                      placeholder="e.g., Men's Singles U-18"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Match Type *
                    </label>
                    <select
                      value={category.type}
                      onChange={(e) =>
                        handleCategoryChange(
                          index,
                          "type",
                          e.target.value as "SINGLES" | "DOUBLES" | "TEAM",
                        )
                      }
                      className="input-field"
                    >
                      <option value="SINGLES">Singles</option>
                      <option value="DOUBLES">Doubles</option>
                      <option value="TEAM">Team</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Range (Optional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min Age"
                        value={category.minAge || ""}
                        onChange={(e) =>
                          handleCategoryChange(
                            index,
                            "minAge",
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          )
                        }
                        className="input-field"
                        min="5"
                        max="100"
                      />
                      <span className="flex items-center">-</span>
                      <input
                        type="number"
                        placeholder="Max Age"
                        value={category.maxAge || ""}
                        onChange={(e) =>
                          handleCategoryChange(
                            index,
                            "maxAge",
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          )
                        }
                        className="input-field"
                        min="5"
                        max="100"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Example: 15-18 for Under-18 category
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender (Optional)
                    </label>
                    <select
                      value={category.gender || ""}
                      onChange={(e) =>
                        handleCategoryChange(
                          index,
                          "gender",
                          (e.target.value as "MALE" | "FEMALE" | "MIXED") ||
                            undefined,
                        )
                      }
                      className="input-field"
                    >
                      <option value="">Mixed / Open</option>
                      <option value="MALE">Men's Only</option>
                      <option value="FEMALE">Women's Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants *
                  </label>
                  <input
                    type="number"
                    value={category.maxParticipants}
                    onChange={(e) =>
                      handleCategoryChange(
                        index,
                        "maxParticipants",
                        parseInt(e.target.value),
                      )
                    }
                    required
                    className="input-field"
                    min="2"
                    max="256"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of players/teams in this category
                  </p>
                </div>

                {/* Preview of category settings */}
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Preview:</span>{" "}
                    {category.name || "Unnamed"} • {category.type}
                    {category.gender &&
                      ` • ${category.gender === "MALE" ? "Men's" : "Women's"}`}
                    {getAgeCategoryLabel(category.minAge, category.maxAge)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Tournament"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/tournaments")}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTournament;
