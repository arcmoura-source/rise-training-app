/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F4ECE1',
          300: '#E8DCCF',
        },
        roseGold: {
          50: '#FBF4F6',
          100: '#F5E6EB',
          200: '#EBCDD7',
          300: '#DEB0BF',
          400: '#CE8FA5',
          500: '#BD6F8C',
          600: '#A65371',
        },
        sand: {
          100: '#EFECE6',
          200: '#E4DFD7',
          300: '#C7BDB1',
          400: '#8C7A6B',
          500: '#4A403A',
          600: '#342C27',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(74, 64, 58, 0.05), 0 2px 6px -1px rgba(74, 64, 58, 0.03)',
        'soft-lg': '0 10px 25px -3px rgba(74, 64, 58, 0.08), 0 4px 10px -2px rgba(74, 64, 58, 0.04)',
      }
    },
  },
  plugins: [],
}
