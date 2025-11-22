/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NELLOGISTICS Brand Colors
        'aqua-flow': {
          DEFAULT: '#00C9B7',
          50: '#E5FBF9',
          100: '#CCF7F3',
          200: '#99EFE7',
          300: '#66E7DB',
          400: '#33DFCF',
          500: '#00C9B7',
          600: '#00A795',
          700: '#007D70',
          800: '#00534A',
          900: '#002A25',
        },
        'velocity-green': {
          DEFAULT: '#A4FF00',
          50: '#F4FFCC',
          100: '#EEFF99',
          200: '#E8FF66',
          300: '#E2FF33',
          400: '#DCFF00',
          500: '#A4FF00',
          600: '#83CC00',
          700: '#629900',
          800: '#416600',
          900: '#203300',
        },
        'deep-ocean': {
          DEFAULT: '#0A2540',
          50: '#E8EBF0',
          100: '#C8D0DD',
          200: '#91A3B8',
          300: '#5A7593',
          400: '#23486E',
          500: '#0A2540',
          600: '#081E33',
          700: '#061626',
          800: '#040F1A',
          900: '#02070D',
        },
        'cloud-white': '#F8FAFB',
        'data-gray': '#6B7280',
        'status-green': '#10B981',
        'alert-orange': '#F59E0B',
        'critical-red': '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      letterSpacing: {
        'tighter-heading': '-0.02em',
        'ui': '0.01em',
      },
      lineHeight: {
        'headline': '1.1',
        'body': '1.6',
        'ui': '1.4',
      },
    },
  },
  plugins: [],
}
