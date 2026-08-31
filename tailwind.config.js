/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: {
          bgPrimary: "var(--background-primary)",
          bgPrimaryAlt: "var(--background-primary-alt)",
          bgSecondary: "var(--background-secondary)",
          bgSecondaryAlt: "var(--background-secondary-alt)",
          textNormal: "var(--text-normal)",
          textMuted: "var(--text-muted)",
          textFaint: "var(--text-faint)",
          accent: "var(--interactive-accent)",
          accentHover: "var(--interactive-accent-hover)",
          border: "var(--background-modifier-border)",
          hover: "var(--background-modifier-hover)",
        },
      },
    },
  },
  plugins: [],
};
