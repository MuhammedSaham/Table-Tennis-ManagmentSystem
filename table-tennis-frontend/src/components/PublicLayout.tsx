import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../assets/LOGO.png";
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
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <img
                src={Logo}
                alt="Sam's College"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg"
              />
              <span className="font-extrabold text-base sm:text-xl text-white tracking-wide slow-blink whitespace-nowrap">
                SAM'S COLLEGE
              </span>
            </Link>

            {/* Desktop Navigation matching Figma reference */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navigation.map((item) => {
                const isActive = isItemActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm transition-colors duration-200 ${
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
                aria-label="Go to home"
                className="flex items-center gap-2 mb-4 slow-blink"
              >
                <img
                  src={Logo}
                  alt="Sam's College"
                  className="w-10 h-10 object-contain rounded-lg"
                />
                <span className="font-bold text-xl text-white">SAM'S COLLEGE</span>
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
                      <path d="M17.6915026,13.4744748 C17.5157041,13.4744748 17.3399056,13.4744748 17.1424051,13.3968957 C16.6291024,13.2640027 16.1158007,13.0685848 15.602298,12.5592849 C15.3385941,12.3274922 15.0749903,12.0956995 14.8113864,11.8639068 C14.1305673,11.2406722 13.4497483,10.6174376 12.8359148,9.90477573 C12.7025385,9.75150862 12.6357972,9.53572205 12.7691735,9.35519975 C12.9449721,9.13604949 13.1207706,8.94337449 13.2633337,8.75069948 C13.5269335,8.37900411 13.7905335,8.00730874 13.8573765,7.56574359 C13.9242199,7.05204654 13.6605201,6.65028015 13.3401759,6.16914082 C13.1276316,5.84687696 12.9150875,5.50149476 12.6348069,5.2437622 C12.0877148,4.69899462 11.4066985,4.69899462 10.8595956,5.2437622 C10.3456908,5.74812181 10.1331493,6.53969766 10.1331493,7.28597827 C10.1331493,8.56191565 10.5600308,9.8376225 11.3451359,10.9345729 C12.0209166,11.8302094 12.8359148,12.4535187 13.7907264,13.0768497 C14.7455168,13.7001806 15.8007165,14.1082739 16.9231556,14.2411669 C17.3502742,14.3187889 17.7773926,14.3187889 18.2047085,14.2411669 C19.0196977,14.1082739 19.8015082,13.8700127 20.4478251,13.2772739 C20.8747337,12.9318869 21.0571312,12.3823151 20.8449196,11.8984359 C20.7782827,11.7218134 20.6450055,11.6130104 20.4951893,11.5342054 L20.4951893,11.5342054 C20.2984842,11.4240859 20.0351295,11.2815961 19.72456,11.5350068 C19.2579389,11.9834032 18.9375205,12.0829196 18.3903969,12.0829196 C17.4340161,12.0829196 16.5127894,11.5074275 15.9657042,10.8584153 C15.4185836,10.2094032 14.9316639,9.67813865 14.8643108,8.75069948 C14.797053,7.7748566 15.4187661,6.79346444 16.4610778,6.79346444 C16.8882259,6.79346444 17.3151075,6.87408537 17.675721,7.05204654 C17.9393211,7.17000947 18.2028205,7.28905509 18.4003326,7.36977055 C18.7207024,7.53148882 19.0411707,7.76314126 19.2987827,7.43932161 C19.4077934,7.30903775 19.4746344,7.17865402 19.5414753,7.04827 C19.7390845,6.66530898 19.936694,6.29160883 20.066953,5.82181694 C20.235253,5.12320633 20.4130124,4.29635993 19.8659048,3.70268046 C19.3190015,3.14124822 18.2755768,2.87352491 17.5896509,2.73618039 C16.5139396,2.52038381 15.4383345,2.49999923 14.3625169,2.60000876 C12.3758858,2.80812995 10.4214706,3.68023823 9.06841624,5.23253018 C7.71504948,6.78482214 6.95640755,8.87815905 6.95640755,11.021501 C6.95640755,12.8139861 7.49322226,14.4844221 8.36826147,15.8734908 C9.24330068,17.2625595 10.5262819,18.2991191 12.0481833,18.8815281 C12.7313025,19.1392606 13.4145214,19.3009496 14.0975328,19.3936937 C14.7802317,19.4865377 15.4630262,19.5103223 16.1457251,19.4645328 C18.1323562,19.3297797 20.0871689,18.5087249 21.4406275,17.1655925 C22.7940861,15.82246 23.5527485,14.0301657 23.6199027,12.2376741 C23.6537797,11.3461812 23.5202062,10.454688 23.2223155,9.6137701 C22.9915407,8.99156127 22.6373511,8.41926238 22.1568563,7.98508192 C21.3417668,7.20898204 20.2654429,6.69528497 19.1891192,6.69528497 C18.3066139,6.69528497 17.4242097,6.96300829 16.8135614,7.66346256" />
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
