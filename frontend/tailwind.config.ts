import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#006c0c",
        "primary-hover": "#004d08",
        "primary-container": "#1c871e",
        "on-primary-container": "#f8fff0",
        "background-custom": "#f8faf8",
        "surface-custom": "#faf9f6",
        "surface-dim": "#dadad7",
        "surface-container-low": "#f4f4f0",
        "surface-container": "#eeeeea",
        "surface-container-high": "#e8e8e5",
        "surface-container-highest": "#e2e3df",
        "on-surface": "#1a1c1a",
        "on-surface-variant": "#3f4a3b",
        "outline-variant": "#becab7",
        tertiary: "#a52a66",
        "tertiary-container": "#c5447f",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        sans: ["Manrope", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
