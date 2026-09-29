import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // ImpactGrid design system (matches the Events site): warm cream page,
      // white cards, near-black ink. Names kept so existing classes still work:
      //   ink = page background, ink2 = card surface, paper = main text colour.
      colors: {
        ink: "#faf7f2",
        ink2: "#ffffff",
        sand: "#f3ede3",
        paper: "#0d0d0d",
        line: "#e6dfd2",
        line2: "#d9d0bf",
        blueprint: "#161616",
        blueprint2: "#2d6edb",
        signal: "#161616",
        slate: "#4a4a4a",
        slateLight: "#6b6b6b",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(13,13,13,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(13,13,13,0.05) 1px, transparent 1px)",
        gridLight: "linear-gradient(rgba(15,17,21,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,17,21,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
    },
  },
  plugins: [],
};

export default config;
