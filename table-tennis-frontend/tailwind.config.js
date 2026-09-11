/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ITTF-inspired color scheme
        primary: {
          50: '#e8f0fe',
          100: '#bdd4f8',
          200: '#93b8f2',
          300: '#689cec',
          400: '#3e80e6',
          500: '#1a56db',  // Main blue
          600: '#1545b0',
          700: '#103485',
          800: '#0a225a',
          900: '#05112f',
        },
        secondary: {
          50: '#fff0ed',
          100: '#ffd3cc',
          200: '#ffb5aa',
          300: '#ff9788',
          400: '#ff7966',
          500: '#e53e2e',  // Table tennis red
          600: '#c13225',
          700: '#9d261c',
          800: '#791a13',
          900: '#550e0a',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',  // Gold for champion
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        dark: {
          100: '#1e1e2f',
          200: '#181826',
          300: '#12121c',
          400: '#0c0c14',
        },
      },
      fontFamily: {
        'sans': ['Ebrima'],
        'heading': ['Bison Bold'],
        'display': ['Lemon Milk'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'slide-left': 'slideLeft 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'bounce-slow': 'bounce 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'hero-pattern': "url('https://images.unsplash.com/photo-1616671285144-3a5f1d8e3c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
        'tournament-bg': "url('https://images.unsplash.com/photo-1531415074968-036ba1b2c8d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
      },
    },
  },
  plugins: [],
}