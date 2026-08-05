import type { Config } from "tailwindcss";

function withOpacity(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: withOpacity("--paper"),
        surface: withOpacity("--surface"),
        ink: withOpacity("--ink"),
        muted: withOpacity("--muted"),
        faint: withOpacity("--faint"),
        line: withOpacity("--line"),
        "line-soft": withOpacity("--line-soft"),
        "line-strong": withOpacity("--line-strong"),
        disabled: withOpacity("--disabled"),
        inverse: withOpacity("--inverse"),

        accent: withOpacity("--accent"),
        "accent-strong": withOpacity("--accent-strong"),
        "accent-tint": withOpacity("--accent-tint"),

        berry: withOpacity("--berry"),
        "berry-strong": withOpacity("--berry-strong"),
        "berry-tint": withOpacity("--berry-tint"),
        "berry-border": withOpacity("--berry-border"),

        sun: withOpacity("--sun"),
        "sun-tint": withOpacity("--sun-tint"),
        "sun-border": withOpacity("--sun-border"),
      },
      boxShadow: {
        soft: "0 12px 40px rgba(23, 23, 23, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
