import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gray: {
          50: "#F7F8F4",
          100: "#ECEEE6",
          200: "#D7D9D0",
          300: "#C0C2B9",
          400: "#9FA39B",
          500: "#7A7F76",
          600: "#515A4E",
          700: "#3A4136",
          800: "#2A3326",
          900: "#1A2517",
          950: "#0E130C",
        },
        blue: {
          50: "#F1F6EE",
          100: "#E3ECDD",
          200: "#CFDEC9",
          300: "#BAD0B4",
          400: "#ACC8A2",
          500: "#96B08C",
          600: "#7B9674",
          700: "#5F7458",
          800: "#45533F",
          900: "#2C382A",
        },
      },
    },
  },
  plugins: [],
};

export default config;
