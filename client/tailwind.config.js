/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        'nexus-bg': '#0b101e',
        'nexus-card': '#111827',
        'nexus-border': '#1f2937',
        'nexus-teal': '#14b8a6',
        'nexus-teal-dark': '#0f766e',
      }
    },
  },
  plugins: [],
};
