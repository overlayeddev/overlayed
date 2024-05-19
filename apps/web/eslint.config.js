import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";

// NOTE: v9 is way diff
// https://eslint.org/blog/2022/08/new-config-system-part-1/
// https://eslint.org/blog/2022/08/new-config-system-part-2/

export default tseslint.config(
  {
    ignores: ["dist", ".vercel", "**/*.mjs", "**/*.d.ts"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      // TODO: I should turn this off
      "@typescript-eslint/no-explicit-any": "off",
    }
  }
);
