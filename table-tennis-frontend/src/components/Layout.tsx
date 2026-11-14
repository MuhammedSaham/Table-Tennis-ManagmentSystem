import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import Hero from "./Hero";
import invertedLogo from "../assets/Logo  with Name inverted.png";
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
  BookOpenIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

const Layout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isReferee = user?.role === "REFEREE";
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.isSuperAdmin;

  // Desktop navigation items (Profile accessed via top-right pill)
  const desktopNavigation = isReferee
    ? [
        {
          name: "My Matches",
          href: "/app/referee/matches",
          icon: HomeIcon,
        },
        { name: "Tournaments", href: "/app/tournaments", icon: TrophyIcon },
        { name: "Players", href: "/app/players", icon: UserGroupIcon },
      ]
    : [
        {
          name: "Dashboard",
          href: "/app/dashboard",
          icon: HomeIcon,
        },
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
    desktopNavigation.push({ name: "Admin Requests", href: "/app/admin-requests", icon: UserGroupIcon });
  }

  // Mobile navigation items (Explicitly includes Profile for quick access)
  const mobileNavigation = isReferee
    ? [
        {
          name: "My Matches",
          href: "/app/referee/matches",
          icon: HomeIcon,
        },
        { name: "Tournaments", href: "/app/tournaments", icon: TrophyIcon },
        { name: "Players", href: "/app/players", icon: UserGroupIcon },
        { name: "My Profile", href: "/app/profile", icon: UserCircleIcon },
      ]
    : [
        {
          name: "Dashboard",
          href: "/app/dashboard",
          icon: HomeIcon,
        },
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
    mobileNavigation.push({ name: "Admin Requests", href: "/app/admin-requests", icon: UserGroupIcon });
  }

  if (isSuperAdmin || user?.role === "ADMIN") {
    mobileNavigation.push({ name: "Manage About Page", href: "/app/admin/about", icon: PencilSquareIcon });
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
    <div className="min-h-screen bg-[#061D23] text-white flex flex-col w-full overflow-x-hidden max-w-full print:bg-white print:min-h-0 print:p-0 print:m-0 print:overflow-visible">
      {/* Modern Responsive Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0D3843] border-b border-white/10 shadow-md transition-all duration-300 w-full no-print print:hidden">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center group shrink-0 transition-transform duration-200 active:scale-95"
              aria-label="Sam's College Home"
            >
              <img
                src={invertedLogo}
                alt="Sam's College"
                className="h-12 sm:h-16 lg:h-[70px] w-auto object-contain slow-blink py-0.5"
              />
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
                      className={`text-sm lg:text-[15px] whitespace-nowrap transition-colors duration-200 ${
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
                  {isReferee && (
                    <div className="hidden md:flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        On Duty
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowRulesModal(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#4AEEFF]/40 text-xs font-bold text-white hover:text-[#4AEEFF] transition-all cursor-pointer shadow-sm active:scale-95"
                        title="ITTF Official Table Tennis Rules"
                      >
                        <BookOpenIcon className="w-3.5 h-3.5 text-[#4AEEFF]" />
                        <span className="hidden xl:inline">ITTF Rules</span>
                      </button>
                    </div>
                  )}
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
            className={`fixed top-16 sm:top-20 left-0 right-0 z-40 bg-[#061D23]/98 backdrop-blur-2xl border-b border-white/15 shadow-2xl transition-all duration-300 ease-in-out lg:hidden origin-top overflow-hidden ${
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

              {/* Referee Quick Rules (Mobile) */}
              {isReferee && (
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowRulesModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-[#4AEEFF] bg-[#4AEEFF]/10 hover:bg-[#4AEEFF]/20 rounded-xl border border-[#4AEEFF]/30 transition-all active:scale-95"
                  >
                    <BookOpenIcon className="w-4 h-4 text-[#4AEEFF]" />
                    ITTF Official Rules
                  </button>
                </div>
              )}

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
      <main className="flex-1 w-full overflow-x-hidden print:overflow-visible print:p-0 print:m-0">
        {!user && location.pathname === "/" ? (
          <Hero />
        ) : (
          <div className="pt-16 sm:pt-20 w-full print:pt-0 print:p-0">
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

      {/* ITTF Official Rules Quick Modal (Global for Referees) */}
      {showRulesModal &&
        createPortal(
          <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex justify-center items-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 no-print print:hidden">
            <div className="bg-[#061D23]/95 border border-[#4AEEFF]/40 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5 text-[#4AEEFF]" />
                  <h3 className="text-base font-black uppercase tracking-wider text-white">
                    ITTF Quick Officiating Reference
                  </h3>
                </div>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5 text-xs leading-relaxed text-slate-300">
                <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                  <p className="font-bold uppercase text-[11px] text-[#4AEEFF]">
                    1. The Service (ITTF Law 2.6)
                  </p>
                  <p>
                    The ball must rest freely on the palm of the free hand (above
                    table level and behind the end line). It must be thrown near
                    vertically upwards at least 16 cm without adding spin, and
                    struck as it descends.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                  <p className="font-bold uppercase text-[11px] text-[#4AEEFF]">
                    2. Scoring & Deuce (ITTF Law 2.11)
                  </p>
                  <p>
                    A game is won by the first player scoring 11 points, unless
                    both players score 10 points (deuce). At 10-10, the server
                    alternates after every single point, and a player must achieve
                    a 2-point lead to win.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                  <p className="font-bold uppercase text-[11px] text-[#4AEEFF]">
                    3. Change of Ends (ITTF Law 2.13)
                  </p>
                  <p>
                    Players swap sides after each game. In the deciding final game
                    (Game 3 in best of 3, or Game 5 in best of 5), players must
                    change ends immediately when either player reaches 5 points.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                  <p className="font-bold uppercase text-[11px] text-[#4AEEFF]">
                    4. Timeouts & Towelling
                  </p>
                  <p>
                    Each player is entitled to ONE 1-minute timeout per match.
                    Towelling is permitted only every 6 points from the start of
                    each game, and at the change of ends in the final game.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="rounded-xl bg-[#4AEEFF] px-5 py-2 text-xs font-black uppercase tracking-wider text-[#061D23] hover:bg-white transition-all shadow-md active:scale-95"
                >
                  Close Reference
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Layout;
