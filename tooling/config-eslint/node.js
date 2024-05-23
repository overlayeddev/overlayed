import js from "@eslint/js";
import tseslint from "typescript-eslint";

const config = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["node_modules/", "dist/"],
  },
  {
    rules: {
      quotes: ["error", "double"],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);

export default config;
