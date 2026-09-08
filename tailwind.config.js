/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080808",
        surface: "#101010",
        surfaceElevated: "#181818",
        surfaceHighlight: "#242424",
        borderSubtle: "#202020",
        borderMuted: "#303030",
        textPrimary: "#ECE7DE",
        textSecondary: "#A09A8F",
        textMuted: "#66625B",
        accentSage: "#7E9F86",
        accentBlue: "#6B8FA3",
        accentTerracotta: "#BF614B",
        accentGold: "#C8A051",
      },
      fontFamily: {
        serif: ["'Source Serif 4'", "serif"],
        sans: ["Roboto", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      }
    },
  },
  plugins: [],
}
