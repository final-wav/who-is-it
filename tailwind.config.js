/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        table: {
          dark: '#0a0e17',
          surface: '#111726',
          panel: '#182032',
          border: '#253047',
        },
        retro: {
          red: '#dc2626',
          'red-dark': '#991b1b',
          blue: '#0284c7',
          'blue-dark': '#075985',
          amber: '#d97706',
          'amber-dark': '#b45309',
          green: '#16a34a',
          'green-dark': '#15803d',
        },
      },
      boxShadow: {
        'tactile': '0 4px 0 0 rgba(0,0,0,0.5)',
        'tactile-pressed': '0 1px 0 0 rgba(0,0,0,0.5)',
        'tile': '0 8px 16px -2px rgba(0,0,0,0.4), 0 2px 4px -1px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}
