/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: "#111827",
        secondary: "#70747d",
        accent: "#FFF056",
        hoveredPrimary: "#585d67",
      },
    },
  },

  plugins: [require("@tailwindcss/typography")],
};
