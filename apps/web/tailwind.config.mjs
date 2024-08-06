/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: "#5865F2",
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            maxWidth: "100ch", // add required value here
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            code: {
              backgroundColor: theme("colors.zinc.800"),
              borderRadius: "0.25rem",
              border: `1px solid ${theme("colors.zinc.700")}`,
              padding: "4px 6px 4px 6px",
            },
          },
        },
      }),
      keyframes: {
        "background-shine": {
          from: {
            backgroundPosition: "0 0",
          },
          to: {
            backgroundPosition: "-200% 0",
          },
        },
      },
      animation: {
        "background-shine": "background-shine 2s linear infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
