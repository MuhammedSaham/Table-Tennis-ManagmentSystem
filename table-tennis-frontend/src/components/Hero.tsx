import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Hero: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="relative bg-[#12679E] overflow-hidden">
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
            <span className="gradient-text">Table Tennis</span>
            <span className="gradient-text block mt-2">Tournament System</span>
          </h1>

          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Manage tournaments, track matches, and celebrate champions with our
            comprehensive platform
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
        >
          <rect x="0" y="24" width="1200" height="96" fill="#000" />
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            fill="#fff"
          ></path>
        </svg>
      </div>
    </div>
  );
};

export default Hero;
