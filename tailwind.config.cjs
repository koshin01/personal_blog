/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    fontFamily: {
      sans: ["MPLUS1p", "ui-sans-serif", "system-ui"],
    },
    extend: {
      colors: {
        primary: "#111827",
        secondary: "#6b7280",
        accent: "#FFF056",
      },
    },
  },

  plugins: [require("@tailwindcss/typography")],
};
