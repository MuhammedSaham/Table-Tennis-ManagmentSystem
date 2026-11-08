/*  */
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  TrophyIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface Player {
  firstName: string;
  lastName: string;
  id: string;
  profileImage?: string | null;
}

interface Winner {
  tournamentId: string;
  tournamentName: string;
  categoryName: string;
  position: number;
  winner: Player;
  runnerUp: Player;
  secondrunnerUp?: Player;
  score: string;
  completedAt: string;
}

// Player Profile Avatar
interface PlayerAvatarProps {
  player: Player;
  position: "champion" | "runnerUp" | "secondRunnerUp";
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  position,
}) => {
  const [imageError, setImageError] = useState(false);

  const styles = {
    champion: {
      border: "border-yellow-400",
      badge: "bg-yellow-400 text-[#102F38]",
    },
    runnerUp: {
      border: "border-gray-300",
      badge: "bg-gray-300 text-gray-800",
    },
    secondRunnerUp: {
      border: "border-amber-700",
      badge: "bg-amber-700 text-white",
    },
  };

  const currentStyle = styles[position];

  const initials = `${player.firstName?.[0] || ""}${player.lastName?.[0] || ""}`;

  const baseURL = (api.defaults.baseURL || "").replace(
    /\/api\/v1\/?$/,
    ""
  );

  const imageUrl = player.profileImage
    ? player.profileImage.startsWith("http")
      ? player.profileImage
      : `${baseURL}/${player.profileImage.replace(/^\/+/, "")}`
    : null;

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-[3px] ${currentStyle.border} bg-[#1B4B56] shadow-lg`}
      >
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={`${player.firstName} ${player.lastName}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
            {initials || "?"}
          </div>
        )}
      </div>
    </div>
  );
};

const ChampionsSpotlight: React.FC = () => {
  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRecentWinners();
  }, []);

  useEffect(() => {
    if (loading || recentWinners.length === 0) return;

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

    return () => observer.disconnect();
  }, [loading, recentWinners.length]);

  const fetchRecentWinners = async () => {
    try {
      const tournamentsRes = await api.get("/tournaments");

      const completedTournaments =
        tournamentsRes.data.data.filter(
          (t: any) => t.status === "COMPLETED"
        );

      const winners: Winner[] = [];

      for (const tournament of completedTournaments.slice(0, 3)) {
        const winnersRes = await api.get(
          `/results/tournaments/${tournament.id}/winners`
        );

        const categoryWinners =
          winnersRes.data.data.winners;
        //console.log("WINNERS API RESPONSE:", winnersRes.data.data.winners);

        /*console.log(
          "FULL WINNERS RESPONSE:",
          JSON.stringify(winnersRes.data.data.winners, null, 2)
        );
        console.log("API BASE URL:", api.defaults.baseURL);*/

        for (const category of categoryWinners) {
          if (category.winner) {
            winners.push({
              tournamentId: tournament.id,
              tournamentName: tournament.name,
              categoryName: category.categoryName,
              position: 1,
              winner: category.winner,
              runnerUp: category.runnerUp,
              secondrunnerUp: category.secondrunnerUp,
              score: category.score,
              completedAt: tournament.endDate,
            });
          }
        }
      }

      setRecentWinners(winners.slice(0, 6));
    } catch (error) {
      console.error("Failed to fetch winners:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="spinner mx-auto"></div>
        <p className="text-gray-500 mt-2">
          Loading champions...
        </p>
      </div>
    );
  }

  if (recentWinners.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="bg-[#0D3039] py-20 relative border-t border-white/10 overflow-hidden w-full"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#12679E]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16 relative z-10">

        {/* Section Heading */}
        <div
          className={`text-center mb-14 scroll-fade-up ${isVisible ? "is-visible" : ""
            }`}
        >
          <div className="inline-flex items-center gap-2 bg-[#7DC6C7]/10 border border-[#7DC6C7]/25 rounded-full px-4 py-1.5 mb-5">
            <TrophyIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-semibold text-[#7DC6C7] uppercase tracking-wider">
              Champions Spotlight
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 font-heading">
            Recent Tournament{" "}
            <span className="bg-gradient-to-r from-yellow-400 via-amber-200 to-white bg-clip-text text-transparent">
              Champions
            </span>
          </h2>

          <p className="text-slate-200 text-base sm:text-lg max-w-2xl mx-auto">
            Celebrating the winners of our recent championship tournaments
          </p>
        </div>

        {/* Champion Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {recentWinners.map((winner) => (
            <Link
              key={`${winner.tournamentId}-${winner.categoryName}`}
              to={`/tournaments/${winner.tournamentId}`}
              className={`group block scroll-fade-up ${isVisible ? "is-visible" : ""
                }`}
            >
              <div className="h-full bg-[#113842]/90 border border-white/10 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-[#4AEEFF]/40 transition-all duration-300 transform hover:-translate-y-2">

                {/* Top Accent */}

                <div className="p-6">

                  {/* Tournament Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="text-[10px] text-[#7DC6C7] uppercase tracking-[2px] font-bold mb-1">
                        Tournament
                      </p>

                      <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-[#4AEEFF] transition-colors">
                        {winner.tournamentName}
                      </h3>
                    </div>

                    <TrophyIcon className="w-7 h-7 flex-shrink-0 text-yellow-400" />
                  </div>

                  {/* Category */}
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#4AEEFF] bg-[#12679E]/30 border border-[#4AEEFF]/30 px-3 py-1 rounded-full">
                      {winner.categoryName}
                    </span>
                  </div>

                  {/* Players Section */}
                  <div className="space-y-5">

                    {/* Champion */}
                    <div className="flex items-center gap-4">
                      <PlayerAvatar
                        player={winner.winner}
                        position="champion"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-[1.5px] text-yellow-400 font-bold mb-1">
                          Champion
                        </p>
                        <p className="font-bold text-white text-base truncate">
                          {winner.winner.firstName}{" "}
                          {winner.winner.lastName}
                        </p>
                      </div>

                      <TrophyIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    </div>

                    {/* Runner Up */}
                    {winner.runnerUp && (
                      <div className="flex items-center gap-4">
                        <PlayerAvatar
                          player={winner.runnerUp}
                          position="runnerUp"
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-[1.5px] text-gray-400 font-bold mb-1">
                            Runner-up
                          </p>
                          <p className="font-semibold text-gray-200 text-base truncate">
                            {winner.runnerUp.firstName}{" "}
                            {winner.runnerUp.lastName}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Second Runner Up */}
                    {winner.secondrunnerUp && (
                      <div className="flex items-center gap-4">
                        <PlayerAvatar
                          player={winner.secondrunnerUp}
                          position="secondRunnerUp"
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-[1.5px] text-amber-500 font-bold mb-1">
                            Second Runner-up
                          </p>
                          <p className="font-medium text-gray-300 text-base truncate">
                            {winner.secondrunnerUp.firstName}{" "}
                            {winner.secondrunnerUp.lastName}
                          </p>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Final Score */}
                  {winner.score && (
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <p className="text-[10px] uppercase tracking-[1.5px] text-gray-400 font-bold mb-2">
                        Final Score
                      </p>

                      <p className="font-mono font-bold text-[#4AEEFF] text-lg tracking-wider">
                        {winner.score}
                      </p>
                    </div>
                  )}

                  {/* View Details */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[#4AEEFF] text-sm font-semibold">
                    <span className="group-hover:text-white transition-colors">
                      View Tournament Details
                    </span>

                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>

                </div>
              </div>
            </Link>
          ))}

        </div>
      </div>
    </section>
  );
};

export default ChampionsSpotlight;
