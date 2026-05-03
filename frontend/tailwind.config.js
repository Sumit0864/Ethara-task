/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Midnight Indigo palette
        bg: {
          DEFAULT: '#0A0A0F',
          surface: '#16161F',
          elevated: '#1E1E2A',
          hover: '#232332',
          active: '#2A2A3C',
        },
        border: {
          DEFAULT: '#2A2A3C',
          subtle: '#1F1F2E',
          strong: '#3A3A4F',
        },
        text: {
          primary: '#EDEDF0',
          secondary: '#8B8B9E',
          tertiary: '#5C5C72',
          inverse: '#0A0A0F',
        },
        accent: {
          DEFAULT: '#FFFFFF',
          hover: '#E4E4E7',
          muted: 'rgba(255, 255, 255, 0.15)',
          subtle: 'rgba(255, 255, 255, 0.08)',
        },
        success: {
          DEFAULT: '#10B981',
          muted: 'rgba(16, 185, 129, 0.1)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          muted: 'rgba(245, 158, 11, 0.1)',
        },
        danger: {
          DEFAULT: '#EF4444',
          muted: 'rgba(239, 68, 68, 0.1)',
        },
        blue: {
          DEFAULT: '#3B82F6',
          muted: 'rgba(59, 130, 246, 0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgba(0,0,0,0.5), 0 1px 3px 0 rgba(0,0,0,0.4)',
        'medium': '0 4px 12px -2px rgba(0,0,0,0.6), 0 2px 6px -2px rgba(0,0,0,0.5)',
        'large': '0 12px 40px -8px rgba(0,0,0,0.8), 0 8px 16px -8px rgba(0,0,0,0.6)',
        'glow': '0 0 0 1px rgba(255, 255, 255, 0.2)',
        'glow-lg': '0 0 15px -4px rgba(255, 255, 255, 0.2)',
        'glow-success': '0 0 0 1px rgba(255, 255, 255, 0.2)',
        'glow-danger': '0 0 0 1px rgba(239, 68, 68, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
