/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'rounded': ['M PLUS Rounded 1c', 'Hiragino Sans', 'sans-serif']
      }
    },
  },
  plugins: [],
}
