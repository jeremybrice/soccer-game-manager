/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        field: {
          light: '#4ade80',
          DEFAULT: '#22c55e',
          dark: '#16a34a',
        },
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
