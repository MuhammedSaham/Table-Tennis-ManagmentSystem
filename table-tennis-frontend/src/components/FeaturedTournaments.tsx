import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

interface Tournament {
  id: string;
  name: string;
  venue: string;
  startDate: string;
  _count: {
    registrations: number;
  };
}

const FeaturedTournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingTournaments();
  }, []);

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
  if (tournaments.length === 0) return null;

  return (
    <div className="py-14 sm:py-20 bg-[#061D23] relative border-t border-white/5 overflow-hidden w-full">
      {/* Background ambient glow matching hero */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#12679E] rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#4AEEFF]/40 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#12679E]/20 border border-[#4AEEFF]/30 backdrop-blur-sm rounded-full px-4 py-1 mb-4 shadow-[0_0_15px_rgba(74,238,255,0.12)]">
            <span className="w-2 h-2 rounded-full bg-[#4AEEFF] animate-pulse"></span>
            <span className="text-xs font-semibold text-[#4AEEFF] uppercase tracking-wider">
              Live & Upcoming
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 font-display">
            Upcoming <span className="bg-gradient-to-r from-[#4AEEFF] via-cyan-100 to-white bg-clip-text text-transparent">Tournaments</span>
          </h2>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
            Don't miss your chance to compete in these exciting championship events
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              to={`/tournaments/${tournament.id}`}
              className="group"
            >
              <div className="h-full bg-[#08232B]/90 hover:bg-[#0C2F3A] border border-[#12679E]/40 hover:border-[#4AEEFF]/70 rounded-2xl shadow-xl hover:shadow-[0_12px_35px_rgba(74,238,255,0.15)] transition-all duration-300 transform hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between backdrop-blur-md">
                <div className="p-6">
                  {/* Top category / status tag */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4AEEFF] bg-[#12679E]/30 border border-[#4AEEFF]/30 px-2.5 py-0.5 rounded-full">
                      Open Registration
                    </span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4AEEFF] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4AEEFF]"></span>
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-[#4AEEFF] transition-colors leading-snug">
                    {tournament.name}
                  </h3>

                  <div className="space-y-2.5 text-gray-300 text-sm">
                    <div className="flex items-center gap-2.5">
                      <MapPinIcon className="w-4 h-4 text-[#4AEEFF] flex-shrink-0" />
                      <span className="truncate">{tournament.venue}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CalendarIcon className="w-4 h-4 text-[#4AEEFF] flex-shrink-0" />
                      <span>
                        {new Date(tournament.startDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <UserGroupIcon className="w-4 h-4 text-[#4AEEFF] flex-shrink-0" />
                      <span>
                        {tournament._count.registrations} participants registered
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-[#061D23]/60 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[#4AEEFF] text-sm font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                    View Details →
                  </span>
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
                    Join Match
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* See All Tournaments Button */}
        <div className="mt-12 text-center">
          <Link
            to="/tournaments"
            className="group inline-flex items-center gap-2.5 bg-[#08232B] hover:bg-[#0C2F3A] text-white hover:text-[#4AEEFF] border border-[#12679E]/60 hover:border-[#4AEEFF]/80 font-bold text-sm sm:text-base px-6 sm:px-7 py-3 rounded-full shadow-lg hover:shadow-[0_0_25px_rgba(74,238,255,0.25)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
          >
            <span>See All Tournaments</span>
            <svg
              className="w-4 h-4 text-[#4AEEFF] transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturedTournaments;
