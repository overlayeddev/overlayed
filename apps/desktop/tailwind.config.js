/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        // iPad Pro vertical is 1024px exactly
        lg: "300px",
        md: "200px",
        sm: "150px",
        xs: "100px",
      },
    },
  },
  plugins: [],
};
