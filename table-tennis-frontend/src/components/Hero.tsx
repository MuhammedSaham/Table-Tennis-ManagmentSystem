import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import heroBgDesktop from "../assets/hero_bg_desktop.png";
import heroBgMobile from "../assets/hero_bg_mobile.png";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const Hero: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="relative w-full min-h-[calc(100dvh-5rem)] sm:min-h-[calc(100vh-5rem)] bg-[#0D3039] overflow-hidden flex items-center">
      {/* Full-Bleed Responsive Background Image matching About page vibrant brightness */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <picture>
          <source media="(max-width: 639px)" srcSet={heroBgMobile} />
          <source media="(min-width: 640px)" srcSet={heroBgDesktop} />
          <img
            src={heroBgDesktop}
            alt="Table Tennis Championship Arena"
            className="w-full h-full object-cover object-center"
          />
        </picture>
        {/* Soft, light tint matching the About page brightness while keeping text crisp */}
        <div className="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-[#061D23]/35 via-[#061D23]/15 to-transparent" />
        <div className="absolute inset-0 bg-[#061D23]/10" />
      </div>

      {/* 3. Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 lg:py-20 w-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Heading, Copy, Buttons, Tagline */}
          <div className="lg:col-span-7 text-left max-w-2xl">
            {/* Small Label */}
            <div className="animate-fade-up-1 text-xs sm:text-sm font-semibold tracking-wider text-[#7DC6C7] uppercase mb-3 sm:mb-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              SAM&apos;S COLLEGE TABLE TENNIS
            </div>

            {/* Main Headline */}
            <h1 className="animate-fade-up-2 font-jakarta text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white tracking-tight leading-[1.05] mb-3 sm:mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
              The art of
              <span className="block text-[#A5F3FC] mt-1 sm:mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                the next point.
              </span>
            </h1>

            {/* Description Paragraph */}
            <p className="animate-fade-up-3 text-slate-100 text-sm sm:text-base lg:text-lg font-normal leading-relaxed max-w-xl mb-6 sm:mb-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              Discover tournaments, connect with fellow players, and take your game further.
            </p>

            {/* Action Buttons */}
            <div className="animate-fade-up-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
              <Link
                to="/tournaments"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#7DC6C7] hover:bg-[#8ee1e2] text-[#0A262D] font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-md shadow-black/25 text-center"
              >
                <span>Explore Tournaments</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>

              <Link
                to={user ? "/tournaments" : "/register"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-white hover:text-[#7DC6C7] font-semibold text-sm sm:text-base px-3 py-3 sm:py-3.5 transition-colors text-center"
              >
                <span>Join the Club</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

          </div>

          {/* Right Column (Desktop Floating Editorial Caption over the supplied asset) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-end h-[420px] xl:h-[480px] pointer-events-none">
            {/* Bottom Right Club Tag */}
            <div className="animate-fade-up-5 self-end text-left pl-6 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
              <div className="text-[11px] text-[#7DC6C7] font-semibold tracking-wider uppercase mb-1">
                SAM&apos;S COLLEGE &nbsp;/&nbsp; TABLE TENNIS
              </div>
              <div className="text-xl xl:text-2xl font-bold text-white leading-snug">
                One club.
              </div>
              <div className="text-xl xl:text-2xl font-bold text-white leading-snug">
                A shared passion.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;
