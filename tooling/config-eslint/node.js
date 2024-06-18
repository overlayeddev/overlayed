import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

const config = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["node_modules/", "dist/"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    rules: {
      quotes: ["error", "double"],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);

export default config;
