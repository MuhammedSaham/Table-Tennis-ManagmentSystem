import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoWithName from "../assets/LOGO.png";

import {
  Bars3Icon,
  XMarkIcon,
  MapPinIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

const PublicLayout: React.FC = () => {
  const { user } = useAuth();
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

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Tournaments", href: "/tournaments" },
    { name: "Players", href: "/players" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Global Rankings", href: "/global-leaderboard" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
         
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src={logoWithName}
                alt="Sam's College Logo"
                className="object-contain"
                style={{ height: "40px", width: "auto" }}
              />
              <span className="text-2xl font-extrabold tracking-wider">SAM'S COLLEGE</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.href
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3">
              {user ? (
                <Link to="/app/dashboard" className="btn-primary text-sm py-2">
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition"
                  >
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary text-sm py-2">
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
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
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    location.pathname === item.href
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-100"
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
                      className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-sm font-medium bg-white text-primary-700 rounded-lg text-center shadow-sm"
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
      <main>
        <div className="pt-16">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark-100 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            {/* Logo + Description */}
            <div>
              <div className="flex items-center mb-4">
                
          
                <img
                  src={logoWithName}
                  alt="Sam's College Logo"
                  className="object-contain"
                  style={{
                    height: "auto",
                    width: "100%",
                    maxWidth: "220px",
                  }}
                />
              </div>
                  
              <div>
                <p className="text-gray-400 text-sm">
                  Professional Table Tennis Tournament Management System for clubs and organizations.
                </p>
              </div>
              
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/app/tournaments" className="hover:text-white transition">
                    Tournaments
                  </Link>
                </li>
                <li>
                  <Link to="/app/leaderboard" className="hover:text-white transition">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link to="/app/dashboard" className="hover:text-white transition">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="tel:+94755711174" className="hover:text-white transition">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="tel:+94755711174" className="hover:text-white transition">
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


            {/* Contact + Social */}
            <div>
              <h4 className="font-semibold text-white mb-4">Get In Touch</h4>
              <ul className="space-y-3 text-sm text-gray-400">

                {/* Phone */}
                <li className="flex items-center gap-2">
                  <PhoneIcon className="w-5 h-5 flex-shrink-0" />
                  <a href="tel:+94755711174" className="hover:text-white transition">
                    +94 75 571 1174
                  </a>
                </li>

                {/* Facebook */}
                <li className="flex items-center gap-2">
                  <span>📘</span>
                  <a
                    href="https://www.facebook.com/profile.php?id=61557498952975"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition"
                  >
                    Facebook
                  </a>
                </li>

                {/* Instagram */}
                <li className="flex items-center gap-2">
                  <span>📸</span>
                  <a
                    href="https://www.instagram.com/samscollege_official?igsh=NHR2cmk0a29nNDB3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition"
                  >
                    Instagram
                  </a>
                </li>

                {/* WhatsApp */}
                <li className="flex items-center gap-2">
                  <span>💬</span>
                  <a
                    href="https://wa.me/94755711174"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition"
                  >
                    WhatsApp
                  </a>
                </li>

                {/* Email */}
                <li className="flex items-center gap-2">
                  <span>✉️</span>
                  <a
                    href="mailto:samscollegeofficial@gmail.com"
                    className="hover:text-white transition"
                  >
                    samscollegeofficial@gmail.com
                  </a>
                </li>

                {/* Address */}
                <li className="flex items-start gap-2">
                  <MapPinIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Broody front lane, Jaffna, Sri Lanka, 40000</span>
                </li>

              </ul>
            </div>

          </div>

          {/* Bottom */}
          
          <div className="border-t border-dark-200 mt-8 pt-8 text-center text-sm text-gray-500">
            © 2024 Table Tennis Tournament Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;