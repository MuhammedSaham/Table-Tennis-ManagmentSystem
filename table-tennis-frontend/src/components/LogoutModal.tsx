import React from "react";
import { createPortal } from "react-dom";
import { ArrowRightOnRectangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
  userRole?: string;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  userRole,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-white/20 bg-[#061D23] p-6 text-left shadow-2xl transition-all sm:p-7 z-10">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Icon & Heading */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white">
              Log Out
            </h3>
            <p className="text-xs text-white/60">
              Are you sure you want to end your session?
            </p>
          </div>
        </div>

        {/* User preview pill */}
        {userName && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-white/10 bg-[#0A262D]/60 p-3 backdrop-blur-md">
            <span className="text-xs font-bold text-slate-200 truncate">
              {userName}
            </span>
            {userRole && (
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                  userRole === "SUPER_ADMIN"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-[#4AEEFF]/20 text-[#4AEEFF] border-[#4AEEFF]/30"
                }`}
              >
                {userRole === "SUPER_ADMIN" ? "SUPER ADMIN" : userRole}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/20 bg-white/5 text-xs font-black uppercase tracking-wider text-white/80 hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all active:scale-95"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span>Yes, Log Out</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default LogoutModal;
