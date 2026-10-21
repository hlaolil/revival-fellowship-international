/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/**/*.ejs', './controllers/**/*.js'],
  theme: {
    extend: {
      colors: {
        primary: '#008080',
        secondary: '#FFA500',
        accent: '#006d77',
      },
      fontFamily: {
        heading: ['Georgia', 'serif'],
        body: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
