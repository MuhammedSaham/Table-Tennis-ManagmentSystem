import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  KeyIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api from "../services/api";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  userEmail,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success(response.data?.message || "Password changed successfully!");
      handleClose();
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to change password. Please check your current password.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-white/20 bg-[#061D23] p-6 text-left shadow-2xl transition-all sm:p-7 z-10">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#4AEEFF]/60 to-transparent" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Icon & Heading */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#4AEEFF]/15 border border-[#4AEEFF]/30 text-[#4AEEFF]">
            <KeyIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white">
              Change Password
            </h3>
            <p className="text-xs text-white/60">
              Update your account credentials
            </p>
          </div>
        </div>

        {/* User preview hint */}
        {userEmail && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/50">Account</span>
            <span className="font-mono text-white/80 font-semibold truncate max-w-[220px]">
              {userEmail}
            </span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-white/80 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-white placeholder-white/30 focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showCurrent ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-white/80 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-white placeholder-white/30 focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showNew ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            {newPassword && newPassword.length < 8 && (
              <p className="mt-1 text-[11px] text-amber-400">
                Must be at least 8 characters
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-white/80 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-white placeholder-white/30 focus:border-[#4AEEFF] focus:outline-none focus:ring-1 focus:ring-[#4AEEFF] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-[11px] text-rose-400">
                Passwords do not match
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5" /> Passwords match
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/20 bg-white/5 text-xs font-black uppercase tracking-wider text-white/80 hover:bg-white/10 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#12679E] to-[#4AEEFF] hover:opacity-95 text-[#061D23] text-xs font-black uppercase tracking-wider shadow-lg shadow-[#4AEEFF]/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#061D23] border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <KeyIcon className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default ChangePasswordModal;

