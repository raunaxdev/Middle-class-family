import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#047857",
          hover: "#065F46",
          active: "#064E3B",
          light: "#ECFDF5",
          border: "#A7F3D0",
        },
        slate: {
          text: "#0F172A",
          muted: "#64748B",
          subtle: "#94A3B8",
          border: "#E2E8F0",
          card: "#F1F5F9",
        },
        amber: {
          alert: "#B45309",
          alertLight: "#FFFBEB",
          alertBorder: "#FDE68A",
        },
        danger: {
          DEFAULT: "#B91C1C",
          light: "#FEF2F2",
          border: "#FECACA",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
