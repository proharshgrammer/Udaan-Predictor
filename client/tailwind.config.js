/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        indigo: {
          950: '#1e1b4b', // Deep Indigo
        },
        teal: {
          500: '#14b8a6', // Vibrant Teal
        },
        orange: {
          500: '#f97316', // Signal Orange
        },
        slate: {
          900: '#0f172a',
          950: '#020617', // Darker background
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
}
