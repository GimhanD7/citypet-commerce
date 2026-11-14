/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#173d3b',
          soft: '#4f6865',
        },
        teal: {
          DEFAULT: '#0d5c5a',
          2: '#238983',
          bright: '#04959d',
          dark: '#027d84',
        },
        mint: {
          DEFAULT: '#dff5f0',
          2: '#eefaf7',
        },
        cream: '#fff9f1',
        peach: '#f7b58d',
        coral: '#ed7f72',
        lavender: '#8377b7',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        heading: ['Nunito', 'sans-serif'],
        script: ['Caveat', 'cursive'],
      },
      borderRadius: {
        'xl': '36px',
        'lg': '26px',
        'md': '18px',
      },
      boxShadow: {
        'soft': '0 24px 70px rgba(20, 76, 73, .09)',
        'glass': '0 18px 45px rgba(22, 92, 89, .13)',
      },
    },
  },
  plugins: [],
}
