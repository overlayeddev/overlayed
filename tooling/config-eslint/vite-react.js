const { rules } = require("./utils/rules");

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  extends: ["eslint:recommended", "plugin:react/recommended"],
  ignorePatterns: ["**/*.css", "**/.eslintrc.cjs", "**/node_modules/**", "public/**"],
  parser: "@typescript-eslint/parser",
  root: true,
  rules,
};
