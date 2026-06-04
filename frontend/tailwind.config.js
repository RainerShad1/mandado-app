/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1F4E79', light: '#2E5E8C', dark: '#163a5c' },
      },
    },
  },
  plugins: [],
};
