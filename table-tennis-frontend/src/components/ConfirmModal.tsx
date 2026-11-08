import React, { useEffect } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  details?: string;
  itemName?: string;
  itemBadge?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "success";
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  details,
  itemName,
  itemBadge = "CONFIRM",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";
  const isSuccess = variant === "success";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-white/20 bg-[#061D23] p-6 text-left shadow-2xl transition-all sm:p-7 z-10 animate-in zoom-in-95 duration-200">
        {/* Top glowing accent line */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${
            isDanger
              ? "via-rose-500/70"
              : isWarning
              ? "via-amber-500/70"
              : "via-emerald-500/70"
          } to-transparent`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Close dialog"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Icon & Heading */}
        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-inner ${
              isDanger
                ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                : isWarning
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {isDanger && <TrashIcon className="w-6 h-6" />}
            {isWarning && <ExclamationTriangleIcon className="w-6 h-6" />}
            {isSuccess && <CheckCircleIcon className="w-6 h-6" />}
          </div>
          <div className="min-w-0 pr-6">
            <h3
              id="confirm-modal-title"
              className="text-lg font-black uppercase tracking-wider text-white"
            >
              {title}
            </h3>
            <p className="mt-1 text-xs text-white/70 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Item Preview Pill */}
        {itemName && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-[#0A262D]/70 p-3 backdrop-blur-md">
            <span
              className="text-xs font-bold text-slate-100 truncate pr-2"
              title={itemName}
            >
              {itemName}
            </span>
            <span
              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                isDanger
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : isWarning
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              }`}
            >
              {itemBadge}
            </span>
          </div>
        )}

        {/* Detailed Warning/Info Notice */}
        {details && (
          <div
            className={`mb-6 rounded-lg p-3 text-[11px] leading-relaxed border ${
              isDanger
                ? "bg-rose-500/10 border-rose-500/20 text-rose-300/90"
                : isWarning
                ? "bg-amber-500/10 border-amber-500/20 text-amber-300/90"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300/90"
            }`}
          >
            {details}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/20 bg-white/5 text-xs font-black uppercase tracking-wider text-white/80 hover:bg-white/10 hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
                : isWarning
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
                : "bg-emerald-500 hover:bg-emerald-400 text-[#061D23] shadow-emerald-500/30"
            }`}
          >
            {isLoading ? (
              <>
                <div
                  className={`w-4 h-4 border-2 rounded-full animate-spin ${
                    isSuccess
                      ? "border-[#061D23]/30 border-t-[#061D23]"
                      : "border-white/30 border-t-white"
                  }`}
                />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {isDanger && <TrashIcon className="w-4 h-4" />}
                {isWarning && <ExclamationTriangleIcon className="w-4 h-4" />}
                {isSuccess && <CheckCircleIcon className="w-4 h-4 text-[#061D23]" />}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
