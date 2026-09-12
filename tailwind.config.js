/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        tray: {
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
        },
        frame: {
          yellow: '#facc15',
          'yellow-dark': '#ca8a04',
          'yellow-rim': '#eab308',
        },
      },
      boxShadow: {
        'tray': '0 8px 0 0 rgba(0,0,0,0.35), 0 12px 20px -4px rgba(0,0,0,0.5)',
        'tile-up': '0 4px 0 0 rgba(0,0,0,0.25), 0 6px 10px rgba(0,0,0,0.15)',
        'btn-tactile': '0 3px 0 0 rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
