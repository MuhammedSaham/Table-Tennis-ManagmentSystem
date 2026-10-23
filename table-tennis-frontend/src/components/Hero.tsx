import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import heroBgDesktop from "../assets/hero_bg_desktop.png";
import heroBgMobile from "../assets/hero_bg_mobile.png";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const Hero: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="relative w-full min-h-[calc(100dvh-5rem)] sm:min-h-[calc(100vh-5rem)] bg-[#061D23] overflow-hidden flex items-center">
      {/* 1. Desktop Full-Bleed Background Image (Supplied 4th Image Asset) */}
      <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none">
        <img
          src={heroBgDesktop}
          alt="Table Tennis Championship Arena"
          className="w-full h-full object-cover object-right"
        />
        {/* Soft gradient wash to guarantee 100% crystal-clear text contrast on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#061D23] via-[#061D23]/75 to-transparent w-full" />
      </div>

      {/* 2. Mobile Background Image (Very subtle blur with clear details) */}
      <div className="lg:hidden absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={heroBgMobile}
          alt="Table Tennis Arena"
          className="w-full h-full object-cover object-[center_60%] filter blur-[1.5px] scale-105 opacity-50"
        />
        {/* Soft gradient wash to keep text readable while preserving clear image details */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#061D23]/75 via-[#061D23]/55 to-[#061D23]/90" />
      </div>

      {/* 3. Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 lg:py-20 w-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Heading, Copy, Buttons, Tagline */}
          <div className="lg:col-span-7 text-left max-w-2xl">
            {/* Season Eyebrow */}
            <div className="text-xs sm:text-sm font-semibold tracking-wider text-[#7DC6C7] uppercase mb-3 sm:mb-6">
              SAM&apos;S COLLEGE TT LEAGUE
            </div>

            {/* Main Headline matching Figma typography */}
            <h1 className="font-jakarta text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white tracking-tight leading-[1.05] mb-3 sm:mb-6">
              The art of
              <span className="block text-[#7DC6C7] mt-1 sm:mt-2">
                the next point.
              </span>
            </h1>

            {/* Description Paragraph */}
            <p className="text-slate-300 text-sm sm:text-base lg:text-lg font-normal leading-relaxed max-w-xl mb-6 sm:mb-10">
              <span className="hidden sm:inline">
                A place to compete. A community to belong to. Discover tournaments, follow the action and play your next chapter.
              </span>
              <span className="sm:hidden">
                A place to compete. A community to belong to. Discover your next chapter on court.
              </span>
            </p>

            {/* Action Buttons matching Figma reference */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 mb-6 sm:mb-10">
              <Link
                to={user ? "/tournaments" : "/register"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#7DC6C7] hover:bg-[#8ee1e2] text-[#061D23] font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg shadow-[#7DC6C7]/20 text-center"
              >
                <span>Get Started</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>

              <Link
                to={user ? "/tournaments" : "/login"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-white hover:text-[#7DC6C7] font-semibold text-sm sm:text-base px-3 py-3 sm:py-3.5 transition-colors text-center"
              >
                <span>{user ? "View tournaments" : "Sign In"}</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            {/* Sub-tagline */}
            <div className="text-[11px] sm:text-xs tracking-widest text-slate-400/80 uppercase font-semibold">
              THE GAME YOU LOVE. &nbsp; THE STANDARD YOU DESERVE.
            </div>

          </div>

          {/* Right Column (Desktop Floating Editorial Badges over the supplied asset) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between h-[420px] xl:h-[480px] pointer-events-none">
            {/* Top Right Mini Badge */}
            <div className="self-end">
              <span className="inline-block border border-white/20 bg-[#061D23]/60 backdrop-blur-sm text-[11px] tracking-widest text-slate-300 font-medium px-4 py-1.5 rounded">
                PLAY. COMPETE. RISE.
              </span>
            </div>

            {/* Bottom Right Club Tag */}
            <div className="self-end text-left pl-6">
              <div className="text-[11px] text-[#7DC6C7] font-semibold tracking-wider uppercase mb-1">
                SAM&apos;S COLLEGE &nbsp;/&nbsp; TABLE TENNIS
              </div>
              <div className="text-xl xl:text-2xl font-bold text-white leading-snug">
                Built around the game.
              </div>
              <div className="text-xl xl:text-2xl font-bold text-white leading-snug">
                United by the club.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;
