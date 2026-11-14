import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfileImageUrl } from "../services/api";
import LogoutModal from "./LogoutModal";
import ChangePasswordModal from "./ChangePasswordModal";
import {
  UserCircleIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

export const UserNavProfile: React.FC = () => {
  const { user, logout, refetchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync latest user profile on mount to guarantee fresh profileImage
  useEffect(() => {
    refetchUser().catch(() => {});
  }, []);

  // Close dropdown on route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!user) return null;

  const handleLogoutConfirm = () => {
    logout();
    navigate("/");
  };

  const isSuperAdmin = user.role === "SUPER_ADMIN" || user.isSuperAdmin;
  const userInitials = user.firstName ? user.firstName[0].toUpperCase() : "U";

  // Avatar rendering helper
  const renderAvatar = (size: "sm" | "lg") => {
    const sizeClasses =
      size === "sm"
        ? "w-8 h-8 rounded-full ring-2 ring-[#4AEEFF]/40"
        : "w-12 h-12 rounded-full ring-2 ring-[#4AEEFF]/60";

    if (user.profileImage && !imageError) {
      return (
        <img
          src={getProfileImageUrl(user.profileImage)}
          alt={user.firstName}
          className={`${sizeClasses} object-cover bg-[#061D23] shrink-0 shadow-sm transition-all`}
          onError={() => setImageError(true)}
        />
      );
    }

    // Modern styled avatar fallback with sports gradient & initials
    return (
      <div
        className={`${sizeClasses} bg-gradient-to-tr from-[#0b333c] via-[#12679E] to-[#4AEEFF] text-white flex items-center justify-center font-extrabold shadow-md shrink-0 select-none ${
          size === "sm" ? "text-xs" : "text-base"
        }`}
      >
        <span>{userInitials}</span>
      </div>
    );
  };

  const roleBadgeText =
    user.role === "SUPER_ADMIN"
      ? "Super Admin"
      : user.role === "ADMIN"
      ? "Admin"
      : user.role === "REFEREE"
      ? "Referee"
      : "Player";

  return (
    <>
      <div className="relative inline-block text-left" ref={menuRef}>
        {/* Luxury Glassmorphic Profile Pill Trigger */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className={`group flex items-center gap-2 rounded-full p-1 sm:pl-1.5 sm:pr-3 sm:py-1 border transition-all duration-200 active:scale-95 focus:outline-none ${
            menuOpen
              ? "bg-[#061D23] border-[#4AEEFF] shadow-[0_0_15px_rgba(74,238,255,0.25)]"
              : "bg-white/[0.08] hover:bg-white/[0.14] border-white/15 hover:border-[#4AEEFF]/50 shadow-sm"
          }`}
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          {/* Circular Avatar */}
          {renderAvatar("sm")}

          {/* Name & Role Text - Hidden on mobile, visible on sm and up */}
          <div className="hidden sm:flex flex-col text-left leading-tight py-0.5">
            <span className="text-xs font-bold text-white group-hover:text-[#4AEEFF] transition-colors truncate max-w-[90px] md:max-w-[130px]">
              {user.firstName}
            </span>
            <span
              className={`text-[8.5px] font-black uppercase tracking-wider ${
                isSuperAdmin
                  ? "text-amber-300"
                  : "text-[#4AEEFF]"
              }`}
            >
              {roleBadgeText}
            </span>
          </div>

          {/* Subtle Rotating Chevron - Hidden on mobile, visible on sm and up */}
          <ChevronDownIcon
            className={`hidden sm:block w-3.5 h-3.5 text-white/50 group-hover:text-[#4AEEFF] transition-transform duration-200 shrink-0 ml-0.5 ${
              menuOpen ? "rotate-180 text-[#4AEEFF]" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2.5 w-[calc(100vw-32px)] max-w-xs sm:w-72 rounded-2xl border border-white/20 bg-[#061D23]/95 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] p-2.5 z-50 origin-top-right transition-all animate-in fade-in zoom-in-95 duration-150">
            {/* User Details Header Card */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-white/[0.06] to-transparent border border-white/10 flex items-center gap-3 mb-2">
              {renderAvatar("lg")}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-white truncate leading-tight">
                  {user.firstName} {user.lastName || ""}
                </p>
                <p className="text-[11px] text-white/60 truncate font-mono mt-0.5">
                  {user.email}
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 text-[9px] font-extrabold uppercase tracking-wider rounded-full border ${
                    isSuperAdmin
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-[#4AEEFF]/20 text-[#4AEEFF] border-[#4AEEFF]/40"
                  }`}
                >
                  <ShieldCheckIcon className="w-3 h-3" />
                  {roleBadgeText}
                </span>
              </div>
            </div>

            {/* Menu Links */}
            <div className="space-y-0.5 py-1">
              <Link
                to="/app/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#4AEEFF]/15 group-hover:bg-[#4AEEFF]/25 flex items-center justify-center text-[#4AEEFF] transition-colors">
                  <UserCircleIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white group-hover:text-[#4AEEFF] transition-colors">
                    My Profile
                  </span>
                  <span className="text-[10px] text-white/40 font-normal">
                    View & update your credentials
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setShowPasswordModal(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all group text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-[#4AEEFF]/15 group-hover:bg-[#4AEEFF]/25 flex items-center justify-center text-[#4AEEFF] transition-colors">
                  <KeyIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white group-hover:text-[#4AEEFF] transition-colors">
                    Change Password
                  </span>
                  <span className="text-[10px] text-white/40 font-normal">
                    Update your account credentials
                  </span>
                </div>
              </button>

              {(isSuperAdmin || user.role === "ADMIN") && (
                <Link
                  to="/app/admin/about"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#4AEEFF]/15 group-hover:bg-[#4AEEFF]/25 flex items-center justify-center text-[#4AEEFF] transition-colors">
                    <PencilSquareIcon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white group-hover:text-[#4AEEFF] transition-colors">
                      Manage About Page
                    </span>
                    <span className="text-[10px] text-white/40 font-normal">
                      Update poster, story & hubs
                    </span>
                  </div>
                </Link>
              )}
            </div>

            {/* Logout Action */}
            <div className="pt-2 mt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 group-hover:bg-rose-500/25 flex items-center justify-center text-rose-300 transition-colors">
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                </div>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userEmail={user.email}
      />

      {/* Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        userName={`${user.firstName} ${user.lastName || ""}`}
        userRole={user.role}
      />
    </>
  );
};

export default UserNavProfile;
