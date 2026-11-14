import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  PhotoIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  getAboutContent,
  updateAboutContent,
  uploadAboutImage,
  resolveAboutImageUrl,
  type AboutContent,
  type TrainingCentre,
} from "../services/about.service";
import AboutImageDefault from "../assets/sams_college_AboutUs.png";
import ImageCropModal from "../components/ImageCropModal";

export const ManageAbout: React.FC = () => {
  const [formData, setFormData] = useState<AboutContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"hero" | "overview" | "story" | "centres">("hero");

  // Cropper modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropSourceImage, setCropSourceImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const data = await getAboutContent();
      setFormData(data);
    } catch {
      toast.error("Could not load about content. Using defaults.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (field: keyof AboutContent, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleCentreChange = (index: number, key: keyof TrainingCentre, value: string) => {
    if (!formData) return;
    const updated = [...formData.trainingCentres];
    updated[index] = { ...updated[index], [key]: value };
    setFormData({ ...formData, trainingCentres: updated });
  };

  const handleAddCentre = () => {
    if (!formData) return;
    const newCentre: TrainingCentre = {
      name: "New Academy Hub",
      address: "Address line, Northern Sri Lanka",
      tag: "Training Hub",
    };
    setFormData({ ...formData, trainingCentres: [...formData.trainingCentres, newCentre] });
  };

  const handleRemoveCentre = (index: number) => {
    if (!formData) return;
    const updated = formData.trainingCentres.filter((_, i) => i !== index);
    setFormData({ ...formData, trainingCentres: updated });
  };

  const handleProgrammeChange = (index: number, value: string) => {
    if (!formData) return;
    const updated = [...formData.programmes];
    updated[index] = value;
    setFormData({ ...formData, programmes: updated });
  };

  const handleAddProgramme = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      programmes: [...formData.programmes, "New programme feature or training module"],
    });
  };

  const handleRemoveProgramme = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      programmes: formData.programmes.filter((_, i) => i !== index),
    });
  };

  // Image upload picker
  const handleSelectPosterFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropSourceImage(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (file: File) => {
    try {
      setIsUploadingImage(true);
      const res = await uploadAboutImage(file);
      if (formData) {
        setFormData({ ...formData, heroImage: res.url });
      }
      toast.success("Poster uploaded successfully! Remember to save changes.");
    } catch {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemovePoster = () => {
    if (!formData) return;
    setFormData({ ...formData, heroImage: null });
    toast.success("Poster reset to default academy artwork");
  };

  const handleSave = async () => {
    if (!formData) return;
    try {
      setIsSaving(true);
      const updated = await updateAboutContent(formData);
      setFormData(updated);
      toast.success("About page updated successfully!");
    } catch {
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#4AEEFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-white/60">Loading About Us content…</p>
        </div>
      </div>
    );
  }

  const currentPosterUrl = formData.heroImage
    ? resolveAboutImageUrl(formData.heroImage)
    : AboutImageDefault;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/15 bg-[#061D23]/60 p-5 backdrop-blur-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              to="/app/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#4AEEFF] hover:underline"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Manage About Us Content</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 px-2 py-0.5 rounded-full">
              CMS
            </span>
          </h1>
          <p className="text-xs text-white/60 mt-0.5">
            Update the admissions poster, story, coaching quote, programmes, and campus locations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Link
            to="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-all"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4 text-[#4AEEFF]" />
            Preview Public Page
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-[#061D23] bg-[#4AEEFF] hover:bg-[#35efff] rounded-xl shadow-[0_0_20px_rgba(74,238,255,0.3)] transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4 stroke-[3]" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-white/10">
        {[
          { id: "hero", label: "Admissions Poster & Hero" },
          { id: "overview", label: "Overview & Founder Spotlight" },
          { id: "story", label: "Our Story & Vision" },
          { id: "centres", label: "Programmes & Training Hubs" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#4AEEFF] text-[#061D23] shadow-md"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: HERO & POSTER ── */}
      {activeTab === "hero" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Poster Upload & Visual Preview */}
          <div className="lg:col-span-5 rounded-2xl border border-white/15 bg-[#061D23]/50 p-5 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Admissions Poster Frame</span>
              <span className="text-[10px] font-mono text-[#4AEEFF] bg-[#4AEEFF]/10 px-2 py-0.5 rounded border border-[#4AEEFF]/30">
                Ratio 3:4
              </span>
            </h3>

            {/* Poster Preview */}
            <div className="relative group overflow-hidden rounded-xl border border-white/20 bg-black/40 shadow-xl max-w-sm mx-auto">
              <img
                src={currentPosterUrl}
                alt="Admissions poster"
                className="w-full h-auto object-cover max-h-[440px]"
              />

              {/* Tagline Overlay on Preview */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-6 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/90">
                  <SparklesIcon className="w-3.5 h-3.5 text-[#4AEEFF]" />
                  {formData.heroTagline}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#4AEEFF] bg-[#4AEEFF]/20 px-2 py-0.5 rounded border border-[#4AEEFF]/40">
                  {formData.heroBadge}
                </span>
              </div>
            </div>

            {/* Upload Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <label className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#12679E] hover:bg-[#157cb8] text-white cursor-pointer shadow-md transition-all active:scale-95">
                <PhotoIcon className="w-4 h-4" />
                <span>{isUploadingImage ? "Uploading…" : "Upload New Poster"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelectPosterFile}
                  className="hidden"
                  disabled={isUploadingImage}
                />
              </label>

              {formData.heroImage && (
                <button
                  type="button"
                  onClick={handleRemovePoster}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 transition-all"
                  title="Revert to bundled poster"
                >
                  <TrashIcon className="w-4 h-4" />
                  Reset Poster
                </button>
              )}
            </div>
            <p className="text-[11px] text-white/50 text-center leading-relaxed">
              When you select an image, our tool lets you reposition and crop it so it fits the card smoothly without stretching.
            </p>
          </div>

          {/* Hero Text Fields */}
          <div className="lg:col-span-7 rounded-2xl border border-white/15 bg-[#061D23]/50 p-5 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">
              Page Header & Badges
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                Main Header Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTextChange("title", e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-sm text-white placeholder-white/40 focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                Header Subtitle / Tagline
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleTextChange("subtitle", e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-sm text-white placeholder-white/40 focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                  Top Badge 1
                </label>
                <input
                  type="text"
                  value={formData.badge1}
                  onChange={(e) => handleTextChange("badge1", e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-sm text-white placeholder-white/40 focus:border-[#4AEEFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                  Top Badge 2
                </label>
                <input
                  type="text"
                  value={formData.badge2}
                  onChange={(e) => handleTextChange("badge2", e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-sm text-white placeholder-white/40 focus:border-[#4AEEFF] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                  Poster Bottom Tagline
                </label>
                <input
                  type="text"
                  value={formData.heroTagline}
                  onChange={(e) => handleTextChange("heroTagline", e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-sm text-white placeholder-white/40 focus:border-[#4AEEFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                  Poster Bottom Badge
                </label>
                <input
                  type="text"
                  value={formData.heroBadge}
                  onChange={(e) => handleTextChange("heroBadge", e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-sm text-white placeholder-white/40 focus:border-[#4AEEFF] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: OVERVIEW & FOUNDER SPOTLIGHT ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/15 bg-[#061D23]/50 p-5 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">
              Academy Overview Text
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                Overview Paragraph 1 (Introduction & Founder Origin)
              </label>
              <textarea
                rows={3}
                value={formData.introP1}
                onChange={(e) => handleTextChange("introP1", e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm text-white placeholder-white/40 focus:border-[#4AEEFF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                Overview Paragraph 2 (Student Progression & Coaching)
              </label>
              <textarea
                rows={3}
                value={formData.introP2}
                onChange={(e) => handleTextChange("introP2", e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm text-white placeholder-white/40 focus:border-[#4AEEFF] focus:outline-none"
              />
            </div>
          </div>

          {/* Founder Spotlight Quote */}
          <div className="rounded-2xl border border-[#4AEEFF]/40 border-l-4 bg-[#061D23]/50 p-5 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Founder Spotlight Quote Card</h3>

            <div>
              <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                Quote Content
              </label>
              <textarea
                rows={2}
                value={formData.founderQuote}
                onChange={(e) => handleTextChange("founderQuote", e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm text-white placeholder-white/40 focus:border-[#4AEEFF] focus:outline-none italic"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                  Founder Name
                </label>
                <input
                  type="text"
                  value={formData.founderName}
                  onChange={(e) => handleTextChange("founderName", e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                  Title / Designation
                </label>
                <input
                  type="text"
                  value={formData.founderRole}
                  onChange={(e) => handleTextChange("founderRole", e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* More Than a Sports Academy */}
          <div className="rounded-2xl border border-white/15 bg-[#061D23]/50 p-5 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">
              Values Section
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                Section Heading
              </label>
              <input
                type="text"
                value={formData.moreThanTitle}
                onChange={(e) => handleTextChange("moreThanTitle", e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                Body Text
              </label>
              <textarea
                rows={3}
                value={formData.moreThanText}
                onChange={(e) => handleTextChange("moreThanText", e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: OUR STORY & VISION ── */}
      {activeTab === "story" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/15 bg-[#061D23]/50 p-5 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">
              Our Story (Milestones & Expansion)
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                Story Paragraph 1 (Beginnings & Jaffna expansion)
              </label>
              <textarea
                rows={3}
                value={formData.storyP1}
                onChange={(e) => handleTextChange("storyP1", e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                Story Paragraph 2 (Kilinochchi & Don Bosco Collaboration)
              </label>
              <textarea
                rows={3}
                value={formData.storyP2}
                onChange={(e) => handleTextChange("storyP2", e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                Story Paragraph 3 (Continued Growth & Future Commitments)
              </label>
              <textarea
                rows={3}
                value={formData.storyP3}
                onChange={(e) => handleTextChange("storyP3", e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Our Team */}
            <div className="rounded-2xl border border-white/15 bg-[#061D23]/50 p-5 backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">Our Team</h3>
              <div>
                <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                  Team Paragraph 1
                </label>
                <textarea
                  rows={3}
                  value={formData.teamP1}
                  onChange={(e) => handleTextChange("teamP1", e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                  Team Paragraph 2
                </label>
                <textarea
                  rows={3}
                  value={formData.teamP2}
                  onChange={(e) => handleTextChange("teamP2", e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                />
              </div>
            </div>

            {/* Our Vision */}
            <div className="rounded-2xl border border-white/15 bg-[#061D23]/50 p-5 backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">Our Vision</h3>
              <div>
                <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                  Vision Paragraph 1
                </label>
                <textarea
                  rows={3}
                  value={formData.visionP1}
                  onChange={(e) => handleTextChange("visionP1", e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-1.5">
                  Vision Paragraph 2
                </label>
                <textarea
                  rows={3}
                  value={formData.visionP2}
                  onChange={(e) => handleTextChange("visionP2", e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PROGRAMMES & HUBS ── */}
      {activeTab === "centres" && (
        <div className="space-y-6">
          {/* Programmes List */}
          <div className="rounded-2xl border border-white/15 bg-[#061D23]/50 p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white">Programme Checklist Points</h3>
              <button
                type="button"
                onClick={handleAddProgramme}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-[#12679E] hover:bg-[#157cb8] text-white rounded-lg transition-all"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Add Point
              </button>
            </div>

            <div className="space-y-2.5">
              {formData.programmes.map((prog, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#4AEEFF] w-6 shrink-0 font-bold">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={prog}
                    onChange={(e) => handleProgrammeChange(idx, e.target.value)}
                    className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3.5 py-2 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveProgramme(idx)}
                    className="p-2 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Book Aside */}
          <div className="rounded-2xl border border-[#4AEEFF]/40 border-l-4 bg-[#061D23]/50 p-5 backdrop-blur-xl space-y-2">
            <h3 className="text-sm font-bold text-white">Activity Book Spotlight</h3>
            <textarea
              rows={2}
              value={formData.activityBook}
              onChange={(e) => handleTextChange("activityBook", e.target.value)}
              className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-sm text-white focus:border-[#4AEEFF] focus:outline-none"
            />
          </div>

          {/* Training Centres */}
          <div className="rounded-2xl border border-white/15 bg-[#061D23]/50 p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white">Academy Training Hubs (Locations)</h3>
              <button
                type="button"
                onClick={handleAddCentre}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-[#12679E] hover:bg-[#157cb8] text-white rounded-lg transition-all"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Add Campus / Hub
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.trainingCentres.map((centre, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#4AEEFF]">Hub #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCentre(idx)}
                      className="p-1 text-rose-300 hover:text-white hover:bg-rose-500/20 rounded transition-colors"
                      title="Remove Hub"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                      Campus Name
                    </label>
                    <input
                      type="text"
                      value={centre.name}
                      onChange={(e) => handleCentreChange(idx, "name", e.target.value)}
                      className="w-full rounded-lg bg-black/30 border border-white/20 px-3 py-1.5 text-xs text-white focus:border-[#4AEEFF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                      Badge / Tag
                    </label>
                    <input
                      type="text"
                      value={centre.tag}
                      onChange={(e) => handleCentreChange(idx, "tag", e.target.value)}
                      className="w-full rounded-lg bg-black/30 border border-white/20 px-3 py-1.5 text-xs text-white focus:border-[#4AEEFF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-white/70 uppercase mb-1">
                      Address / Venue Details
                    </label>
                    <textarea
                      rows={2}
                      value={centre.address}
                      onChange={(e) => handleCentreChange(idx, "address", e.target.value)}
                      className="w-full rounded-lg bg-black/30 border border-white/20 p-2 text-xs text-white focus:border-[#4AEEFF] focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Quick Save Bar */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-xl border border-white/20 bg-[#061D23]/95 px-5 py-3 shadow-2xl backdrop-blur-xl">
        <span className="text-xs text-white/60">
          Unsaved changes will be applied to the public website upon clicking Save.
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-[#061D23] bg-[#4AEEFF] hover:bg-[#35efff] rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? "Saving Content…" : "Save All Changes"}
        </button>
      </div>

      {/* Interactive Poster Cropping & Sizing Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={cropSourceImage}
        aspectRatio={3 / 4}
        targetWidth={900}
        targetHeight={1200}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default ManageAbout;
