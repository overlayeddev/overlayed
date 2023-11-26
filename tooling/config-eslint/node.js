const { rules } = require("./utils/rules");

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  rules,
};
