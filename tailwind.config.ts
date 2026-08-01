import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "rgb(var(--c-void) / <alpha-value>)",
        panel: "rgb(var(--c-panel) / <alpha-value>)",
        panel2: "rgb(var(--c-panel2) / <alpha-value>)",
        line: "var(--c-line)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        "ink-dim": "rgb(var(--c-ink-dim) / <alpha-value>)",
        "ink-faint": "rgb(var(--c-ink-faint) / <alpha-value>)",
        pink: {
          DEFAULT: "rgb(var(--c-pink) / <alpha-value>)",
          dim: "rgb(var(--c-pink-dim) / <alpha-value>)",
        },
        cyan: {
          DEFAULT: "rgb(var(--c-cyan) / <alpha-value>)",
          dim: "rgb(var(--c-cyan-dim) / <alpha-value>)",
        },
        amber: {
          DEFAULT: "rgb(var(--c-amber) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      animation: {
        "pulse-dot": "pulseDot 1.6s ease-in-out infinite",
        "particle-float": "particleFloat 3s ease-in-out infinite",
        "splash-in": "splashIn 0.7s ease-out both",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.8)" },
        },
        particleFloat: {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.5" },
          "50%": { transform: "translateY(-18px)", opacity: "1" },
        },
        splashIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
