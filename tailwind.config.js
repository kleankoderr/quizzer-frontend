import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        xs: "480px",
      },
      colors: {
        primary: {
          DEFAULT: "#3B82F6", // Blue 500
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        brand: {
          dark: "#1e3a8a", // Blue 900
          light: "#eff6ff", // Blue 50
        },
        accent: {
          DEFAULT: "#f97316", // Orange 500
          hover: "#ea580c",
        },
        success: {
          DEFAULT: "#22c55e", // Green 500
        },
      },
      fontFamily: {
        sans: ["Lexend", "sans-serif"],
      },
    },
  },
  plugins: [typography],
};
