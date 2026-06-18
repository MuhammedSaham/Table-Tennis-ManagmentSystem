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
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    else if (formData.firstName.trim().length < 2) newErrors.firstName = "First name must be at least 2 characters";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    else if (formData.lastName.trim().length < 2) newErrors.lastName = "Last name must be at least 2 characters";
    if (!formData.email.trim()) newErrors.email = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Please enter a valid email address (e.g., name@example.com)";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!validateSriLankanPhone(formData.phone)) newErrors.phone = "Please enter a valid Sri Lanka phone number (e.g., 071-1234567 or 011-1234567)";
    if (!formData.password) newErrors.password = "Password is required";
    else if (!passwordValid.length || !passwordValid.uppercase || !passwordValid.lowercase || !passwordValid.number)
      newErrors.password = "Please meet all password requirements below";
    if (!profileImage) newErrors.profileImage = "Profile picture is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { toast.error("Please fix the errors above"); return; }
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
          dateOfBirth: formData.playerProfile.dateOfBirth ? new Date(formData.playerProfile.dateOfBirth) : undefined,
          skillLevel: formData.playerProfile.skillLevel,
          clubAffiliation: formData.playerProfile.clubAffiliation,
        };
      } else if (formData.role === "REFEREE") {
        registerData.refereeProfile = { certification: "National Level", experienceYears: 2 };
      } else if (formData.role === "ADMIN") {
        registerData.adminProfile = { department: "Tournament Management" };
      }
      await register(registerData);
      if (profileImage) {
        const formDataUpload = new FormData();
        formDataUpload.append("profileImage", profileImage);
        await api.post("/users/upload-profile-image", formDataUpload, { headers: { "Content-Type": "multipart/form-data" } });
      }
      showSuccess("Welcome! Your account has been created successfully.");
      navigate("/app/dashboard");
    } catch (error) {
      handleApiError(error as any);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "password") validatePassword(value);
    if (name === "skillLevel" || name === "clubAffiliation" || name === "dateOfBirth") {
      setFormData(prev => ({ ...prev, playerProfile: { ...prev.playerProfile, [name]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name as keyof FormErrors]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const isPasswordValid = passwordValid.length && passwordValid.uppercase && passwordValid.lowercase && passwordValid.number;

  return (
    <div className="flex min-h-screen w-screen items-center justify-center overflow-hidden bg-[#061D23] p-0">
      <div className="flex min-h-screen w-full overflow-hidden border border-[#12679E] bg-[#061D23] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">

        {/* LEFT panel */}
        {/* LEFT panel */}
<div className="relative flex min-h-[220px] items-start justify-center overflow-hidden bg-[#061D23] p-8 pt-10 text-white sm:p-10 sm:pt-12 lg:min-h-full lg:w-[50%] lg:justify-start lg:p-12 lg:pt-14">

  {/* Background shapes */}
  <div className="absolute inset-0">
    <div className="absolute inset-0 bg-[#12679E] [clip-path:polygon(0_0,72%_0,45%_100%,0_100%)] opacity-60" />
    <div className="absolute inset-0 bg-[#4AEEFF] [clip-path:polygon(68%_0,80%_0,53%_100%,41%_100%)] opacity-80" />
    <div className="absolute inset-0 bg-[#12679E] [clip-path:polygon(78%_0,90%_0,63%_100%,51%_100%)] opacity-40" />
  </div>

  {/* Table Tennis Player */}
  <img
    src="/man1.png"
    alt="Table Tennis Player"
    style={{ width: 600, maxWidth: "90%",left: 0, bottom: 20, position: "absolute" }}
    className="absolute left-0 bottom-0 h-[85%] object-contain opacity-20 pointer-events-none z-0"
  />

  <div className="relative z-10 max-w-sm">
    <img
      src="/LOGO.png"
      alt="Sam's College"
      style={{
        width: 300,
        maxWidth: "30%",
        display: "block",
        paddingBottom: 20,
        marginBottom: 20,
      }}
    />

    <h1 className="text-3xl font-black uppercase tracking-[0.25em] text-[#FFFFFF]">
      Create Account
    </h1>

    <p className="mt-3 text-sm uppercase tracking-[0.25em] text-[#FFFFFF]">
      Join the tournament platform
    </p>

    <div className="mt-6 h-1 w-24 rounded-full bg-[#4AEEFF]" />
    <div className="mt-2 ml-8 h-1 w-14 rounded-full bg-[#FFFFFF]" />
  </div>
</div>

        {/* RIGHT panel */}
        <div className="w-full bg-[#03111a] p-6 sm:p-8 lg:w-[50%] lg:p-30">
          <div className="mb-6 h-1 w-full rounded-full bg-[12679E]" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-[#4AEEFF]">
                  First Name *
                </label>
                <input
                  type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                  className={`w-full rounded-md border bg-[#061D23] px-4 py-3 text-[15px] text-[#FFFFFF] placeholder:text-[#FFFFFF] focus:outline-none ${errors.firstName ? "border-[#4AEEFF]" : "border-[#12679E] focus:border-[#4AEEFF]"}`}
                  placeholder="John"
                />
                {errors.firstName && <p className="mt-1 text-xs text-[#4AEEFF]">{errors.firstName}</p>}
                <p className="mt-1 text-xs text-[#FFFFFF]">
                  {formData.firstName ? `${formData.firstName.length}/2+ characters` : "Minimum 2 characters required"}
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-[#4AEEFF]">
                  Last Name *
                </label>
                <input
                  type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                  className={`w-full rounded-md border bg-[#061D23] px-4 py-3 text-[15px] text-[#FFFFFF] placeholder:text-[#FFFFFF] focus:outline-none ${errors.lastName ? "border-[#4AEEFF]" : "border-[#12679E] focus:border-[#4AEEFF]"}`}
                  placeholder="Doe"
                />
                {errors.lastName && <p className="mt-1 text-xs text-[#4AEEFF]">{errors.lastName}</p>}
                <p className="mt-1 text-xs text-[#FFFFFF]">
                  {formData.lastName ? `${formData.lastName.length}/2+ characters` : "Minimum 2 characters required"}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-[#4AEEFF]">
                Email Address *
              </label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                className={`w-full rounded-md border bg-[#061D23] px-4 py-3 text-[15px] text-[#FFFFFF] placeholder:text-[#FFFFFF] focus:outline-none ${errors.email ? "border-[#4AEEFF]" : "border-[#12679E] focus:border-[#4AEEFF]"}`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-[#4AEEFF]">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-[#4AEEFF]">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange}
                  className={`w-full rounded-md border bg-[#061D23] px-4 py-3 pr-12 text-[15px] text-[#FFFFFF] placeholder:text-[#FFFFFF] focus:outline-none ${errors.password ? "border-[#4AEEFF]" : "border-[#12679E] focus:border-[#4AEEFF]"}`}
                  placeholder="Create a strong password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4AEEFF]">
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <p className="text-[#FFFFFF]">{passwordValid.length ? "✓" : "○"} At least 8 characters</p>
                <p className="text-[#FFFFFF]">{passwordValid.uppercase ? "✓" : "○"} At least one uppercase letter (A-Z)</p>
                <p className="text-[#FFFFFF]">{passwordValid.lowercase ? "✓" : "○"} At least one lowercase letter (a-z)</p>
                <p className="text-[#FFFFFF]">{passwordValid.number ? "✓" : "○"} At least one number (0-9)</p>
              </div>
              {errors.password && <p className="mt-1 text-xs text-[#4AEEFF]">{errors.password}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-[#4AEEFF]">
                Phone Number *
              </label>
              <input
                type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className={`w-full rounded-md border bg-[#061D23] px-4 py-3 text-[15px] text-[#FFFFFF] placeholder:text-[#FFFFFF] focus:outline-none ${errors.phone ? "border-[#4AEEFF]" : "border-[#12679E] focus:border-[#4AEEFF]"}`}
                placeholder="071-1234567 or 011-1234567"
              />
              {errors.phone && <p className="mt-1 text-xs text-[#4AEEFF]">{errors.phone}</p>}
              <p className="mt-1 text-xs text-[#FFFFFF]">Format: Mobile: 071-1234567 | Landline: 011-1234567</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-[#4AEEFF]">
                I want to join as *
              </label>
              <select
                name="role" value={formData.role} onChange={handleChange}
                className="w-full rounded-md border border-[#12679E] bg-[#061D23] px-4 py-3 text-[15px] text-[#FFFFFF] focus:border-[#4AEEFF] focus:outline-none"
              >
                <option value="PLAYER">🏓 Player - Compete in tournaments</option>
                <option value="REFEREE">👨‍⚖️ Referee - Officiate matches</option>
                <option value="ADMIN">👑 Admin - Manage tournaments</option>
              </select>
              <p className="mt-1 text-xs text-[#FFFFFF]">
                {formData.role === "PLAYER" && "Join tournaments, track your progress, and compete with others!"}
                {formData.role === "REFEREE" && "Officiate matches, record scores, and manage games."}
                {formData.role === "ADMIN" && "Create tournaments, manage players, and oversee everything."}
              </p>
            </div>

            {formData.role === "PLAYER" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-[#4AEEFF]">
                    Date of Birth *
                  </label>
                  <input
                    type="date" name="dateOfBirth" value={formData.playerProfile.dateOfBirth || ""} onChange={handleChange} required
                    className="w-full rounded-md border border-[#12679E] bg-[#061D23] px-4 py-3 text-[15px] text-[#FFFFFF] focus:border-[#4AEEFF] focus:outline-none"
                    max={new Date().toISOString().split("T")[0]}
                  />
                  <p className="mt-1 text-xs text-[#FFFFFF]">This helps us determine your age category for tournaments</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-[#4AEEFF]">
                    Your Skill Level
                  </label>
                  <select
                    name="skillLevel" value={formData.playerProfile.skillLevel} onChange={handleChange}
                    className="w-full rounded-md border border-[#12679E] bg-[#061D23] px-4 py-3 text-[15px] text-[#FFFFFF] focus:border-[#4AEEFF] focus:outline-none"
                  >
                    <option value="Beginner">🏅 Beginner - Just starting out</option>
                    <option value="Intermediate">🎯 Intermediate - Have some experience</option>
                    <option value="Advanced">🏆 Advanced - Competing at high level</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-[#4AEEFF]">
                    Club or Academy (Optional)
                  </label>
                  <input
                    type="text" name="clubAffiliation" value={formData.playerProfile.clubAffiliation} onChange={handleChange}
                    className="w-full rounded-md border border-[#12679E] bg-[#061D23] px-4 py-3 text-[15px] text-[#FFFFFF] placeholder:text-[#FFFFFF] focus:border-[#4AEEFF] focus:outline-none"
                    placeholder="e.g., City Table Tennis Club"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.2em] text-[#4AEEFF]">
                Profile Photo *
              </label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Profile preview" className="h-20 w-20 rounded-full border-2 border-[#4AEEFF] object-cover" />
                    <button
                      type="button"
                      onClick={() => { setProfileImage(null); setImagePreview(null); }}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#4AEEFF] text-xs font-bold text-[#061D23] hover:bg-[#FFFFFF]"
                    >×</button>
                  </div>
                )}
                <label className="cursor-pointer rounded-lg border border-[#4AEEFF] bg-[#12679E] px-4 py-2 text-sm font-semibold text-[#FFFFFF] transition hover:bg-[#4AEEFF] hover:text-[#061D23]">
                  {imagePreview ? "Change Photo" : "Choose Photo"}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" required={!imagePreview} />
                </label>
              </div>
              {errors.profileImage && <p className="mt-1 text-xs text-[#4AEEFF]">{errors.profileImage}</p>}
              <p className="mt-1 text-xs text-[#FFFFFF]">JPG, PNG or GIF. Max 5MB.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading || (!!formData.password && !isPasswordValid)}
              className="w-full rounded-md bg-[#FFFFFF] px-4 py-3 text-sm font-black uppercase tracking-[0.25em] text-[#061D23] transition hover:bg-[#4AEEFF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Creating your account..." : "Create Free Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#FFFFFF]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#4AEEFF] hover:text-[#FFFFFF]">Sign in here</Link>
          </p>

          <div className="mt-6 border-t border-[#4AEEFF] pt-6">
            <p className="text-center text-xs text-[#FFFFFF]">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;