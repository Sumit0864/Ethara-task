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
          DEFAULT: '#5B5BD6',
          hover: '#6E6DE8',
          muted: 'rgba(91, 91, 214, 0.15)',
          subtle: 'rgba(91, 91, 214, 0.08)',
        },
        success: {
          DEFAULT: '#30A46C',
          muted: 'rgba(48, 164, 108, 0.15)',
        },
        warning: {
          DEFAULT: '#F5A623',
          muted: 'rgba(245, 166, 35, 0.15)',
        },
        danger: {
          DEFAULT: '#E5484D',
          muted: 'rgba(229, 72, 77, 0.15)',
        },
        blue: {
          DEFAULT: '#3B82F6',
          muted: 'rgba(59, 130, 246, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 0 rgba(0,0,0,0.2)',
        'medium': '0 4px 12px -2px rgba(0,0,0,0.4), 0 2px 6px -2px rgba(0,0,0,0.3)',
        'large': '0 12px 40px -8px rgba(0,0,0,0.5), 0 8px 16px -8px rgba(0,0,0,0.4)',
        'glow': '0 0 0 3px rgba(91, 91, 214, 0.25)',
        'glow-lg': '0 0 24px -4px rgba(91, 91, 214, 0.4)',
        'glow-success': '0 0 0 3px rgba(48, 164, 108, 0.25)',
        'glow-danger': '0 0 0 3px rgba(229, 72, 77, 0.25)',
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
