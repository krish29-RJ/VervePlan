import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        utsav: {
          bg: "rgb(var(--utsav-bg-rgb) / <alpha-value>)",
          surface: "rgb(var(--utsav-surface-rgb) / <alpha-value>)",
          elevated: "rgb(var(--utsav-elevated-rgb) / <alpha-value>)",
          primary: "rgb(var(--utsav-primary-rgb) / <alpha-value>)",
          deep: "rgb(var(--utsav-deep-rgb) / <alpha-value>)",
          coral: "#FF8075",
          gold: "#F4C56A",
          text: "rgb(var(--utsav-text-rgb) / <alpha-value>)",
          muted: "rgb(var(--utsav-muted-rgb) / <alpha-value>)",
        },
        background: "rgb(var(--utsav-bg-rgb) / <alpha-value>)",
        foreground: "rgb(var(--utsav-text-rgb) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--utsav-primary-rgb) / <alpha-value>)",
          foreground: "#FFFFFF",
          deep: "rgb(var(--utsav-deep-rgb) / <alpha-value>)",
        },
        accent: {
          coral: "#FF8075",
          gold: "#F4C56A",
        },
      },
      opacity: {
        "3": "0.03",
        "6": "0.06",
        "8": "0.08",
        "12": "0.12",
        "15": "0.15",
        "35": "0.35",
        "85": "0.85",
        "95": "0.95",
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '"Manrope"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        display: [
          '"Plus Jakarta Sans"',
          '"Manrope"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(36, 29, 57, 0.04)",
        xs: "0 1px 3px 0 rgba(36, 29, 57, 0.06)",
        soft: "0 4px 20px -2px rgba(116, 86, 232, 0.14), 0 2px 6px -1px rgba(36, 29, 57, 0.05)",
        glow: "0 12px 36px -6px rgba(116, 86, 232, 0.30), 0 4px 12px -2px rgba(255, 128, 117, 0.14)",
        card: "0 2px 12px -2px rgba(36, 29, 57, 0.05), 0 12px 28px -6px rgba(116, 86, 232, 0.07)",
        "card-hover":
          "0 10px 32px -4px rgba(116, 86, 232, 0.18), 0 4px 12px -2px rgba(36, 29, 57, 0.06)",
      },
      backdropBlur: {
        xs: "4px",
      },
      backgroundImage: {
        "utsav-gradient":
          "linear-gradient(135deg, #7456E8 0%, #5B3FD1 55%, #4934A6 100%)",
        "utsav-warm":
          "linear-gradient(135deg, #7456E8 0%, #B865B4 55%, #FF8075 100%)",
        "utsav-mesh":
          "radial-gradient(at 15% 15%, rgba(116, 86, 232, 0.14) 0px, transparent 50%), radial-gradient(at 85% 20%, rgba(255, 128, 117, 0.12) 0px, transparent 50%), radial-gradient(at 50% 85%, rgba(244, 197, 106, 0.12) 0px, transparent 50%)",
      },
      borderRadius: {
        xs: "0.25rem",
        "2xl": "1rem",
        "3xl": "1.375rem",
        "4xl": "1.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
