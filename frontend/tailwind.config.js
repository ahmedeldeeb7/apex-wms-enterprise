/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#090D16',
          card: 'rgba(15, 23, 42, 0.65)',
          border: 'rgba(255, 255, 255, 0.07)',
          text: '#E2E8F0',
          muted: '#94A3B8'
        },
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#1D4ED8',
          light: '#60A5FA'
        },
        accent: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
          light: '#FBBF24'
        },
        success: {
          DEFAULT: '#10B981',
          light: '#34D399'
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#F87171'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 0 15px rgba(59, 130, 246, 0.15)',
        'amazon-glow': '0 0 15px rgba(245, 158, 11, 0.2)'
      }
    },
  },
  plugins: [],
}
