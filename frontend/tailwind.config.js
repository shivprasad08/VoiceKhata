/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        paytm: {
          blue: '#00B9F1',
          dark: '#002E6E'
        },
        khata: {
          green: '#00C853',
          red: '#FF3B30',
          dark: '#121212',
          card: '#1E1E1E',
          border: '#333333'
        }
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        }
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out forwards',
      }
    },
  },
  plugins: [],
}
