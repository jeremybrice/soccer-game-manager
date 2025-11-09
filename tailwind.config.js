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
    },
  },
  plugins: [],
}
