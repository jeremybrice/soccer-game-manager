/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // St. Pete Raiders branding colors
        'raiders-navy': {
          light: '#2d3e5f',
          DEFAULT: '#1B2947',
          dark: '#0f1829',
        },
        'raiders-red': {
          light: '#dc2f4a',
          DEFAULT: '#C8102E',
          dark: '#a00d25',
        },
        // Field colors (navy for Raiders branding)
        field: {
          light: '#2d3e5f',
          DEFAULT: '#1B2947',
          dark: '#0f1829',
        },
        // Bench colors (keep neutral gray)
        bench: {
          light: '#94a3b8',
          DEFAULT: '#64748b',
          dark: '#475569',
        }
      },
      // Custom animations for 15-minute alert and modals
      keyframes: {
        'pulse-ring': {
          '0%, 100%': {
            boxShadow: '0 0 0 0px rgba(250, 204, 21, 0.7)',
          },
          '50%': {
            boxShadow: '0 0 0 8px rgba(250, 204, 21, 0)',
          },
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
