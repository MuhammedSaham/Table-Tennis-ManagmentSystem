import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const PublicLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isTournamentRoute = location.pathname.startsWith("/tournaments");
  const wrapperBgClass = isTournamentRoute ? "bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900" : "bg-transparent";

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Tournaments", href: "/tournaments" },
    { name: "Players", href: "/players" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Global Rankings", href: "/global-leaderboard" },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${wrapperBgClass}`}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#061D23] shadow-lg transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-500 rounded-lg flex items-center justify-center transform transition-transform group-hover:scale-110">
                <span className="text-white text-xl font-bold">🏓</span>
              </div>
              <span className="font-bold text-xl font-heading bg-gradient-to-r from-primary-700 to-secondary-600 bg-clip-text text-transparent">
                TTMS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                    location.pathname === item.href
                      ? "bg-[#0099cc] text-black"
                      : "bg-[#4AEEFF] text-black hover:bg-[#80ffff]"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3">
              {user ? (
                <Link to="/app/dashboard" className="inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700">
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-500 hover:text-primary-700"
                  >
                    Sign In
                  </Link>
                  <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-[#4AEEFF] px-6 py-3 text-base font-semibold text-black shadow-sm transition hover:bg-[#80ffff]">
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-full text-slate-600 hover:bg-slate-100 transition"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#061D23] border-t border-[#0f2b33] shadow-lg animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    location.pathname === item.href
                      ? "bg-[#0099cc] text-black"
                      : "bg-[#4AEEFF] text-black hover:bg-[#80ffff]"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t pt-3 mt-3">
                {!user && (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 text-center transition hover:border-primary-500 hover:text-primary-700"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-full bg-[#4AEEFF] px-3 py-2 text-sm font-medium text-black text-center shadow-sm transition hover:bg-[#80ffff]"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className={`flex-1 ${isTournamentRoute ? "bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900" : "bg-transparent"}`}>
        <div className="pt-16">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#061D23] text-white">
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
                Professional Table Tennis Tournament Management System
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link
                    to="/tournaments"
                    className="hover:text-white transition"
                  >
                    Tournaments
                  </Link>
                </li>
                <li>
                  <Link
                    to="/leaderboard"
                    className="hover:text-white transition"
                  >
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/global-leaderboard"
                    className="hover:text-white transition"
                  >
                    Global Rankings
                  </Link>
                </li>
                <li>
                  <Link to="/players" className="hover:text-white transition">
                    Players
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

export default PublicLayout;
