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
      {/* Modern Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#061D23]/90 backdrop-blur-xl border-b border-white/10 shadow-lg transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src={Logo}
                alt="Sam's College"
                className="w-10 h-10 object-contain rounded-lg transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-bold text-lg sm:text-xl text-white tracking-wide slow-blink">
                SAM'S COLLEGE
              </span>
            </Link>

            {/* Desktop Navigation (visible on laptops/desktops) */}
            {user && (
              <div className="hidden lg:flex items-center gap-1.5">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isItemActive(item.href)
                        ? "bg-[#4AEEFF]/15 text-[#4AEEFF] border border-[#4AEEFF]/40 shadow-[0_0_15px_rgba(74,238,255,0.15)]"
                        : "text-white/70 hover:bg-white/10 hover:text-white border border-transparent"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Right section */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user && (
                <>
                  <NotificationBell />
                  <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-white/10">
                    <div className="text-right">
                      <p className="text-sm font-bold text-white leading-tight">
                        {user.firstName}
                      </p>
                      <span className={`inline-block px-2 py-0.5 mt-0.5 text-[10px] font-black uppercase tracking-wider rounded border ${
                        user.role === "SUPER_ADMIN"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-[#4AEEFF]/20 text-[#4AEEFF] border-[#4AEEFF]/30"
                      }`}>
                        {user.role === "SUPER_ADMIN" ? "SUPER ADMIN" : user.role}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-white/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-all"
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
          <div
            className={`fixed inset-0 z-[80] bg-black/80 backdrop-blur-md transition-opacity duration-300 lg:hidden ${
              mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Side Drawer Panel (Slides from Left - 100% Solid Opaque Background) */}
          <div
            style={{ backgroundColor: "#061D23" }}
            className={`fixed inset-y-0 left-0 z-[90] w-72 sm:w-80 bg-[#061D23] border-r border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:hidden ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Drawer Top Header with Close Button */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#04151a]">
                <div className="flex items-center gap-2">
                  <img
                    src={Logo}
                    alt="Sam's College"
                    className="w-8 h-8 object-contain rounded-md"
                  />
                  <span className="font-bold text-base text-white tracking-wide">
                    SAM'S COLLEGE
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl border border-amber-400/70 bg-amber-400/10 text-[#4AEEFF] hover:bg-amber-400/20 active:scale-95 transition-all"
                  title="Close drawer"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* User Info Header inside drawer */}
              <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4AEEFF]/20 border border-[#4AEEFF]/40 flex items-center justify-center font-black text-white text-sm">
                    {user.firstName ? user.firstName[0].toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <span className="inline-block px-2 py-0.5 mt-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/30">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation links (styled to match LMS side menu) */}
              <div className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-16rem)]">
                {navigation.map((item) => {
                  const active = isItemActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all border ${
                        active
                          ? "bg-[#0a2f38] border-[#16515c] text-[#4AEEFF] font-bold shadow-inner"
                          : "border-transparent text-white/80 hover:bg-white/5 hover:text-white font-medium"
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${active ? "text-[#4AEEFF]" : "text-white/60"}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Sign Out */}
            <div className="p-4 border-t border-white/10 bg-[#04151a]">
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 w-full transition-all active:scale-95"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Sign Out
              </button>
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
