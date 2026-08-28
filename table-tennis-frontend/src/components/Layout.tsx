import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import Hero from "./Hero";
import Logo from "../assets/LOGO.png";
import FooterImage from "../assets/footerimg.png";
import {
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

  const navigation = [
    { name: "Dashboard", href: "/app/dashboard" },
    { name: "Tournaments", href: "/app/tournaments" },
    { name: "Leaderboard", href: "/app/leaderboard" },
    { name: "Global Rankings", href: "/app/global-leaderboard" },
    { name: "Profile", href: "/app/profile" },
  ];

  if (user?.role === "ADMIN") {
    navigation.push({ name: "Admin Requests", href: "/app/admin-requests" });
    navigation.push({ name: "Users", href: "/app/users" });
  }

  if (user?.role === "REFEREE") {
    navigation.push({ name: "Referee Dashboard", href: "/app/referee/matches" });
  }

  const isAuthPage = ["/login", "/register", "/reset-password"].includes(location.pathname);

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-950 text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#061D23] shadow-lg transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link to="/app/dashboard" className="flex items-center gap-3 group">
              <img
                src={Logo}
                alt="Sam's College"
                className="h-12 w-12 rounded-2xl object-contain shadow-xl shadow-cyan-500/20"
              />
              <span className="text-lg font-semibold tracking-wide text-white md:text-xl">
                SAM'S COLLEGE
              </span>
            </Link>

            {user && (
              <div className="hidden items-center gap-3 md:flex">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-out ${
                      location.pathname === item.href
                        ? "bg-cyan-500/15 text-white shadow-[0_0_0_4px_rgba(34,211,238,0.12)]"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              {user && (
                <>
                  <NotificationBell />
                  <div className="hidden items-center gap-3 md:flex">
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{user.firstName}</p>
                      <p className="text-xs text-slate-400">{user.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-white transition hover:bg-white/10"
                      title="Logout"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      Logout
                    </button>
                  </div>
                </>
              )}

              {user && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="rounded-full bg-white/5 p-2 text-white transition hover:bg-white/10 md:hidden"
                >
                  {mobileMenuOpen ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {mobileMenuOpen && user && (
          <div className="animate-slide-down border-t border-white/10 bg-slate-950/95 shadow-lg md:hidden">
            <div className="space-y-1 px-4 py-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="mt-3 border-t pt-3">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 w-full pt-20">
        {!user && location.pathname === "/" ? (
          <Hero />
        ) : (
          <div className="w-full flex-1">
            <Outlet />
          </div>
        )}
      </main>

      <footer
        className="relative overflow-hidden text-white"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(6, 29, 35, 0.86), rgba(18, 103, 158, 0.78)), url(${FooterImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <div style={{ position: "absolute", inset: 0, background: "#061D23", opacity: 0.62, zIndex: 0 }} />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
            <div className="md:col-span-3">
              <div className="mb-4 flex items-center gap-2 slow-blink">
                <img
                  src={Logo}
                  alt="Sam's College"
                  className="h-10 w-10 rounded-lg object-contain"
                />
                <span className="text-xl font-bold text-white">SAM'S COLLEGE</span>
              </div>
              <p className="text-base font-bold text-white">
                Where education meets opportunities
              </p>
            </div>
            <div className="md:col-span-3">
              <h4 className="mb-4 text-lg font-bold text-white">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white">
                <li>
                  <Link to="/app/tournaments" className="text-white transition hover:text-[#4AEEFF]">
                    Tournaments
                  </Link>
                </li>
                <li>
                  <Link to="/app/leaderboard" className="text-white transition hover:text-[#4AEEFF]">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link to="/app/dashboard" className="text-white transition hover:text-[#4AEEFF]">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div className="md:col-span-3">
              <h4 className="mb-4 text-lg font-bold text-white">Contact</h4>
              <ul className="space-y-2 text-sm text-white">
                <li className="text-xs leading-relaxed text-white">
                  📍 Broody front lane, Jaffna, Sri Lanka, 40000
                </li>
                <li>
                  <a href="tel:+94755711174" className="text-white transition hover:text-[#4AEEFF]">
                    📞 +94 75 571 1174
                  </a>
                </li>
                <li>
                  <a href="mailto:samscollegeofficial@gmail.com" className="text-white transition hover:text-[#4AEEFF]">
                    📧 samscollegeofficial@gmail.com
                  </a>
                </li>
              </ul>
            </div>
            <div className="md:col-span-3 md:pl-6 lg:pl-10">
              <h4 className="mb-4 text-lg font-bold text-white">Follow Us</h4>
              <div className="space-y-3">
                <div>
                  <a
                    href="https://www.facebook.com/profile.php?id=61557498952975"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-white transition-colors hover:text-[#4AEEFF]"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="text-sm">Facebook</span>
                  </a>
                </div>
                <div>
                  <a
                    href="https://www.instagram.com/samscollege_official?igsh=NHR2cmk0a29nNDB3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-white transition-colors hover:text-[#4AEEFF]"
                  >
                    <svg className="h-5 w-5 text-[#E1306C]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.117.6c-.798.272-1.548.645-2.123 1.22-.576.575-.948 1.325-1.22 2.123-.267.788-.468 1.658-.528 2.936C.008 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.528 2.936.272.798.644 1.548 1.22 2.123.575.576 1.325.948 2.123 1.22.788.267 1.658.468 2.936.528 1.28.06 1.687.072 4.947.072s3.667-.015 4.947-.072c1.277-.06 2.148-.261 2.936-.528.798-.272 1.548-.644 2.123-1.22.576-.575.948-1.325 1.22-2.123.267-.788.468-1.658.528-2.936.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.261-2.148-.528-2.936-.272-.798-.644-1.548-1.22-2.123-.575-.576-1.325-.948-2.123-1.22-.788-.267-1.658-.468-2.936-.528C15.667.008 15.26 0 12 0zm0 2.16c3.203 0 3.585.009 4.849.07 1.171.054 1.805.244 2.227.408.561.217.96.477 1.382.896.419.42.679.821.896 1.381.164.422.354 1.057.408 2.227.061 1.264.07 1.646.07 4.849s-.009 3.585-.07 4.849c-.054 1.171-.244 1.805-.408 2.227-.217.561-.477.96-.896 1.382-.42.419-.821.679-1.381.896-.422.164-1.057.354-2.227.408-1.264.061-1.646.07-4.849.07s-3.585-.009-4.849-.07c-1.171-.054-1.805-.244-2.227-.408-.561-.217-.96-.477-1.382-.896-.419-.42-.679-.821-.896-1.381-.164-.422-.354-1.057-.408-2.227-.061-1.264-.07-1.646-.07-4.849s.009-3.585.07-4.849c.054-1.171.244-1.805.408-2.227.217-.561.477-.96.896-1.382.42-.419.821-.679 1.381-.896.422-.164 1.057-.354 2.227-.408 1.264-.061 1.646-.07 4.849-.07z" />
                      <circle cx="12" cy="12" r="3.305" />
                      <circle cx="18.513" cy="5.487" r=".773" />
                    </svg>
                    <span className="text-sm">Instagram</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
