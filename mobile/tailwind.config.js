/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e40af',
          dark: '#1e3a8a',
          light: '#3b82f6',
        },
        secondary: {
          DEFAULT: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui'],
      },
    },
  },
  plugins: [],
};