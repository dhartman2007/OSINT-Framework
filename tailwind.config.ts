import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b111a",
        panel: "#111926",
        panelAlt: "#162132",
        border: "#2a3b55",
        accent: "#36c46f",
        accentBlue: "#4c9cff",
        warning: "#f39b34",
        danger: "#d84646",
      },
      boxShadow: {
        panel: "0 14px 34px rgba(0, 0, 0, 0.35)",
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "Segoe UI", "sans-serif"],
        display: ['"Space Grotesk"', '"IBM Plex Sans"', "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "radial-console":
          "radial-gradient(circle at 15% 15%, rgba(76, 156, 255, 0.13), transparent 55%), radial-gradient(circle at 85% 0%, rgba(54, 196, 111, 0.12), transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
