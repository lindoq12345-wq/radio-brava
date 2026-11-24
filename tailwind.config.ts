import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff4ed",
          100: "#ffe6d4",
          200: "#ffc9a8",
          300: "#ffa270",
          400: "#ff7437",
          500: "#fe5211",
          600: "#ef3807",
          700: "#c62808",
          800: "#9d2310",
          900: "#7f2010",
        },
      },
    },
  },
  plugins: [],
};

export default config;
