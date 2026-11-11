import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const inputClassName =
  "w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 transition focus:border-[#4AEEFF] focus:outline-none";
const labelClassName =
  "mb-1.5 block text-xs font-black uppercase tracking-wider text-white/70";

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setIsValidToken(false);
      toast.error("Invalid reset link");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password reset successful! Please login with your new password.");
      navigate("/login");
    } catch {
      // The API interceptor displays the server error.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-24 backdrop-blur-sm sm:pt-28">
      <div className="w-full max-w-4xl rounded-2xl border border-white/20 bg-[#061D23]/90 p-6 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="h-6 w-2.5 rounded-full bg-[#4AEEFF] shadow-[0_0_10px_#4AEEFF]" />
            <h1 className="text-xl font-black uppercase tracking-widest text-white sm:text-2xl">
              Reset Password
            </h1>
          </div>
          <Link
            to="/login"
            aria-label="Close reset password"
            className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </Link>
        </div>

        {!isValidToken ? (
          <div className="py-8 text-center">
            <div className="mb-4 text-5xl">🔒</div>
            <h2 className="text-lg font-black uppercase tracking-wider text-white">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-white/60">
              This password reset link is invalid or has expired.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex rounded-lg bg-[#4AEEFF] px-8 py-3 text-xs font-black uppercase tracking-widest text-[#061D23] transition-all hover:bg-white"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-lg border border-white/10 bg-[#061D23]/60 p-4">
              <h2 className="text-base font-black uppercase tracking-wider text-white">
                Account Recovery
              </h2>
              <p className="mt-1 text-xs text-white/50">
                Create a new password. The emailed reset link can only be used
                once and expires shortly.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClassName} htmlFor="new-password">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    className={`${inputClassName} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-[#4AEEFF] focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClassName} htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    className={`${inputClassName} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-[#4AEEFF] focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
              </div>
            </div>

            <p className="-mt-2 text-xs text-white/50">
              Password must contain at least 8 characters with uppercase,
              lowercase, and number.
            </p>

            <div className="flex gap-3 border-t border-white/10 pt-5">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-lg bg-[#4AEEFF] py-3 text-xs font-black uppercase tracking-widest text-[#061D23] transition-all hover:bg-white disabled:opacity-50 sm:flex-none sm:px-10"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
              <Link
                to="/login"
                className="flex-1 rounded-lg border border-white/20 bg-transparent py-3 text-center text-xs font-black uppercase tracking-widest text-[#4AEEFF] transition-all hover:bg-white/5 sm:flex-none sm:px-10"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
