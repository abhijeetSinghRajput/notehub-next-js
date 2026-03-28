// postcss.config.mjs
const config = {
  plugins: {
    "postcss-font-display": {
      display: "swap",
      replace: true,
    },
    "@tailwindcss/postcss": {},
  },
};

export default config;