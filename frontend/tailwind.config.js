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
        'paytm-blue': '#00BAF2',
        'paytm-blue-hover': '#00A8DC',
        'paytm-blue-light': '#E0F5FD',
        'paytm-navy': '#002970',
        'paytm-bg': '#F5F8FA',
        'paytm-card': '#FFFFFF',
        'paytm-border': '#E8EBF0',
        'paytm-text-main': '#101010',
        'paytm-text-muted': '#707070',
        khata: {
          green: '#27AE60',
          red: '#EB5757',
          dark: '#121212',
          card: '#1E1E1E',
          border: '#333333'
        }
      },
      boxShadow: {
        'paytm': '0 2px 12px rgba(0, 0, 0, 0.04)',
        'paytm-hover': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'paytm-header': '0 2px 10px rgba(0,0,0,0.05)',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'pulse-blue': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 186, 242, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0, 186, 242, 0)' },
        }
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out forwards',
        'pulse-blue': 'pulse-blue 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
