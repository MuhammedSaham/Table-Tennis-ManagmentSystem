import React, { useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

interface GuestRegistrationModalProps {
  tournamentId: string;
  tournamentName: string;
  selectedCategories: string[];
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const GuestRegistrationModal: React.FC<GuestRegistrationModalProps> = ({
  tournamentId,
  tournamentName,
  selectedCategories,
  categories,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    skillLevel: "Intermediate",
    clubAffiliation: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let newPassword = "";
    for (let i = 0; i < 10; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return newPassword + "Aa1";
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    const generatedPassword = generatePassword();

    try {
      // Create temporary account
      await api.post("/auth/register", {
        email: formData.email,
        password: generatedPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: "PLAYER",
        playerProfile: {
          skillLevel: formData.skillLevel,
          clubAffiliation: formData.clubAffiliation,
          dateOfBirth: formData.dateOfBirth
            ? new Date(formData.dateOfBirth)
            : undefined,
        },
      });

      // Register for selected categories
      for (const categoryId of selectedCategories) {
        await api.post("/registrations", {
          tournamentId,
          categoryId,
        });
      }

      // Show credentials to user
      setPassword(generatedPassword);
      setStep(4); // Show credentials step

      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryNames = selectedCategories
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter(Boolean);

  const copyPassword = () => {
    navigator.clipboard.writeText(password);
    toast.success("Password copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Quick Registration
            </h2>
            <p className="text-sm text-gray-500">{tournamentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Your Information</h3>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name *"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name *"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  required
                />
              </div>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field pl-10"
                />
              </div>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="btn-primary flex-1">
                Continue
              </button>
              <button onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Playing Details */}
        {step === 2 && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrophyIcon className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Playing Details</h3>
            </div>
            <div className="space-y-3">
              <select
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Beginner">🏅 Beginner</option>
                <option value="Intermediate">🎯 Intermediate</option>
                <option value="Advanced">🏆 Advanced</option>
              </select>
              <input
                type="text"
                name="clubAffiliation"
                placeholder="Club/Academy (Optional)"
                value={formData.clubAffiliation}
                onChange={handleChange}
                className="input-field"
              />
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-800 mb-1">
                  Selected Categories:
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedCategoryNames.map((name, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {loading ? "Registering..." : "Complete Registration"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Credentials Display */}
        {step === 4 && (
          <div className="p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Registration Complete!
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Your account has been created
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Your Login Credentials:
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="text-sm font-mono">{formData.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                      {password}
                    </span>
                    <button
                      onClick={copyPassword}
                      className="text-primary-600 text-xs hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Save these credentials. You can use them to login later and view
                your match history.
              </p>
            </div>

            <button onClick={onClose} className="btn-primary w-full">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestRegistrationModal;
