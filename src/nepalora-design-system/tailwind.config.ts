import type { Config } from "tailwindcss";

// Assumes Tailwind (already in most Next.js starters — zero extra runtime
// dependency, it compiles away). If you're on plain CSS instead, skip this
// file and just use the variables from globals.css directly.

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-elevated": "var(--bg-elevated)",
        ink: "var(--text)",
        "ink-secondary": "var(--text-secondary)",
        "ink-tertiary": "var(--text-tertiary)",
        hairline: "var(--hairline)",
        "accent-red": "var(--accent-red)",
        "accent-blue": "var(--accent-blue)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 500ms var(--ease-out) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
