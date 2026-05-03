import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        paper: "#fbfaf7",
        line: "#e7e2d8",
        mint: "#2f8f72",
        berry: "#b0416f",
        sun: "#f1b84b",
      },
      boxShadow: {
        soft: "0 12px 40px rgba(23, 23, 23, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
