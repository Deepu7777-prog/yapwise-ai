/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Phase 2 Exact Brand Color Palette
        primaryLavender: '#A78BFA',
        deepPurple: '#7652C8',
        pastelPink: '#F6B8D0',
        softCoral: '#FF9A91',
        peachTone: '#FFD0AE',
        skyBlue: '#A9D8F5',
        mintTone: '#A9E7D0',
        sunshineYellow: '#FFE38A',
        creamBg: '#FFF8EF',
        mainText: '#302B42',

        // Global Semantic Tokens
        background: '#FFF8EF',
        surface: '#FFFFFF',
        surfaceSubtle: '#F8F4FF',
        main: '#302B42',
        secondaryText: '#77718B',
        
        primary: {
          DEFAULT: '#7652C8',
          50: '#FAF8FF',
          100: '#EDE7FF',
          200: '#DDD3FF',
          300: '#C4B4FA',
          400: '#A78BFA',
          500: '#8B70D6',
          600: '#7652C8',
          700: '#674BB4',
          800: '#543C96',
          900: '#402B78',
        },
        lavender: {
          50: '#FAF8FF',
          100: '#EDE7FF',
          200: '#DDD3FF',
          300: '#C4B4FA',
          400: '#A78BFA',
          500: '#8B70D6',
          600: '#7652C8',
          700: '#674BB4',
        },
        mint: {
          50: '#F2FBF7',
          100: '#E1F7EE',
          200: '#BDEBD9',
          300: '#8FE2C0',
          400: '#63CAA2',
          500: '#46B88A',
          600: '#329970',
          700: '#267E5A',
        },
        peach: {
          50: '#FFF7F3',
          100: '#FFEBE2',
          200: '#FFD9C9',
          300: '#FFB89E',
          400: '#FA9A77',
          500: '#F48B62',
          600: '#DF6D41',
          700: '#C8572A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(139, 112, 214, 0.1)',
        'card-hover': '0 10px 28px -4px rgba(139, 112, 214, 0.18)',
        'soft': '0 2px 10px rgba(139, 112, 214, 0.06)',
        'elevated': '0 12px 32px -4px rgba(139, 112, 214, 0.15)',
        'glow-primary': '0 0 25px rgba(139, 112, 214, 0.4)',
        'glow-mint': '0 0 20px rgba(189, 235, 217, 0.6)',
        'glow-peach': '0 0 20px rgba(255, 217, 201, 0.6)',
        'orb': '0 0 50px rgba(139, 112, 214, 0.35)',
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2.5s infinite ease-in-out',
        'mic-pulse': 'micPulse 1.5s infinite',
        'orb-breathe': 'orbBreathe 4s infinite ease-in-out',
        'orb-ripple': 'orbRipple 2.2s infinite cubic-bezier(0, 0.2, 0.8, 1)',
        'wave-1': 'waveAnim 1.2s infinite ease-in-out',
        'wave-2': 'waveAnim 1.2s infinite ease-in-out 0.2s',
        'wave-3': 'waveAnim 1.2s infinite ease-in-out 0.4s',
        'wave-4': 'waveAnim 1.2s infinite ease-in-out 0.6s',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.85' },
        },
        orbBreathe: {
          '0%, 100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 25px rgba(139, 112, 214, 0.35))' },
          '50%': { transform: 'scale(1.08)', filter: 'drop-shadow(0 0 45px rgba(139, 112, 214, 0.55))' },
        },
        orbRipple: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        micPulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(139, 112, 214, 0.6)' },
          '70%': { boxShadow: '0 0 0 16px rgba(139, 112, 214, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(139, 112, 214, 0)' },
        },
        waveAnim: {
          '0%, 100%': { height: '8px' },
          '50%': { height: '28px' },
        },
      },
    },
  },
  plugins: [],
}
