/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F97316",
          dark: "#EA580C",
        },
        warm: {
          DEFAULT: "#FFF7ED",
        },
      },
      boxShadow: {
        soft: "0 16px 40px rgba(17, 24, 39, 0.08)",
        "orange-glow": "0 16px 36px rgba(249, 115, 22, 0.28)",
      },
    },
  },
  plugins: [],
}
