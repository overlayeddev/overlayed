import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";

const config = tseslint.config(
  js.configs.recommended,
  eslintPluginPrettierRecommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["node_modules/", "dist/"],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        process: true
      },
    },
    rules: {
      quotes: ["error", "double"],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);

export default config;
