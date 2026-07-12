import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Window2Image from "../assets/window2.jpg";
import Window3Image from "../assets/window3.jpg";

const Hero: React.FC = () => {
  const { user } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 4500);

    return () => window.clearInterval(interval);
  }, []);

  const slideClass = (index: number) =>
    `absolute inset-0 transition-opacity duration-1000 ${
      activeSlide === index ? "opacity-100 z-10" : "opacity-0 z-0"
    }`;

  return (
    <div className="relative h-screen overflow-hidden">
      <div className={slideClass(0)} style={{ left: "2.5mm", right: "2.5mm" }}>
        <div className="relative bg-[#12679E] overflow-hidden h-screen">
          {/* Login-style background layers (image, overlay, diagonal accents) */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=1920&q=80')", backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: '#061D23', opacity: 0.62, zIndex: 1 }} />
            <div style={{ position: 'absolute', inset: 0, background: '#12679E', clipPath: 'polygon(0 0, 12% 0, 6% 100%, 0 100%)', opacity: 0.28, zIndex: 2 }} />
            <div style={{ position: 'absolute', inset: 0, background: '#4AEEFF', clipPath: 'polygon(10% 0, 16% 0, 10% 100%, 4% 100%)', opacity: 0.22, zIndex: 2 }} />
          </div>

          {/* Background pattern (soft circles) */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-500 rounded-full filter blur-3xl"></div>
          </div>

          {/* Table tennis ball animation */}
          <div className="absolute top-20 left-10 animate-float">
            <div className="w-8 h-8 bg-white rounded-full shadow-lg border border-gray-200"></div>
          </div>
          <div className="absolute bottom-32 right-20 animate-float animation-delay-2000">
            <div className="w-6 h-6 bg-white rounded-full shadow-lg"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-sm text-white/90">
                  Professional Tournament Management
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 font-display">
                <span className="gradient-text block">
                  <span className="inline-flex items-end justify-center gap-0">
                    <span className="text-6xl md:text-8xl">S</span>
                    <span className="text-5xl md:text-7xl">AM'S Table Tennis</span>
                  </span>
                </span>
                <span className="gradient-text block mt-2">Hub</span>
              </h1>

              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
                The official platform for organising and managing table tennis tournaments at SAM'S College.
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                {!user ? (
                  <>
                    <Link
                      to="/register"
                      className="bg-white text-primary-700 hover:bg-gray-100 font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Get Started Free
                    </Link>
                    <Link
                      to="/login"
                      className="btn-secondary bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      Sign In
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/tournaments"
                    className="bg-white text-[#12679E] border border-[#12679E] font-bold px-6 py-3 rounded-xl transition-all duration-300 transform hover:bg-[#f4faff] hover:scale-105 shadow-lg"
                  >
                    Browse Tournaments
                  </Link>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
              <div
                className="text-center animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="text-3xl font-bold text-white">50+</div>
                <div className="text-sm text-white/70">Tournaments</div>
              </div>
              <div
                className="text-center animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="text-3xl font-bold text-white">200+</div>
                <div className="text-sm text-white/70">Players</div>
              </div>
              <div
                className="text-center animate-slide-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="text-3xl font-bold text-white">1000+</div>
                <div className="text-sm text-white/70">Matches</div>
              </div>
              <div
                className="text-center animate-slide-up"
                style={{ animationDelay: "0.4s" }}
              >
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-sm text-white/70">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              className="relative h-16 w-full"
            ></svg>
          </div>
        </div>
      </div>

      <div className={slideClass(1)} style={{ left: "2.5mm", right: "2.5mm" }}>
        <div className="absolute inset-0 overflow-hidden h-screen">
          <img
            src={Window2Image}
            alt="Window 2"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex h-full items-center justify-center px-6 py-16">
            <div className="max-w-3xl text-center bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl">
              <h2
                className="text-4xl md:text-5xl font-bold text-black mb-6"
                style={{ textShadow: "2px 2px 0 #fff, -2px -2px 0 #000" }}
              >
                Welcome to SAM&apos;S College Table Tennis
              </h2>
              <p className="text-lg md:text-xl text-black leading-relaxed mb-4">
                Experience the excitement of competitive table tennis at SAM&apos;S College. Our tournament platform makes it easier to manage competitions, track matches, and celebrate the achievements of our talented players.
              </p>
              <p className="text-base md:text-lg text-black leading-relaxed">
                Promoting sportsmanship, teamwork, and excellence through every match.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={slideClass(2)} style={{ left: "2.5mm", right: "2.5mm" }}>
        <div className="absolute inset-0 overflow-hidden h-screen">
          <img
            src={Window3Image}
            alt="Window 3"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
