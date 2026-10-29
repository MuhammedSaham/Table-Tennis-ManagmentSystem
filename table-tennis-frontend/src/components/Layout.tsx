import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import Hero from "./Hero";
import Logo from "../assets/LOGO.png";
import {
  HomeIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Layout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isReferee = user?.role === "REFEREE";
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.isSuperAdmin;

  // Navigation items based on role and permissions
  const navigation = [
    ...(isReferee
      ? [
          {
            name: "Referee Dashboard",
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
    { name: "Profile", href: "/app/profile", icon: UserCircleIcon },
  ];

  if (isSuperAdmin || hasPermission("MANAGE_USERS")) {
    navigation.push({ name: "Users", href: "/app/users", icon: UserGroupIcon });
  }

  if (isSuperAdmin || hasPermission("MANAGE_CLUB_MEMBERSHIPS") || hasPermission("MANAGE_REGISTRATIONS")) {
    navigation.push({ name: "Admin Requests", href: "/app/admin-requests", icon: UserGroupIcon });
  }
  // Pages that should NOT show the navbar
  const isAuthPage = ["/login", "/register", "/reset-password"].includes(
    location.pathname,
  );

  const isItemActive = (href: string) => {
    if (href === "/app/dashboard") {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Navbar matching Hero / PublicLayout styling */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D3843] border-b border-white/10 shadow-md transition-all duration-300 w-full">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo - Identical to Hero navbar */}
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <img
                src={Logo}
                alt="Sam's College"
                className="w-10 h-10 object-contain rounded-lg"
              />
              <span className="font-bold text-xl text-white tracking-wide whitespace-nowrap slow-blink">
                SAM'S COLLEGE
              </span>
            </Link>

            {/* Desktop Navigation matching Hero / PublicLayout navbar */}
            {user && (
              <div className="hidden lg:flex items-center gap-5 xl:gap-7">
                {navigation.map((item) => {
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
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              {user && (
                <>
                  <NotificationBell />
                  <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-white/10">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-white whitespace-nowrap">
                        {user.firstName}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border whitespace-nowrap ${
                          user.role === "SUPER_ADMIN"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                            : "bg-[#4AEEFF]/20 text-[#4AEEFF] border-[#4AEEFF]/30"
                        }`}
                      >
                        {user.role === "SUPER_ADMIN" ? "SUPER ADMIN" : user.role}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-white/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-all shrink-0"
                      title="Logout"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}

              {/* Mobile hamburger menu button */}
              {user && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-xl text-white/80 hover:text-[#4AEEFF] hover:bg-white/10 border border-white/15 active:scale-95 transition-all"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <XMarkIcon className="w-6 h-6" />
                  ) : (
                    <Bars3Icon className="w-6 h-6" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

      </nav>

      {/* Mobile Slide-in Side Drawer (LMS Style) */}
      {user && (
        <>
          {/* Backdrop Overlay */}
          {/* Backdrop Overlay */}
          <div
            className={`fixed inset-0 top-20 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
              mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Modern Dropdown Panel */}
          <div
            className={`fixed top-20 left-0 right-0 z-50 bg-[#061D23]/95 backdrop-blur-xl border-b border-white/15 shadow-2xl transition-all duration-300 ease-in-out lg:hidden origin-top overflow-hidden ${
              mobileMenuOpen
                ? "max-h-[580px] opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            <div className="max-w-md mx-auto px-4 py-3.5 sm:px-6">
              {/* User Info Header inside dropdown */}
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="w-9 h-9 rounded-full bg-[#4AEEFF]/20 border border-[#4AEEFF]/40 flex items-center justify-center font-black text-white text-xs">
                  {user.firstName ? user.firstName[0].toUpperCase() : "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 mt-0.5 text-[9px] font-black uppercase tracking-wider rounded border whitespace-nowrap ${
                      user.role === "SUPER_ADMIN"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-[#4AEEFF]/20 text-[#4AEEFF] border-[#4AEEFF]/30"
                    }`}
                  >
                    {user.role === "SUPER_ADMIN" ? "SUPER ADMIN" : user.role}
                  </span>
                </div>
              </div>

              {/* Navigation links */}
              <div className="py-2.5 space-y-1 overflow-y-auto max-h-[300px]">
                {navigation.map((item) => {
                  const active = isItemActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all border ${
                        active
                          ? "bg-[#0a2f38] border-[#16515c] text-[#4AEEFF] font-bold shadow-inner"
                          : "border-transparent text-white/80 hover:bg-white/5 hover:text-white font-medium"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${active ? "text-[#4AEEFF]" : "text-white/60"}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom Sign Out */}
              <div className="pt-2.5 border-t border-white/10">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 w-full transition-all active:scale-95"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <main>
        {!user && location.pathname === "/" ? (
          <Hero />
        ) : (
          <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;
