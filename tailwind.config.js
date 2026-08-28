/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/{*.js,*.ts,*&.jsx,*.tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        waze: {
          blue: '#33ccff',
          dark: '#1e293b',
          card: '#0f172a',
          accent: '#38bdf8',
          police: '#3b82f6',
          hazard: '#eab308',
          jam: '#ef4444',
          closure: '#a855f7',
          accident: '#f97316',
        }
      }
    },
  },
  plugins: [],
}