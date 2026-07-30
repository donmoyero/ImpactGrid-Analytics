import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0F1115",
        ink2: "#15181F",
        paper: "#F7F5EF",
        line: "#262A33",
        line2: "#E4E0D6",
        blueprint: "#3856F0",
        blueprint2: "#6E85FF",
        signal: "#FF5A3C",
        slate: "#8A8F9C",
        slateLight: "#6B6F76",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
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
