/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#010120',   // Dark Blue — dark sections, headers, CTAs
        lavender:  '#bdbbff',   // Soft Lavender — accent
        magenta:   '#ef2cc1',   // Brand Magenta — illustrations only
        accent:    '#fc4c02',   // Brand Orange — illustrations only
      },
      fontFamily: {
        sans:  ['"DM Sans"', 'Arial', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'Georgia', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
        md:      '8px',
      },
      boxShadow: {
        card:     'rgba(1, 1, 32, 0.06) 0px 2px 8px',
        elevated: 'rgba(1, 1, 32, 0.10) 0px 4px 10px',
      },
    },
  },
  plugins: [],
}
