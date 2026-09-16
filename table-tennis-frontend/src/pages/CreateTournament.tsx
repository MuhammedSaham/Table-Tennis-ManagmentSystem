import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { UserIcon, EnvelopeIcon, TrophyIcon } from "@heroicons/react/24/outline";

interface Category {
  name: string;
  type: "SINGLES" | "DOUBLES" | "TEAM";
  stageFormat: "KNOCKOUT" | "GROUP_KNOCKOUT";
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
      stageFormat: "KNOCKOUT",
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
        stageFormat: (tournamentType as "KNOCKOUT" | "GROUP_KNOCKOUT") || "KNOCKOUT",
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
          stageFormat: category.stageFormat || "KNOCKOUT",
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

  const inputStyles =
    "w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 focus:border-[#4AEEFF] focus:outline-none";
  const labelStyles = "block text-[15px] font-black uppercase tracking-wider text-white/70 mb-1.5";

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

  // Redirect if not admin
  if (user?.role !== "ADMIN") {
    navigate("/dashboard");
    return null;
  }

  return wrapInBaseLayout(
    <>
      {/* PREMIUM HEADER CONTROLS MODULE */}
      <header className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-3 h-[3px] w-16 bg-[#4AEEFF]" />
          <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white sm:text-4xl">
            Create New Tournament
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-[#4AEEFF]/90 mt-1">
            Configure event details, format, and player categories
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CORE BASIC INFORMATION LAYER */}
        <main className="rounded-[16px] border border-white/20 bg-[#061D23]/10 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl p-6">
          <div className="mb-5 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-[#4AEEFF]" />
            <h2 className="text-lg font-black uppercase tracking-widest text-white">
              Basic Information
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelStyles}>Tournament Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={inputStyles}
                placeholder="e.g., City Open Championship 2024"
              />
            </div>

            <div>
              <label className={labelStyles}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={inputStyles}
                placeholder="Describe the tournament..."
              />
            </div>

            <div>
              <label className={labelStyles}>Venue *</label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                required
                className={inputStyles}
                placeholder="e.g., City Sports Complex"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelStyles}>Start Date *</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className={`${inputStyles} [color-scheme:dark]`}
                />
              </div>
              <div>
                <label className={labelStyles}>End Date *</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className={`${inputStyles} [color-scheme:dark]`}
                />
              </div>
            </div>

            <div>
              <label className={labelStyles}>Registration Deadline *</label>
              <input
                type="datetime-local"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleChange}
                required
                className={`${inputStyles} [color-scheme:dark]`}
              />
              <p className="text-xs text-white/50 mt-1.5">
                Must be before the start date
              </p>
            </div>

            <div>
              <label className={labelStyles}>Max Players (Optional)</label>
              <input
                type="number"
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleChange}
                className={inputStyles}
                placeholder="e.g., 64"
                min="2"
              />
            </div>

            <div>
              <label className={labelStyles}>Default Tournament Format *</label>
              <select
                value={tournamentType}
                onChange={(e) => {
                  const newType = e.target.value;
                  setTournamentType(newType);
                  setCategories((prev) =>
                    prev.map((c) => ({
                      ...c,
                      stageFormat: newType as "KNOCKOUT" | "GROUP_KNOCKOUT",
                    })),
                  );
                }}
                className={inputStyles}
              >
                <option value="KNOCKOUT">
                  🏆 Knockout (Direct Elimination)
                </option>
                <option value="GROUP_KNOCKOUT">
                  🏅 Group Stage + Knockout
                </option>
              </select>
              <p className="text-xs text-white/50 mt-1.5">
                Default for new categories. You can also customize each category individually below.
              </p>
            </div>
          </div>
        </main>

        {/* CORE CATEGORIES LAYER */}
        <main className="rounded-[16px] border border-white/20 bg-[#061D23]/10 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl p-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-[#4AEEFF]" />
              <h2 className="text-lg font-black uppercase tracking-widest text-white">
                Categories
              </h2>
            </div>
            <button
              type="button"
              onClick={addCategory}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#4AEEFF] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#061D23] transition-all duration-200 hover:bg-white"
            >
              + Add Category
            </button>
          </div>
          <p className="text-xs text-white/50 mb-5">
            Define age groups, match types, and draw formats for this tournament
          </p>

          <div className="space-y-4">
            {categories.map((category, index) => (
              <div
                key={index}
                className="rounded-lg border border-white/10 bg-[#061D23]/40 p-4 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Category {index + 1}
                  </h3>
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCategory(index)}
                      className="text-red-400 hover:text-red-300 text-xs font-black uppercase tracking-wider"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyles}>Category Name *</label>
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) =>
                        handleCategoryChange(index, "name", e.target.value)
                      }
                      required
                      className={inputStyles}
                      placeholder="e.g., Men's Singles U-18"
                    />
                  </div>

                  <div>
                    <label className={labelStyles}>Match Type *</label>
                    <select
                      value={category.type}
                      onChange={(e) =>
                        handleCategoryChange(
                          index,
                          "type",
                          e.target.value as "SINGLES" | "DOUBLES" | "TEAM",
                        )
                      }
                      className={inputStyles}
                    >
                      <option value="SINGLES">Singles</option>
                      <option value="DOUBLES">Doubles</option>
                      <option value="TEAM">Team</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelStyles}>Draw Format *</label>
                    <select
                      value={category.stageFormat || "KNOCKOUT"}
                      onChange={(e) =>
                        handleCategoryChange(
                          index,
                          "stageFormat",
                          e.target.value as "KNOCKOUT" | "GROUP_KNOCKOUT",
                        )
                      }
                      className={inputStyles}
                    >
                      <option value="KNOCKOUT">🏆 Knockout</option>
                      <option value="GROUP_KNOCKOUT">🏅 Group + Knockout</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyles}>Age Range (Optional)</label>
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
                        className={inputStyles}
                        min="5"
                        max="100"
                      />
                      <span className="flex items-center text-white/40">-</span>
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
                        className={inputStyles}
                        min="5"
                        max="100"
                      />
                    </div>
                    <p className="text-xs text-white/50 mt-1.5">
                      Example: 15-18 for Under-18 category
                    </p>
                  </div>

                  <div>
                    <label className={labelStyles}>Gender (Optional)</label>
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
                      className={inputStyles}
                    >
                      <option value="">Mixed / Open</option>
                      <option value="MALE">Men's Only</option>
                      <option value="FEMALE">Women's Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelStyles}>Max Participants *</label>
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
                    className={inputStyles}
                    min="2"
                    max="256"
                  />
                  <p className="text-xs text-white/50 mt-1.5">
                    Maximum number of players/teams in this category
                  </p>
                </div>

                {/* Preview of category settings */}
                <div className="bg-[#061D23]/60 rounded-lg border border-white/10 p-3 text-sm">
                  <p className="text-white/70">
                    <span className="font-black uppercase tracking-wider text-[#4AEEFF] text-xs">
                      Preview:
                    </span>{" "}
                    {category.name || "Unnamed"} • {category.type}
                    {category.gender &&
                      ` • ${category.gender === "MALE" ? "Men's" : "Women's"}`}
                    {" • "}
                    {getAgeCategoryLabel(category.minAge, category.maxAge)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </main>

        <div className="flex gap-3 pb-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-[#4AEEFF] py-3 text-xs font-black uppercase tracking-widest text-[#061D23] transition-all hover:bg-white disabled:opacity-50 sm:flex-none sm:px-10"
          >
            {loading ? "Creating..." : "Create Tournament"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/tournaments")}
            className="flex-1 rounded-lg border border-white/20 bg-transparent py-3 text-xs font-black uppercase tracking-widest text-[#4AEEFF] transition-all hover:bg-white/5 sm:flex-none sm:px-10"
          >
            Cancel
          </button>
        </div>
      </form>

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
    </>
  );
};

export default CreateTournament;