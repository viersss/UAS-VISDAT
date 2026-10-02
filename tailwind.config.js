/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'ui-serif', 'Georgia', 'serif'],
        rubik: ['Rubik', 'sans-serif'],
        display: ['Days One', 'sans-serif'],
      },
      colors: {
        ink: { DEFAULT: '#132b3d', soft: '#425b6d', muted: '#6d8192' },
        line: { DEFAULT: '#dfe7ee', soft: '#edf4f8' },
        canvas: '#f5f3ee',
        paper: '#fffdfb',
        accent: { DEFAULT: '#1d6d7b', soft: '#e7f3f4', deep: '#114f5c' },
        warm: { DEFAULT: '#e0824a', soft: '#fcefe7', deep: '#bf5d29' },
        sand: { DEFAULT: '#f5e7d8', soft: '#fbf5ee' },
        slate: { DEFAULT: '#23394e', soft: '#5a7187' },
      },
      boxShadow: {
        soft: '0 16px 40px rgba(19, 43, 61, 0.08)',
        card: '0 10px 25px rgba(18, 46, 67, 0.08)',
      },
    },
  },
  plugins: [],
};
