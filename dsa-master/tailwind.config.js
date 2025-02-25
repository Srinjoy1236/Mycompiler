/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        orange: {
          500: '#ff5722',
          600: '#f4511e',
        },
        gray: {
          900: '#111827',
          800: '#1f2937',
          700: '#374151',
          200: '#e5e7eb',
          100: '#f3f4f6',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.3s ease-out'
      }
    },
  },
  plugins: [],
}

