import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { handleApiError, showSuccess } from "../utils/errorHandler";
import api from "../services/api";
import toast from "react-hot-toast";

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

  // Password validation state
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

  // Add this function before the validateForm function
  const validateSriLankanPhone = (phone: string): boolean => {
    // Sri Lanka phone number patterns:
    // Landline: 011-1234567, 081-1234567
    // Mobile: 071-1234567, 072-1234567, 074-1234567, 075-1234567, 076-1234567, 077-1234567, 078-1234567
    const phoneRegex = /^(0[1-9]{2})-?[0-9]{7}$|^(07[0-9])-?[0-9]{7}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // First Name validation - at least 2 characters
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    // Last Name validation - at least 2 characters
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email =
        "Please enter a valid email address (e.g., name@example.com)";
    }
    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validateSriLankanPhone(formData.phone)) {
      newErrors.phone =
        "Please enter a valid Sri Lanka phone number (e.g., 071-1234567 or 011-1234567)";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (
      !passwordValid.length ||
      !passwordValid.uppercase ||
      !passwordValid.lowercase ||
      !passwordValid.number
    ) {
      newErrors.password = "Please meet all password requirements below";
    }

    if (!profileImage) {
      newErrors.profileImage = "Profile picture is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        };
      } else if (formData.role === "REFEREE") {
        registerData.refereeProfile = {
          certification: "National Level",
          experienceYears: 2,
        };
      } else if (formData.role === "ADMIN") {
        registerData.adminProfile = {
          department: "Tournament Management",
        };
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

    if (name === "password") {
      validatePassword(value);
    }

    if (
      name === "skillLevel" ||
      name === "clubAffiliation" ||
      name === "dateOfBirth"
    ) {
      setFormData((prev) => ({
        ...prev,
        playerProfile: {
          ...prev.playerProfile,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const isPasswordValid =
    passwordValid.length &&
    passwordValid.uppercase &&
    passwordValid.lowercase &&
    passwordValid.number;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏓</div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join the tournament platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`input-field ${errors.firstName ? "border-red-500" : ""}`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.firstName
                  ? `${formData.firstName.length}/2+ characters`
                  : "Minimum 2 characters required"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`input-field ${errors.lastName ? "border-red-500" : ""}`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.firstName
                  ? `${formData.firstName.length}/2+ characters`
                  : "Minimum 2 characters required"}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input-field ${errors.email ? "border-red-500" : ""}`}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input-field ${errors.password ? "border-red-500" : ""}`}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            {/* Password requirements */}
            <div className="mt-2 space-y-1 text-xs">
              <p
                className={
                  passwordValid.length ? "text-green-600" : "text-gray-500"
                }
              >
                {passwordValid.length ? "✓" : "○"} At least 8 characters
              </p>
              <p
                className={
                  passwordValid.uppercase ? "text-green-600" : "text-gray-500"
                }
              >
                {passwordValid.uppercase ? "✓" : "○"} At least one uppercase
                letter (A-Z)
              </p>
              <p
                className={
                  passwordValid.lowercase ? "text-green-600" : "text-gray-500"
                }
              >
                {passwordValid.lowercase ? "✓" : "○"} At least one lowercase
                letter (a-z)
              </p>
              <p
                className={
                  passwordValid.number ? "text-green-600" : "text-gray-500"
                }
              >
                {passwordValid.number ? "✓" : "○"} At least one number (0-9)
              </p>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`input-field ${errors.phone ? "border-red-500" : ""}`}
              placeholder="071-1234567 or 011-1234567"
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Format: Mobile: 071-1234567 | Landline: 011-1234567
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I want to join as *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-field"
            >
              <option value="PLAYER">🏓 Player - Compete in tournaments</option>
              <option value="REFEREE">👨‍⚖️ Referee - Officiate matches</option>
              <option value="ADMIN">👑 Admin - Manage tournaments</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === "PLAYER" &&
                "Join tournaments, track your progress, and compete with others!"}
              {formData.role === "REFEREE" &&
                "Officiate matches, record scores, and manage games."}
              {formData.role === "ADMIN" &&
                "Create tournaments, manage players, and oversee everything."}
            </p>
          </div>

          {formData.role === "PLAYER" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.playerProfile.dateOfBirth || ""}
                  onChange={handleChange}
                  required
                  className="input-field"
                  max={new Date().toISOString().split("T")[0]} // Can't select future date
                />
                <p className="text-xs text-gray-500 mt-1">
                  This helps us determine your age category for tournaments
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Skill Level
                </label>
                <select
                  name="skillLevel"
                  value={formData.playerProfile.skillLevel}
                  onChange={handleChange}
                  className="input-field"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Club or Academy (Optional)
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

          {/* Profile Picture Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Photo *
            </label>
            <div className="flex items-center gap-4">
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Profile preview"
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

              {/* Upload Button */}
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
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
              <p className="text-xs text-red-500 mt-1">{errors.profileImage}</p>
            )}

            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG or GIF. Max 5MB.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!!formData.password && !isPasswordValid)}
            className="btn-primary w-full disabled:opacity-50"
          >
            {isLoading ? "Creating your account..." : "Create Free Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Sign in here
          </Link>
        </p>

        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-center text-gray-500">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
