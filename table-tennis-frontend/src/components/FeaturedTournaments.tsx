import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ArrowRightIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

interface Tournament {
  id: string;
  name: string;
  venue: string;
  startDate: string;
  maxPlayers?: number | null;
  _count: {
    registrations: number;
  };
}

const FeaturedTournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUpcomingTournaments();
  }, []);

  useEffect(() => {
    if (loading) return;

    // Trigger down-to-up animation when section actually scrolls into viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [loading]);

  const fetchUpcomingTournaments = async () => {
    try {
      const response = await api.get("/tournaments");
      const upcoming = response.data.data
        .filter((t: any) => t.status === "UPCOMING")
        .slice(0, 3);
      setTournaments(upcoming);
    } catch (error) {
      console.error("Failed to fetch tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div
      ref={sectionRef}
      className="py-16 sm:py-24 bg-[#0D3039] relative border-t border-white/10 overflow-hidden w-full"
    >
      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16">
        {/* Header with prominent, smooth down-to-up entrance */}
        <div
          className={`text-center mb-12 sm:mb-16 scroll-fade-up ${
            isVisible ? "is-visible" : ""
          }`}
          style={{
            transitionDelay: isVisible ? "0ms" : "0ms",
          }}
        >
          <div className="inline-flex items-center gap-2 bg-[#7DC6C7]/10 border border-[#7DC6C7]/25 rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#7DC6C7]"></span>
            <span className="text-xs font-semibold text-[#7DC6C7] uppercase tracking-wider">
              Live & Upcoming
            </span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            Upcoming Tournaments
          </h2>
          <p className="text-slate-200 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Don&apos;t miss your chance to compete in these exciting championship events
          </p>
        </div>

        {tournaments.length === 0 ? (
          /* Graceful Empty State with down-to-up animation */
          <div
            className={`bg-[#113842]/85 border border-white/10 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-lg scroll-fade-up ${
              isVisible ? "is-visible" : ""
            }`}
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#7DC6C7]/15 border border-[#7DC6C7]/30 flex items-center justify-center text-[#7DC6C7]">
              <TrophyIcon className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              No Open Tournaments Right Now
            </h3>
            <p className="text-slate-200 text-sm mb-6 max-w-md mx-auto leading-relaxed">
              New championship fixtures and club matches are scheduled regularly. Explore the full tournament schedule or check past results.
            </p>
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-2 bg-[#7DC6C7] hover:bg-[#8ee1e2] text-[#0A262D] font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-md shadow-black/20"
            >
              <span>View All Tournaments</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {tournaments.map((tournament, index) => {
              const registered = tournament._count?.registrations || 0;
              const max = tournament.maxPlayers;
              const spotsLeft = max ? Math.max(0, max - registered) : null;
              const isFull = spotsLeft !== null && spotsLeft === 0;

              return (
                <Link
                  key={tournament.id}
                  to={`/tournaments/${tournament.id}`}
                  className={`group block scroll-fade-up ${
                    isVisible ? "is-visible" : ""
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${(index + 1) * 160}ms` : "0ms",
                  }}
                >
                  <div className="h-full bg-[#113842]/90 hover:bg-[#15434F] border border-white/10 hover:border-[#7DC6C7]/40 rounded-2xl shadow-md hover:shadow-2xl hover:shadow-[#05171C]/60 transition-all duration-300 transform group-hover:-translate-y-2 overflow-hidden flex flex-col justify-between">
                    <div className="p-6">
                      {/* Top category / status tag */}
                      <div className="flex items-center justify-between mb-4">
                        {isFull ? (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/20 border border-rose-400/40 px-2.5 py-0.5 rounded-full">
                            Bracket Full
                          </span>
                        ) : spotsLeft !== null && spotsLeft <= 4 ? (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <span>Only {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7DC6C7] bg-[#7DC6C7]/20 border border-[#7DC6C7]/40 px-2.5 py-0.5 rounded-full">
                            Open Registration
                          </span>
                        )}
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7DC6C7] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7DC6C7]"></span>
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-4 group-hover:text-[#7DC6C7] transition-colors leading-snug">
                        {tournament.name}
                      </h3>

                      <div className="space-y-2.5 text-slate-200 text-sm mb-4">
                        <div className="flex items-center gap-2.5">
                          <MapPinIcon className="w-4 h-4 text-[#7DC6C7] flex-shrink-0" />
                          <span className="truncate">{tournament.venue}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CalendarIcon className="w-4 h-4 text-[#7DC6C7] flex-shrink-0" />
                          <span>
                            {new Date(tournament.startDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <UserGroupIcon className="w-4 h-4 text-[#7DC6C7] flex-shrink-0" />
                          <span>
                            {registered} {max ? `/ ${max}` : ""} players registered
                          </span>
                        </div>
                      </div>

                      {/* Capacity Progress Bar */}
                      {max && (
                        <div className="pt-2 border-t border-white/10">
                          <div className="w-full bg-white/15 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isFull
                                  ? "bg-rose-400"
                                  : spotsLeft !== null && spotsLeft <= 4
                                  ? "bg-amber-400"
                                  : "bg-[#7DC6C7]"
                              }`}
                              style={{
                                width: `${Math.min(100, (registered / max) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dedicated CTA Footer */}
                    <div className="px-6 py-4 bg-[#0B2A32]/95 border-t border-white/10 flex items-center justify-between group-hover:bg-[#0B2A32] transition-colors">
                      <span className="text-[#7DC6C7] text-sm font-bold group-hover:translate-x-1 transition-all inline-flex items-center gap-1.5">
                        <span>Register Now</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </span>
                      <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* See All Tournaments Button with down-to-up entrance */}
        {tournaments.length > 0 && (
          <div
            className={`mt-12 sm:mt-16 text-center scroll-fade-up ${
              isVisible ? "is-visible" : ""
            }`}
            style={{
              transitionDelay: isVisible ? "600ms" : "0ms",
            }}
          >
            <Link
              to="/tournaments"
              className="group inline-flex items-center gap-2.5 bg-[#113842] hover:bg-[#154450] text-white hover:text-[#7DC6C7] border border-white/15 hover:border-[#7DC6C7]/40 font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-md hover:shadow-xl shadow-black/20 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
            >
              <span>See All Tournaments</span>
              <ArrowRightIcon className="w-4 h-4 text-[#7DC6C7] transform group-hover:translate-x-1.5 transition-transform duration-200" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedTournaments;
