/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sgu: {
          blue: '#003366',
          'blue-light': '#0055a5',
          'blue-dark': '#002244',
          gold: '#c9a227',
          'gold-light': '#e6c65c',
          white: '#ffffff',
          gray: '#f5f5f5',
          'gray-dark': '#333333',
        }
      },
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}