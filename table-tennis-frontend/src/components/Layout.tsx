import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import Hero from "./Hero";
import Logo from "../assets/LOGO.png";
import LogoutModal from "./LogoutModal";
import UserNavProfile from "./UserNavProfile";
import { getProfileImageUrl } from "../services/api";
import {
  HomeIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const Layout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isReferee = user?.role === "REFEREE";
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.isSuperAdmin;

  // Desktop navigation items (Profile accessed via top-right pill)
  const desktopNavigation = [
    ...(isReferee
      ? [
          {
            name: "Dashboard",
            href: "/app/referee/matches",
            icon: HomeIcon,
          },
        ]
      : [
          {
            name: "Dashboard",
            href: "/app/dashboard",
            icon: HomeIcon,
          },
        ]),
    { name: "Tournaments", href: "/app/tournaments", icon: TrophyIcon },
    { name: "Leaderboard", href: "/app/leaderboard", icon: ChartBarIcon },
    {
      name: "Global Rankings",
      href: "/app/global-leaderboard",
      icon: ChartBarIcon,
    },
  ];

  if (isSuperAdmin || hasPermission("MANAGE_USERS")) {
    desktopNavigation.push({ name: "Users", href: "/app/users", icon: UserGroupIcon });
  }

  if (isSuperAdmin || hasPermission("MANAGE_CLUB_MEMBERSHIPS") || hasPermission("MANAGE_REGISTRATIONS")) {
    desktopNavigation.push({ name: "Requests", href: "/app/admin-requests", icon: UserGroupIcon });
  }

  // Mobile navigation items (Explicitly includes Profile for quick access)
  const mobileNavigation = [
    ...(isReferee
      ? [
          {
            name: "Dashboard",
            href: "/app/referee/matches",
            icon: HomeIcon,
          },
        ]
      : [
          {
            name: "Dashboard",
            href: "/app/dashboard",
            icon: HomeIcon,
          },
        ]),
    { name: "Tournaments", href: "/app/tournaments", icon: TrophyIcon },
    { name: "Leaderboard", href: "/app/leaderboard", icon: ChartBarIcon },
    {
      name: "Global Rankings",
      href: "/app/global-leaderboard",
      icon: ChartBarIcon,
    },
    { name: "My Profile", href: "/app/profile", icon: UserCircleIcon },
  ];

  if (isSuperAdmin || hasPermission("MANAGE_USERS")) {
    mobileNavigation.push({ name: "Users Directory", href: "/app/users", icon: UserGroupIcon });
  }

  if (isSuperAdmin || hasPermission("MANAGE_CLUB_MEMBERSHIPS") || hasPermission("MANAGE_REGISTRATIONS")) {
    mobileNavigation.push({ name: "Requests", href: "/app/admin-requests", icon: UserGroupIcon });
  }

  // Pages that should NOT show the navbar
  const isAuthPage = ["/login", "/register", "/reset-password"].includes(
    location.pathname,
  );

  const isItemActive = (href: string) => {
    if (href === "/app/dashboard" || href === "/app/referee/matches") {
      return location.pathname === href;
    }
    return (
      location.pathname === href ||
      location.pathname.startsWith(href + "/")
    );
  };

  if (isAuthPage) {
    return <Outlet />;
  }

  const roleBadgeText =
    user?.role === "SUPER_ADMIN"
      ? "Super Admin"
      : user?.role === "ADMIN"
      ? "Admin"
      : user?.role === "REFEREE"
      ? "Referee"
      : "Player";

  return (
    <div className="min-h-screen bg-[#061D23] text-white flex flex-col w-full overflow-x-hidden max-w-full">
      {/* Modern Responsive Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D3843] border-b border-white/10 shadow-md transition-all duration-300 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link
              to={isReferee ? "/app/referee/matches" : "/app/dashboard"}
              className="flex items-center gap-2 group shrink-0"
            >
              <img
                src={Logo}
                alt="Sam's College"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg shadow-sm"
              />
              <span className="font-extrabold text-base sm:text-xl text-white tracking-wide whitespace-nowrap slow-blink">
                SAM'S COLLEGE
              </span>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <div className="hidden lg:flex items-center gap-5 xl:gap-7">
                {desktopNavigation.map((item) => {
                  const isActive = isItemActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`text-sm whitespace-nowrap transition-colors duration-200 ${
                        isActive
                          ? "text-white font-bold"
                          : "text-slate-300 hover:text-white font-medium"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Right section */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {user && (
                <>
                  <NotificationBell />
                  <div className="hidden lg:block">
                    <UserNavProfile />
                  </div>
                </>
              )}

              {/* Mobile hamburger menu button */}
              {user && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-1.5 sm:p-2 rounded-xl text-white/90 hover:text-[#4AEEFF] hover:bg-white/10 border border-white/15 active:scale-95 transition-all"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-in Side Drawer */}
      {user && (
        <>
          {/* Backdrop Overlay */}
          <div
            className={`fixed inset-0 top-16 sm:top-20 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
              mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Modern Mobile Navigation Drawer Panel */}
          <div
            className={`fixed top-16 sm:top-20 left-0 right-0 z-50 bg-[#061D23]/98 backdrop-blur-2xl border-b border-white/15 shadow-2xl transition-all duration-300 ease-in-out lg:hidden origin-top overflow-hidden ${
              mobileMenuOpen
                ? "max-h-[85vh] opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-3 pointer-events-none"
            }`}
          >
            <div className="max-w-md mx-auto px-4 py-4 sm:px-6 space-y-4">
              {/* User Profile Header Card */}
              <Link
                to="/app/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-gradient-to-r from-white/[0.08] to-white/[0.02] border border-white/15 hover:border-[#4AEEFF]/50 transition-all group"
              >
                {/* Avatar with image or gradient fallback */}
                {user.profileImage ? (
                  <img
                    src={getProfileImageUrl(user.profileImage)}
                    alt={user.firstName}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-[#4AEEFF]/50 shadow-md shrink-0 bg-[#061D23]"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#0b333c] via-[#12679E] to-[#4AEEFF] text-white flex items-center justify-center font-extrabold text-sm ring-2 ring-[#4AEEFF]/50 shadow-md shrink-0">
                    {user.firstName ? user.firstName[0].toUpperCase() : "U"}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-white group-hover:text-[#4AEEFF] transition-colors truncate">
                    {user.firstName} {user.lastName || ""}
                  </p>
                  <p className="text-[11px] text-white/60 truncate font-mono">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full border ${
                        isSuperAdmin
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-[#4AEEFF]/20 text-[#4AEEFF] border-[#4AEEFF]/40"
                      }`}
                    >
                      <ShieldCheckIcon className="w-3 h-3" />
                      {roleBadgeText}
                    </span>
                    <span className="text-[10px] text-[#4AEEFF]/80 font-bold ml-auto group-hover:translate-x-0.5 transition-transform">
                      View Profile →
                    </span>
                  </div>
                </div>
              </Link>

              {/* Navigation Links */}
              <div className="space-y-1 overflow-y-auto max-h-[calc(85vh-200px)] pr-1">
                {mobileNavigation.map((item) => {
                  const active = isItemActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all border ${
                        active
                          ? "bg-[#4AEEFF]/15 border-[#4AEEFF]/40 text-[#4AEEFF] font-bold shadow-[0_0_15px_rgba(74,238,255,0.12)]"
                          : "border-transparent text-white/80 hover:bg-white/5 hover:text-white font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            active
                              ? "bg-[#4AEEFF]/25 text-[#4AEEFF]"
                              : "bg-white/5 text-white/70"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{item.name}</span>
                      </div>
                      <ChevronRightIcon
                        className={`w-3.5 h-3.5 transition-transform ${
                          active
                            ? "text-[#4AEEFF] translate-x-0.5"
                            : "text-white/30"
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>

              {/* Bottom Sign Out Button */}
              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/30 transition-all active:scale-95"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 text-rose-300" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main content with proper top navbar offset */}
      <main className="flex-1 w-full overflow-x-hidden">
        {!user && location.pathname === "/" ? (
          <Hero />
        ) : (
          <div className="pt-16 sm:pt-20 w-full">
            <Outlet />
          </div>
        )}
      </main>

      {/* Logout Confirmation Dialog */}
      {user && (
        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
          userName={`${user.firstName} ${user.lastName || ""}`}
          userRole={user.role}
        />
      )}
    </div>
  );
};

export default Layout;
