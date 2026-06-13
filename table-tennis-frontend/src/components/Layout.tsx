import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import Hero from "./Hero";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Update navigation hrefs
  const navigation = [
    { name: "Dashboard", href: "/app/dashboard", icon: HomeIcon },
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
    navigation.push({
      name: "Admin Requests",
      href: "/app/admin-requests",
      icon: UserGroupIcon,
    });
    navigation.push({ name: "Users", href: "/app/users", icon: UserGroupIcon });
  }
  // Pages that should NOT show the navbar
  const isAuthPage = ["/login", "/register", "/reset-password"].includes(
    location.pathname,
  );

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="app/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-500 rounded-lg flex items-center justify-center transform transition-transform group-hover:scale-110">
                <span className="text-white text-xl font-bold">🏓</span>
              </div>
              <span className="font-bold text-xl font-heading bg-gradient-to-r from-primary-700 to-secondary-600 bg-clip-text text-transparent">
                TTMS
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
                      location.pathname === item.href
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName}
                      </p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition-colors"
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
                  className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
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
          <div className="md:hidden bg-white border-t shadow-lg animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-100"
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

      {/* Footer */}
      <footer className="bg-dark-100 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">🏓</span>
                </div>
                <span className="font-bold text-xl">TTMS</span>
              </div>
              <p className="text-gray-400 text-sm">
                Professional Table Tennis Tournament Management System for clubs
                and organizations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link
                    to="/app/tournaments"
                    className="hover:text-white transition"
                  >
                    Tournaments
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app/leaderboard"
                    className="hover:text-white transition"
                  >
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="app/dashboard"
                    className="hover:text-white transition"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Follow Us</h4>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 bg-dark-200 rounded-full flex items-center justify-center hover:bg-primary-600 transition"
                >
                  🐦
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-dark-200 rounded-full flex items-center justify-center hover:bg-primary-600 transition"
                >
                  📘
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-dark-200 rounded-full flex items-center justify-center hover:bg-primary-600 transition"
                >
                  📷
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-dark-200 mt-8 pt-8 text-center text-sm text-gray-500">
            © 2024 Table Tennis Tournament Management System. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
