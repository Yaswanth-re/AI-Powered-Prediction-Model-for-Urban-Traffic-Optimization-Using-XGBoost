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
        dark: {
          bg: "#0B0F17",
          card: "#121824",
          border: "#1E293B",
          hover: "#1E2638"
        },
        brand: {
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#EF4444",
          cyan: "#06B6D4",
          blue: "#3B82F6",
          purple: "#8B5CF6"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
