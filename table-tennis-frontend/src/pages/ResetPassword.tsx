import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const inputClassName =
  "w-full rounded-lg border border-white/10 bg-[#061D23]/60 p-2.5 text-sm text-white placeholder-white/20 transition focus:border-[#4AEEFF] focus:outline-none";
const labelClassName =
  "mb-1.5 block text-xs font-black uppercase tracking-wider text-white/70";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Confirm your new password"
                  className={inputClassName}
                />
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
