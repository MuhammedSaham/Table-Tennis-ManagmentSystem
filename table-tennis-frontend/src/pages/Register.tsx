import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { handleApiError, showSuccess } from "../utils/errorHandler";
import api from "../services/api";
import toast from "react-hot-toast";

/* Palette: #061D23 | #4AEEFF | #FFFFFF | #12679E */

interface FormErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "PLAYER",
    phone: "",
    playerProfile: {
      dateOfBirth: "",
      skillLevel: "Intermediate",
      clubAffiliation: "",
      gender: "",
    },
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [passwordValid, setPasswordValid] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  const validatePassword = (password: string) => {
    setPasswordValid({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    });
  };

  const validateSriLankanPhone = (phone: string): boolean => {
    const phoneRegex = /^(0[1-9]{2})-?[0-9]{7}$|^(07[0-9])-?[0-9]{7}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    else if (formData.firstName.trim().length < 2)
      newErrors.firstName = "First name must be at least 2 characters";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    else if (formData.lastName.trim().length < 2)
      newErrors.lastName = "Last name must be at least 2 characters";
    if (!formData.email.trim()) newErrors.email = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email =
        "Please enter a valid email address (e.g., name@example.com)";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!validateSriLankanPhone(formData.phone))
      newErrors.phone =
        "Please enter a valid Sri Lanka phone number (e.g., 071-1234567 or 011-1234567)";
    if (!formData.password) newErrors.password = "Password is required";
    else if (
      !passwordValid.length ||
      !passwordValid.uppercase ||
      !passwordValid.lowercase ||
      !passwordValid.number
    )
      newErrors.password = "Please meet all password requirements below";
    if (!profileImage) newErrors.profileImage = "Profile picture is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors above");
      return;
    }
    setIsLoading(true);
    try {
      const registerData: any = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        phone: formData.phone,
      };
      if (formData.role === "PLAYER") {
        registerData.playerProfile = {
          dateOfBirth: formData.playerProfile.dateOfBirth
            ? new Date(formData.playerProfile.dateOfBirth)
            : undefined,
          skillLevel: formData.playerProfile.skillLevel,
          clubAffiliation: formData.playerProfile.clubAffiliation,
          gender: formData.playerProfile.gender,
        };
      } else if (formData.role === "REFEREE") {
        registerData.refereeProfile = {
          certification: "National Level",
          experienceYears: 2,
        };
      } else if (formData.role === "ADMIN") {
        registerData.adminProfile = { department: "Tournament Management" };
      }
      await register(registerData);
      if (profileImage) {
        const formDataUpload = new FormData();
        formDataUpload.append("profileImage", profileImage);
        await api.post("/users/upload-profile-image", formDataUpload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      showSuccess("Welcome! Your account has been created successfully.");
      navigate("/app/dashboard");
    } catch (error) {
      handleApiError(error as any);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "password") validatePassword(value);
    if (
      name === "skillLevel" ||
      name === "clubAffiliation" ||
      name === "dateOfBirth" ||
      name === "gender"
    ) {
      setFormData((prev) => ({
        ...prev,
        playerProfile: { ...prev.playerProfile, [name]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name as keyof FormErrors])
      setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const isPasswordValid =
    passwordValid.length &&
    passwordValid.uppercase &&
    passwordValid.lowercase &&
    passwordValid.number;

  return (
    /* ─── Full-screen background ─── */
    <div
      className="relative flex w-full items-start justify-center overflow-x-hidden overflow-y-auto"
      style={{
        minHeight: "100vh",
      }}
    >
      {/* Fixed full-viewport background image — always covers the screen regardless of card height */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('/register1.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Darkened overlay to reduce brightness */}
      <div className="fixed inset-0 bg-black/35 -z-10" />

      {/* ─── Centered glass card (reduced brightness) ─── */}
      <div
        className="relative z-10 my-8 w-[58%] min-w-[340px] max-w-2xl rounded-2xl px-8 py-8 shadow-2xl"
        style={{
          background: "rgba(255, 255, 255, 0.07)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1.5px solid rgba(255, 255, 255, 0.25)",
          boxShadow:
            "0 0 14px rgba(74, 238, 255, 0.10), 0 8px 32px rgba(0,0,0,0.18), 0 25px 50px rgba(0,0,0,0.35)",
        }}
      >
        {/* ── Logo + heading ── */}
        <div className="mb-7 flex flex-col items-center text-center">
          <img
            src="/LOGO.png"
            alt="Sam's College"
            className="mb-3 h-16 w-auto object-contain"
          />
          <h1 className="text-3xl font-black uppercase tracking-[0.25em] text-[#061D23]">
            Create Account
          </h1>
          <p className="mt-1.5 text-base font-black uppercase tracking-[0.18em] text-[#0d4a75]">
            Join the tournament platform
          </p>
          {/* Decorative accent line — single clean underline, no Gemini-style double diagonal */}
          <div className="mt-3 h-[2px] w-20 rounded-full bg-[#4AEEFF]" />
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* First + Last name */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-black uppercase tracking-[0.18em] text-[#0d4a75]">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                className={`w-full rounded-lg border bg-white/40 px-4 py-3 text-base text-[#061D23] placeholder:text-[#061D23]/40 focus:outline-none focus:ring-1 focus:ring-[#4AEEFF] ${
                  errors.firstName ? "border-red-400" : "border-white/60"
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-black uppercase tracking-[0.18em] text-[#0d4a75]">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className={`w-full rounded-lg border bg-white/40 px-4 py-3 text-base text-[#061D23] placeholder:text-[#061D23]/40 focus:outline-none focus:ring-1 focus:ring-[#4AEEFF] ${
                  errors.lastName ? "border-red-400" : "border-white/60"
                }`}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-black uppercase tracking-[0.18em] text-[#0d4a75]">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full rounded-lg border bg-white/40 px-4 py-3 text-base text-[#061D23] placeholder:text-[#061D23]/40 focus:outline-none focus:ring-1 focus:ring-[#4AEEFF] ${
                errors.email ? "border-red-400" : "border-white/60"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-black uppercase tracking-[0.18em] text-[#0d4a75]">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                className={`w-full rounded-lg border bg-white/40 px-4 py-3 pr-12 text-base text-[#061D23] placeholder:text-[#061D23]/40 focus:outline-none focus:ring-1 focus:ring-[#4AEEFF] ${
                  errors.password ? "border-red-400" : "border-white/60"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-[#061D23] hover:text-[#4AEEFF]"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {/* Password strength indicators */}
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
              <p
                className={
                  passwordValid.length
                    ? "text-sm font-bold text-[#061D23]"
                    : "text-sm font-semibold text-[#0d4a75]"
                }
              >
                {passwordValid.length ? "✓" : "○"} At least 8 characters
              </p>
              <p
                className={
                  passwordValid.uppercase
                    ? "text-sm font-bold text-[#061D23]"
                    : "text-sm font-semibold text-[#0d4a75]"
                }
              >
                {passwordValid.uppercase ? "✓" : "○"} One uppercase letter
              </p>
              <p
                className={
                  passwordValid.lowercase
                    ? "text-sm font-bold text-[#061D23]"
                    : "text-sm font-semibold text-[#0d4a75]"
                }
              >
                {passwordValid.lowercase ? "✓" : "○"} One lowercase letter
              </p>
              <p
                className={
                  passwordValid.number
                    ? "text-sm font-bold text-[#061D23]"
                    : "text-sm font-semibold text-[#0d4a75]"
                }
              >
                {passwordValid.number ? "✓" : "○"} One number (0-9)
              </p>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-black uppercase tracking-[0.18em] text-[#0d4a75]">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="071-1234567 or 011-1234567"
              className={`w-full rounded-lg border bg-white/40 px-4 py-3 text-base text-[#061D23] placeholder:text-[#061D23]/40 focus:outline-none focus:ring-1 focus:ring-[#4AEEFF] ${
                errors.phone ? "border-red-400" : "border-white/60"
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            )}
            <p className="mt-1 text-sm font-semibold text-[#0d4a75]">
              Mobile: 071-1234567 | Landline: 011-1234567
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-sm font-black uppercase tracking-[0.18em] text-[#0d4a75]">
              I want to join as *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/60 bg-white/40 px-4 py-3 text-base text-[#061D23] focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
            >
              <option value="PLAYER">🏓 Player - Compete in tournaments</option>
              <option value="REFEREE">👨‍⚖️ Referee - Officiate matches</option>
              <option value="ADMIN">🛡️ Admin - Request administrator privileges</option>
            </select>
            <p className="mt-1 text-sm font-semibold text-[#0d4a75]">
              {formData.role === "PLAYER" &&
                "Join tournaments, track your progress, and compete with others!"}
              {formData.role === "REFEREE" &&
                "Officiate matches, record scores, and manage games."}
              {formData.role === "ADMIN" &&
                "Register as Admin. Your request will be sent to the Super Admin for approval."}
            </p>
          </div>

          {/* Player-specific fields */}
          {formData.role === "PLAYER" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-black uppercase tracking-[0.18em] text-[#0d4a75]">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.playerProfile.dateOfBirth || ""}
                  onChange={handleChange}
                  required
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-lg border border-white/60 bg-white/40 px-4 py-3 text-base text-[#061D23] focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
                />
                <p className="mt-1 text-sm font-semibold text-[#0d4a75]">
                  Helps us determine your age category for tournaments
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-black uppercase tracking-[0.18em] text-[#0d4a75]">
                  Gender *
                </label>

                <select
                  name="gender"
                  value={formData.playerProfile.gender}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-white/60 bg-white/40 px-4 py-3 text-base text-[#061D23] focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>

                <p className="mt-1 text-sm font-semibold text-[#0d4a75]">
                  Required for mixed doubles tournament validation
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-black uppercase tracking-[0.18em] text-[#0d4a75]">
                  Skill Level
                </label>
                <select
                  name="skillLevel"
                  value={formData.playerProfile.skillLevel}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/60 bg-white/40 px-4 py-3 text-base text-[#061D23] focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
                >
                  <option value="Beginner">
                    🏅 Beginner - Just starting out
                  </option>
                  <option value="Intermediate">
                    🎯 Intermediate - Have some experience
                  </option>
                  <option value="Advanced">
                    🏆 Advanced - Competing at high level
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-black uppercase tracking-[0.18em] text-[#0d4a75]">
                  Club or Academy{" "}
                  <span className="normal-case tracking-normal text-[#061D23]/50">
                    (Optional)
                  </span>
                </label>
                <input
                  type="text"
                  name="clubAffiliation"
                  value={formData.playerProfile.clubAffiliation}
                  onChange={handleChange}
                  placeholder="e.g., City Table Tennis Club"
                  className="w-full rounded-lg border border-white/60 bg-white/40 px-4 py-3 text-base text-[#061D23] placeholder:text-[#061D23]/40 focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF]"
                />
              </div>
            </>
          )}

          {/* Profile Photo */}
          <div>
            <label className="mb-1.5 block text-sm font-black uppercase tracking-[0.18em] text-[#0d4a75]">
              Profile Photo *
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {imagePreview && (
                <div className="relative flex-shrink-0">
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="rounded-full border-2 border-[#4AEEFF] object-cover"
                    style={{
                      width: "64px",
                      height: "64px",
                      minWidth: "64px",
                      maxWidth: "64px",
                      display: "block",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#4AEEFF] text-xs font-bold text-[#061D23] hover:bg-white"
                  >
                    ×
                  </button>
                </div>
              )}
              <label className="cursor-pointer rounded-lg border border-[#12679E]/50 bg-white/30 px-5 py-2.5 text-base font-semibold text-[#061D23] transition hover:bg-[#4AEEFF] hover:text-[#061D23]">
                {imagePreview ? "Change Photo" : "Choose Photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  required={!imagePreview}
                />
              </label>
            </div>
            {errors.profileImage && (
              <p className="mt-1 text-xs text-red-600">{errors.profileImage}</p>
            )}
            <p className="mt-1 text-sm font-semibold text-[#0d4a75]">
              JPG, PNG or GIF. Max 5MB.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || (!!formData.password && !isPasswordValid)}
            className="w-full cursor-pointer rounded-lg border border-[#12679E]/50 bg-white/30 px-5 py-3.5 text-base font-black uppercase tracking-[0.25em] text-[#061D23] transition hover:bg-[#0a3f63] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Creating your account..." : "Create Free Account"}
          </button>
        </form>

        {/* Sign in link */}
        <p className="mt-6 text-center text-base text-[#061D23]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#0d4a75] hover:text-[#061D23]"
          >
            Sign in here
          </Link>
        </p>

        {/* Footer */}
        <div className="mt-5 border-t border-[#061D23]/20 pt-4">
          <p className="text-center text-sm font-semibold text-[#0d4a75]">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
