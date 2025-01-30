import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";

// TODO: fix this?
import baseConfig from "lint/node.js";

const config = tseslint.config(
  ...baseConfig,
  {
    ignores: [".astro", ".vercel", "*.mjs"],
  },
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {},
  },
);

export default config;
