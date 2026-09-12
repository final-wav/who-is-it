/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Baloo 2"', 'Fredoka', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fredoka', '"Baloo 2"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        board: {
          red: {
            DEFAULT: '#dc2626',
            dark: '#991b1b',
            rim: '#b91c1c',
            light: '#ef4444',
          },
          blue: {
            DEFAULT: '#2563eb',
            dark: '#1e40af',
            rim: '#1d4ed8',
            light: '#3b82f6',
          },
          yellow: {
            DEFAULT: '#facc15',
            dark: '#ca8a04',
            rim: '#eab308',
            light: '#fef08a',
          },
        },
      },
      boxShadow: {
        'tray-3d': '0 10px 0 0 rgba(0,0,0,0.35), 0 16px 25px rgba(0,0,0,0.4)',
        'tile-3d': '0 5px 0 0 #ca8a04, 0 8px 12px rgba(0,0,0,0.2)',
        'tile-down': '0 1px 0 0 #a16207',
        'btn-red': '0 4px 0 0 #991b1b',
        'btn-blue': '0 4px 0 0 #1e40af',
        'btn-green': '0 4px 0 0 #166534',
        'btn-yellow': '0 4px 0 0 #a16207',
      },
    },
  },
  plugins: [],
}
