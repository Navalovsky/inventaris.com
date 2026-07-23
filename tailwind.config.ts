import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdaff",
          300: "#8ec2ff",
          400: "#589fff",
          500: "#3178ff",
          600: "#1b57f5",
          700: "#1543e0",
          800: "#1837b5",
          900: "#1a338f",
        },
      },
    },
  },
  plugins: [],
};
export default config;
