/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          dark: '#0a0f1d',
          surface: '#131b2e',
          card: '#1e293b',
          border: '#334155',
          accent: '#38bdf8',
          yellow: '#facc15',
          red: '#f43f5e',
          green: '#22c55e',
          purple: '#a855f7',
        }
      },
      animation: {
        'bounce-short': 'bounce 0.5s ease-in-out 2',
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
