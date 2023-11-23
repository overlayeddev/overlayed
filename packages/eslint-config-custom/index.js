/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "prettier"],
  plugins: [],
  globals: {
    node: true,
  },
  rules: {
    // these are both handled by typescript
    "no-undef": "off",
    "no-unused-vars": "off",
    quotes: ["error", "double"],
  },
};
