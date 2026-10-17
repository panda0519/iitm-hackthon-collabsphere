import theme from "./src/config/tailwind-theme.js";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: theme },
  plugins: []
};
