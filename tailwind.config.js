/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'helpnet': {
          'red': {
            50: '#FEF2F2',
            100: '#FEE2E2',
            600: '#DC2626',
            700: '#B91C1C',
            900: '#7F1D1D',
          },
          'gray': {
            100: '#F3F4F6',
            700: '#374151',
          }
        }
      },
      animation: {
        'pulse-red': 'pulse-red 2s infinite',
      }
    },
  },
  plugins: [],
}