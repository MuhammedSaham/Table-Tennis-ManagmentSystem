import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import heroBg from "../assets/hero_bg.jpg";

// Smooth animated count-up hook for stats
const useCounter = (target: number, duration: number = 1400) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // smooth ease-out curve
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * target));
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return count;
};

const Hero: React.FC = () => {
  const { user } = useAuth();

  // Smooth live numbers
  const tournamentsCount = useCounter(50);
  const playersCount = useCounter(200);
  const matchesCount = useCounter(1000);

  return (
    <div className="relative h-[calc(100vh-5rem)] min-h-[560px] bg-[#061D23] overflow-hidden flex items-center w-full">
      {/* 1. Background Image with Racket on the right */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "75% center",
            zIndex: 0,
          }}
        />
        {/* Responsive dark vignette: full dark wash on mobile for 100% legibility, smooth fade to right on desktop */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(to right, rgba(6, 29, 35, 0.96) 0%, rgba(6, 29, 35, 0.90) 45%, rgba(6, 29, 35, 0.40) 80%, rgba(6, 29, 35, 0.20) 100%)",
          }}
        />
        {/* Additional mobile-only subtle dark tint for ultra-sharp text on small screens */}
        <div className="absolute inset-0 bg-[#061D23]/40 sm:hidden z-[1]" />

        {/* Brand diagonal accent lines (hidden on very small screens to avoid visual noise) */}
        <div
          className="hidden sm:block"
          style={{
            position: "absolute",
            inset: 0,
            background: "#12679E",
            clipPath: "polygon(0 0, 14% 0, 7% 100%, 0 100%)",
            opacity: 0.22,
            zIndex: 2,
          }}
        />
        <div
          className="hidden sm:block"
          style={{
            position: "absolute",
            inset: 0,
            background: "#4AEEFF",
            clipPath: "polygon(12% 0, 18% 0, 11% 100%, 5% 100%)",
            opacity: 0.16,
            zIndex: 2,
          }}
        />
      </div>

      {/* 2. Left-Aligned Content Container (Fully Responsive) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-14 w-full">
        <div className="max-w-xl text-left">
          {/* Top Badge with College Name, live radar dot, and continuous gentle float */}
          <div className="animate-fade-up-1 inline-flex items-center gap-2 bg-[#12679E]/30 border border-[#4AEEFF]/40 backdrop-blur-md rounded-full px-3 py-1 sm:px-3.5 sm:py-1 mb-4 sm:mb-5 shadow-[0_0_15px_rgba(74,238,255,0.15)] animate-gentle-float">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4AEEFF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4AEEFF]"></span>
            </span>
            <span className="text-[11px] sm:text-xs font-bold tracking-wider text-[#4AEEFF] uppercase">
              Sam's College TT League
            </span>
          </div>

          {/* Solid Headline with Continuous Metallic Light Sweep & Neon Glow */}
          <h1 className="animate-fade-up-2 text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] mb-3 sm:mb-4 font-display">
            <span className="block animate-light-sweep font-black">
              RULE THE ARENA.
            </span>
            <div className="relative inline-block w-full">
              <span className="block text-xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#4AEEFF] via-cyan-100 to-white bg-clip-text text-transparent mt-1.5 sm:mt-2 animate-gradient-flow animate-neon-breathe">
                Table Tennis Championship
              </span>
              {/* Continuous Flowing Laser Underline */}
              <div className="h-[2px] sm:h-[2.5px] w-36 sm:w-52 bg-gradient-to-r from-[#4AEEFF] via-cyan-300 to-transparent rounded-full mt-2 shadow-[0_0_12px_rgba(74,238,255,0.7)] animate-laser-flow" />
            </div>
          </h1>

          {/* Crisp 1-line Subtitle */}
          <p className="animate-fade-up-3 text-sm sm:text-base lg:text-lg text-gray-300 font-normal leading-relaxed mb-6 sm:mb-8 max-w-md">
            Live tournament brackets, instant match scores, and official rankings.
          </p>

          {/* Action Buttons (Compact, elegant side-by-side pills with continuous aura & arrow micro-interaction) */}
          <div className="animate-fade-up-4 flex flex-row items-center gap-2.5 sm:gap-3.5 mb-7 sm:mb-9">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-1.5 bg-gradient-to-r from-[#4AEEFF] to-[#12679E] text-[#061D23] hover:brightness-110 font-extrabold text-xs sm:text-sm px-4 py-2.5 sm:px-5 sm:py-3 rounded-full animate-button-aura transition-all duration-300 transform active:scale-95 sm:hover:scale-105 whitespace-nowrap"
                >
                  <span>Get Started</span>
                  <span className="text-xs transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center bg-[#061D23]/60 hover:bg-[#12679E]/30 border border-white/20 hover:border-[#4AEEFF]/40 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 sm:px-5 sm:py-3 rounded-full backdrop-blur-md transition-all duration-300 active:scale-95 whitespace-nowrap"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link
                to="/tournaments"
                className="group inline-flex items-center gap-1.5 bg-gradient-to-r from-[#4AEEFF] to-[#12679E] text-[#061D23] hover:brightness-110 font-extrabold text-xs sm:text-sm px-4 py-2.5 sm:px-5 sm:py-3 rounded-full animate-button-aura transition-all duration-300 transform active:scale-95 sm:hover:scale-105 whitespace-nowrap"
              >
                <span>Browse Tournaments</span>
                <span className="text-xs transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            )}
          </div>

          {/* Clean Responsive Stats Row (Live Count-Up Numbers - Screenshot 2 style) */}
          <div className="animate-fade-up-5 grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-8 pt-4 sm:pt-5 border-t border-white/10 text-center sm:text-left">
            <div>
              <div className="text-lg sm:text-2xl font-black text-white tabular-nums">{tournamentsCount}+</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#4AEEFF]/80 font-medium">Tournaments</div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/10" />
            <div>
              <div className="text-lg sm:text-2xl font-black text-white tabular-nums">{playersCount}+</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#4AEEFF]/80 font-medium">Players</div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/10" />
            <div>
              <div className="text-lg sm:text-2xl font-black text-white tabular-nums">{matchesCount.toLocaleString()}+</div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#4AEEFF]/80 font-medium">Matches</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive See More Button (Mobile Only) */}
      <div className="sm:hidden absolute bottom-3 inset-x-0 flex justify-center z-20">
        <button
          onClick={() => {
            window.scrollBy({ top: window.innerHeight - 80, behavior: "smooth" });
          }}
          className="inline-flex items-center gap-1.5 bg-[#061D23]/80 hover:bg-[#12679E]/40 border border-[#4AEEFF]/40 text-[#4AEEFF] backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(74,238,255,0.2)] active:scale-95 transition-all animate-pulse"
        >
          <span>See More</span>
          <span className="text-xs font-black animate-bounce">↓</span>
        </button>
      </div>

      {/* 4. Smooth blend to following dark section */}
      <div
        className="absolute bottom-0 inset-x-0 h-16 pointer-events-none"
        style={{
          background: "linear-gradient(to top, #061D23 0%, transparent 100%)",
        }}
      />
    </div>
  );
};

export default Hero;
