import React, { useState, useEffect } from "react";
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isReferee = user?.role === "REFEREE";

  // Navigation items based on role
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
    { name: "Tournaments", href: "/app/tournaments", icon: TrophyIcon }, // Keep public
    /*{
      name: "My Registrations",
      href: "/app/my-registrations",
      icon: CalendarIcon,
    },
    { name: "My Matches", href: "/app/my-matches", icon: UserGroupIcon },*/
    { name: "Leaderboard", href: "/app/leaderboard", icon: ChartBarIcon }, // Keep public
    {
      name: "Global Rankings",
      href: "/app/global-leaderboard",
      icon: ChartBarIcon,
    }, // Keep public
    { name: "Profile", href: "/app/profile", icon: UserCircleIcon },
  ];

  if (user?.role === "ADMIN") {
    navigation.push({ name: "Users", href: "/app/users", icon: UserGroupIcon });
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#061D23] shadow-lg transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="app/dashboard" className="flex items-center gap-2 group">
              <img
                src={Logo}
                alt="Sam's College"
                className="w-10 h-10 object-contain rounded-lg"
              />
              <span className="font-bold text-xl text-white tracking-wide">
                SAM'S COLLEGE
              </span>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <div className="hidden md:flex items-center gap-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isItemActive(item.href)
                        ? "bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 font-bold"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Right section */}
            <div className="flex items-center gap-3">
              {user && (
                <>
                  <NotificationBell />
                  <div className="hidden md:flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {user.firstName}
                      </p>
                      <p className="text-xs text-gray-300">{user.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
                      title="Logout"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}

              {/* Mobile menu button */}
              {user && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white"
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

        {/* Mobile menu */}
        {mobileMenuOpen && user && (
          <div className="md:hidden bg-[#061D23] border-t border-[#0f2b33] shadow-lg animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isItemActive(item.href)
                      ? "bg-[#0099cc] text-black"
                      : "bg-[#4AEEFF] text-black hover:bg-[#80ffff]"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
              <div className="border-t pt-3 mt-3">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg w-full"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

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
