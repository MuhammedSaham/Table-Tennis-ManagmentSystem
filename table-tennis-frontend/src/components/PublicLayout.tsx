import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import invertedLogo from "../assets/Logo  with Name inverted.png";
import FooterImage from "../assets/footerimg.png";
import UserNavProfile from "./UserNavProfile";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  InformationCircleIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ChevronRightIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const PublicLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isTournamentRoute = location.pathname.startsWith("/tournaments");
  const wrapperBgClass = isTournamentRoute ? "bg-gradient-to-r from-[#061D23] via-[#12679E] to-[#4AEEFF]" : "bg-transparent";

  const navigation = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "About", href: "/about", icon: InformationCircleIcon },
    { name: "Tournaments", href: "/tournaments", icon: TrophyIcon },
    { name: "Players", href: "/players", icon: UserGroupIcon },
    { name: "Leaderboard", href: "/leaderboard", icon: ChartBarIcon },
    { name: "Global Rankings", href: "/global-leaderboard", icon: GlobeAltIcon },
  ];

  const isItemActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return (
      location.pathname === href ||
      location.pathname.startsWith(href + "/")
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${wrapperBgClass} w-full overflow-x-hidden max-w-full`}>
      {/* Navbar - Solid Consistent Dark Petrol Teal */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D3843] border-b border-white/10 shadow-md transition-all duration-300 w-full">
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

            {/* Desktop Navigation matching Figma reference */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navigation.map((item) => {
                const isActive = isItemActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm lg:text-[15px] transition-colors duration-200 ${
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

            {/* Right section matching Figma reference */}
            <div className="flex items-center gap-3 sm:gap-4">
              {user ? (
                <div className="hidden lg:block">
                  <UserNavProfile />
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-5">
                  <Link
                    to="/login"
                    className="text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs sm:text-sm font-medium text-white transition-all"
                  >
                    <span>Get Started</span>
                    <span>→</span>
                  </Link>
                </div>
              )}

              {/* Mobile menu button matching Figma mobile reference */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium p-1.5"
                aria-label="Toggle menu"
              >
                <span>Menu</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-5 h-5" />
                ) : (
                  <Bars3Icon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Modern Compact Mobile Navigation (Attached directly to top navbar) */}
      <>
        {/* Backdrop Overlay */}
        <div
          className={`fixed inset-0 top-16 sm:top-20 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Modern Dropdown Panel */}
        <div
          className={`fixed top-16 sm:top-20 left-0 right-0 z-50 bg-[#0D3843]/95 backdrop-blur-xl border-b border-white/15 shadow-2xl transition-all duration-300 ease-in-out lg:hidden origin-top overflow-hidden ${
            mobileMenuOpen
              ? "max-h-[540px] opacity-100 translate-y-0"
              : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="max-w-md mx-auto px-4 py-3.5 sm:px-6">
            {/* Navigation links with icons & active indicators */}
            <div className="space-y-1">
              {navigation.map((item) => {
                const active = isItemActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all border ${
                      active
                        ? "bg-[#7DC6C7]/20 border-[#7DC6C7]/40 text-[#7DC6C7] font-bold shadow-[0_0_12px_rgba(125,198,199,0.15)]"
                        : "border-transparent text-slate-200 hover:bg-white/10 hover:text-white font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-colors ${active ? "text-[#7DC6C7]" : "text-white/70 group-hover:text-white"}`} />
                      <span>{item.name}</span>
                    </div>
                    {active ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7DC6C7] shadow-[0_0_8px_#7DC6C7]" />
                    ) : (
                      <ChevronRightIcon className="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Bottom Actions - compact grid right below links */}
            <div className="pt-3 mt-2 border-t border-white/10">
              {user ? (
                <Link
                  to="/app/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full rounded-xl bg-[#7DC6C7] px-4 py-2.5 text-sm font-black text-[#0A262D] text-center shadow-md shadow-black/20 hover:bg-[#8ee1e2] transition-all"
                >
                  Go to Dashboard →
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl border border-white/20 bg-[#104350] hover:bg-[#154f5f] px-3 py-2.5 text-xs sm:text-sm font-bold text-white text-center transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl bg-[#7DC6C7] hover:bg-[#8ee1e2] px-3 py-2.5 text-xs sm:text-sm font-black text-[#0A262D] text-center shadow-md shadow-black/20 transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </>

      {/* Main content */}
      <main className={`flex-1 ${isTournamentRoute ? "bg-gradient-to-r from-[#061D23] via-[#12679E] to-[#4AEEFF]" : "bg-transparent"} w-full overflow-x-hidden`}>
        <div className="pt-16 sm:pt-20">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative text-white overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(6, 29, 35, 0.86), rgba(18, 103, 158, 0.78)), url(${FooterImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: '#061D23', opacity: 0.62, zIndex: 0 }} />
        </div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16 py-12" style={{ position: 'relative', zIndex: 2 }}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
            <div className="md:col-span-3">
              <Link
                to="/"
                className="inline-block mb-4 slow-blink transition-transform duration-200 active:scale-95 group"
                aria-label="Sam's College Home"
              >
                <img
                  src={invertedLogo}
                  alt="Sam's College"
                  className="h-12 sm:h-14 lg:h-16 w-auto object-contain"
                />
              </Link>
              <p className="font-script text-white text-lg tracking-wide">
                Where education meets opportunities
              </p>
            </div>
            <div className="md:col-span-3">
              <h4 className="font-bold text-lg text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white">
                <li>
                  <Link
                    to="/tournaments"
                    className="text-white hover:text-[#4AEEFF] transition"
                  >
                    Tournaments
                  </Link>
                </li>
                <li>
                  <Link
                    to="/leaderboard"
                    className="text-white hover:text-[#4AEEFF] transition"
                  >
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/global-leaderboard"
                    className="text-white hover:text-[#4AEEFF] transition"
                  >
                    Global Rankings
                  </Link>
                </li>
                <li>
                  <Link to="/players" className="text-white hover:text-[#4AEEFF] transition">
                    Players
                  </Link>
                </li>
              </ul>
            </div>
            <div className="md:col-span-3">
              <h4 className="font-bold text-lg text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-white">
                <li className="flex items-start gap-3 text-xs leading-relaxed text-white">
                  <MapPinIcon className="h-5 w-5 shrink-0 text-white" aria-hidden="true" />
                  <span>Broody front lane, Jaffna, Sri Lanka, 40000</span>
                </li>
                <li>
                  <a href="tel:+94755711174" className="text-white hover:text-[#4AEEFF] transition">
                    <span className="flex items-center gap-3">
                      <PhoneIcon className="h-5 w-5 shrink-0 text-white" aria-hidden="true" />
                      <span>+94 75 571 1174</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a href="mailto:samscollegeofficial@gmail.com" className="text-white hover:text-[#4AEEFF] transition">
                    <span className="flex items-center gap-3">
                      <EnvelopeIcon className="h-5 w-5 shrink-0 text-white" aria-hidden="true" />
                      <span>samscollegeofficial@gmail.com</span>
                    </span>
                  </a>
                </li>
              </ul>
            </div>
            <div className="md:col-span-3 md:pl-6 lg:pl-10">
              <h4 className="font-bold text-lg text-white mb-4">Follow Us</h4>
              <div className="flex items-center gap-4">
                <div>
                  <a
                    href="https://www.facebook.com/profile.php?id=61557498952975"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex items-center text-white hover:text-[#4AEEFF] transition-colors"
                  >
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                </div>
                <div>
                  <a
                    href="https://www.instagram.com/samscollege_official?igsh=NHR2cmk0a29nNDB3"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex items-center text-white hover:text-[#4AEEFF] transition-colors"
                  >
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.117.6c-.798.272-1.548.645-2.123 1.22-.576.575-.948 1.325-1.22 2.123-.267.788-.468 1.658-.528 2.936C.008 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.528 2.936.272.798.644 1.548 1.22 2.123.575.576 1.325.948 2.123 1.22.788.267 1.658.468 2.936.528 1.28.06 1.687.072 4.947.072s3.667-.015 4.947-.072c1.277-.06 2.148-.261 2.936-.528.798-.272 1.548-.644 2.123-1.22.576-.575.948-1.325 1.22-2.123.267-.788.468-1.658.528-2.936.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.261-2.148-.528-2.936-.272-.798-.644-1.548-1.22-2.123-.575-.576-1.325-.948-2.123-1.22-.788-.267-1.658-.468-2.936-.528C15.667.008 15.26 0 12 0zm0 2.16c3.203 0 3.585.009 4.849.07 1.171.054 1.805.244 2.227.408.561.217.96.477 1.382.896.419.42.679.821.896 1.381.164.422.354 1.057.408 2.227.061 1.264.07 1.646.07 4.849s-.009 3.585-.07 4.849c-.054 1.171-.244 1.805-.408 2.227-.217.561-.477.96-.896 1.382-.42.419-.821.679-1.381.896-.422.164-1.057.354-2.227.408-1.264.061-1.646.07-4.849.07s-3.585-.009-4.849-.07c-1.171-.054-1.805-.244-2.227-.408-.561-.217-.96-.477-1.382-.896-.419-.42-.679-.821-.896-1.381-.164-.422-.354-1.057-.408-2.227-.061-1.264-.07-1.646-.07-4.849s.009-3.585.07-4.849c.054-1.171.244-1.805.408-2.227.217-.561.477-.96.896-1.382.42-.419.821-.679 1.381-.896.422-.164 1.057-.354 2.227-.408 1.264-.061 1.646-.07 4.849-.07z" />
                      <circle cx="12" cy="12" r="3.305" />
                      <circle cx="18.513" cy="5.487" r=".773" />
                    </svg>
                  </a>
                </div>
                <div>
                  <a
                    href="https://wa.me/94755711174"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="flex items-center text-white hover:text-[#4AEEFF] transition-colors"
                  >
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/70">
            © 2026 Table Tennis Tournament Management System. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
