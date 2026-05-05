/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Playfair Display"', 'serif'],
      },
      colors: {
        ink: {
          50: '#f5f3f0',
          100: '#e8e4de',
          200: '#d1c9be',
          300: '#b5a898',
          400: '#9a8878',
          500: '#7d6b5a',
          600: '#5e4f43',
          700: '#3f3630',
          800: '#201d1a',
          900: '#100f0d',
        },
        paper: '#faf8f5',
        parchment: '#f0ece4',
        sage: '#4a5e4a',
        rust: '#b5451b',
        gold: '#c9973a',
      }
    }
  },
  plugins: []
}
