/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        fadeIn: 'fadeIn 1.2s ease-in-out forwards',
        slowZoom: 'slowZoom 20s ease-in-out infinite alternate',
        floatRotate: 'floatRotate 15s ease-in-out infinite',
        patternMove: 'patternMove 30s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        slowZoom: {
          // ... existing code ...
        }
      },
    },
  },
  plugins: [],
};
