import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Define TypeScript Interface for Stats
interface StatsData {
  tournaments: number;
  players: number;
  matches: number;
  satisfaction: number;
}

const Hero: React.FC = () => {
  const { user } = useAuth();

  // State to store backend statistics
  const [stats, setStats] = useState<StatsData>({
    tournaments: 0,
    players: 0,
    matches: 0,
    satisfaction: 98,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch stats from backend API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Replace with your actual API endpoint URL (e.g., /api/stats or /api/tournaments/summary)
        const response = await fetch("/api/stats");
        if (response.ok) {
          const data = await response.json();
          setStats({
            tournaments: data.tournaments || 0,
            players: data.players || 0,
            matches: data.matches || 0,
            satisfaction: data.satisfaction || 98,
          });
        }
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#03131A] text-white">
      {/* ================= BACKGROUND IMAGES & GRADIENTS ================= */}
      <div className="absolute inset-0 z-0">
        {/* Mobile Background */}
        <div
          className="absolute inset-0 bg-cover bg-right block sm:hidden"
          style={{ backgroundImage: "url('/mobilebg.jpeg')" }}
        />

        {/* Desktop Background */}
        <div
          className="absolute inset-0 bg-cover bg-center hidden sm:block"
          style={{ backgroundImage: "url('/homebg.jpeg')" }}
        />

        {/* Dark overlays for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#03131A] via-[#03131A]/85 to-transparent w-[80%] sm:w-[65%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#03131A] via-transparent to-[#03131A]/60" />

        {/* Ambient glow */}
        <div className="absolute -left-20 top-1/4 h-[350px] w-[350px] rounded-full bg-[#00E5FF]/10 blur-[100px]" />
      </div>

      {/* ================= HERO CONTENT ================= */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-8 pb-10 sm:px-8 sm:pt-14 sm:pb-16 lg:px-12">
        
        {/* Left-aligned Header & CTA */}
        <div className="max-w-[72%] text-left sm:max-w-xl lg:max-w-2xl">
          {/* Status Badge */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-3 py-1 backdrop-blur-md sm:mb-6 sm:px-3.5 sm:py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00E5FF] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00E5FF]" />
            </span>
            <span className="text-[9px] font-semibold tracking-wider text-[#00E5FF] uppercase sm:text-xs">
              Professional Tournament Management
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-sans text-3xl font-black uppercase leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Table Tennis <br />
            <span className="bg-gradient-to-r from-[#00E5FF] to-[#00A3FF] bg-clip-text text-transparent">
              Tournament
            </span>{" "}
            <br />
            System
          </h1>

          {/* Description */}
          <p className="mt-2.5 text-[11px] leading-snug text-gray-300 sm:mt-5 sm:text-base sm:leading-relaxed">
            Manage tournaments, track matches, and celebrate champions with our
            comprehensive platform.
          </p>

          {/* Action Buttons */}
          <div className="mt-4 flex items-center gap-2.5 sm:mt-7 sm:gap-3.5">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 rounded-lg bg-[#00E5FF] px-4 py-2 text-xs font-bold text-[#03131A] shadow-md shadow-[#00E5FF]/20 transition-all hover:bg-[#33ECFF] sm:px-6 sm:py-3 sm:text-base"
                >
                  Get Started <span>→</span>
                </Link>

                <Link
                  to="/login"
                  className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/10 sm:px-6 sm:py-3 sm:text-base"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link
                to="/tournaments"
                className="flex items-center gap-1.5 rounded-lg bg-[#00E5FF] px-4 py-2 text-xs font-bold text-[#03131A] shadow-md shadow-[#00E5FF]/20 transition-all hover:bg-[#33ECFF] sm:px-6 sm:py-3 sm:text-base"
              >
                Browse Tournaments <span>→</span>
              </Link>
            )}
          </div>
        </div>

        {/* ================= 3 FEATURE CARDS ================= */}
        <div className="mt-8 grid grid-cols-3 gap-2 divide-x divide-white/10 sm:mt-12 sm:gap-6 sm:divide-x-0">
          {/* Card 1 */}
          <div className="pr-1 text-left sm:rounded-xl sm:border sm:border-white/10 sm:bg-white/[0.03] sm:p-5 sm:backdrop-blur-md">
            <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF] sm:h-10 sm:w-10">
              <svg className="h-3.5 w-3.5 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-[11px] font-bold leading-tight text-white sm:text-base">
              Tournament Management
            </h3>
            <p className="mt-1 text-[9px] leading-tight text-gray-400 sm:text-xs">
              Create, organize and manage tournaments with ease.
            </p>
          </div>

          {/* Card 2 */}
          <div className="px-1 text-left sm:rounded-xl sm:border sm:border-white/10 sm:bg-white/[0.03] sm:p-5 sm:backdrop-blur-md">
            <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF] sm:h-10 sm:w-10">
              <svg className="h-3.5 w-3.5 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-[11px] font-bold leading-tight text-white sm:text-base">
              Live Matches
            </h3>
            <p className="mt-1 text-[9px] leading-tight text-gray-400 sm:text-xs">
              Track scores, update brackets and follow matches in real-time.
            </p>
          </div>

          {/* Card 3 */}
          <div className="pl-1 text-left sm:rounded-xl sm:border sm:border-white/10 sm:bg-white/[0.03] sm:p-5 sm:backdrop-blur-md">
            <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF] sm:h-10 sm:w-10">
              <svg className="h-3.5 w-3.5 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-[11px] font-bold leading-tight text-white sm:text-base">
              Player Rankings
            </h3>
            <p className="mt-1 text-[9px] leading-tight text-gray-400 sm:text-xs">
              View rankings, player profiles and track progress.
            </p>
          </div>
        </div>

        {/* ================= DYNAMIC BACKEND STATS CONTAINER ================= */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl sm:mt-10 sm:p-6">
          <div className="grid grid-cols-4 divide-x divide-white/10">
            {/* Stat 1: Tournaments */}
            <div className="flex flex-col items-center px-1 text-center">
              <svg className="mb-1 h-3.5 w-3.5 text-[#00E5FF] sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <div className="text-base font-extrabold text-white sm:text-3xl">
                {loading ? <span className="animate-pulse">...</span> : `${stats.tournaments}+`}
              </div>
              <div className="text-[8px] font-medium tracking-wider text-gray-400 uppercase sm:text-xs">
                Tournaments
              </div>
            </div>

            {/* Stat 2: Players */}
            <div className="flex flex-col items-center px-1 text-center">
              <svg className="mb-1 h-3.5 w-3.5 text-[#00E5FF] sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div className="text-base font-extrabold text-white sm:text-3xl">
                {loading ? <span className="animate-pulse">...</span> : `${stats.players}+`}
              </div>
              <div className="text-[8px] font-medium tracking-wider text-gray-400 uppercase sm:text-xs">
                Players
              </div>
            </div>

            {/* Stat 3: Matches */}
            <div className="flex flex-col items-center px-1 text-center">
              <svg className="mb-1 h-3.5 w-3.5 text-[#00E5FF] sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div className="text-base font-extrabold text-white sm:text-3xl">
                {loading ? <span className="animate-pulse">...</span> : `${stats.matches}+`}
              </div>
              <div className="text-[8px] font-medium tracking-wider text-gray-400 uppercase sm:text-xs">
                Matches
              </div>
            </div>

            {/* Stat 4: Satisfaction */}
            <div className="flex flex-col items-center px-1 text-center">
              <svg className="mb-1 h-3.5 w-3.5 text-[#00E5FF] sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <div className="text-base font-extrabold text-white sm:text-3xl">
                {loading ? <span className="animate-pulse">...</span> : `${stats.satisfaction}%`}
              </div>
              <div className="text-[8px] font-medium tracking-wider text-gray-400 uppercase sm:text-xs">
                Satisfaction
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;