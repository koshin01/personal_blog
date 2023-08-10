/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: "#111827",
        secondary: "#737373",
        accent: "#FFF056",
      },
    },
  },

  plugins: [require("@tailwindcss/typography")],
};
