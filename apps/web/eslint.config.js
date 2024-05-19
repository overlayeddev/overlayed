import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";

// NOTE: v9 is way diff
// https://eslint.org/blog/2022/08/new-config-system-part-1/
// https://eslint.org/blog/2022/08/new-config-system-part-2/

// module.exports = {
//   extends: [require.resolve("lint/node")],
//   overrides: [
//     {
//       files: ["*.astro"],
//       parser: "astro-eslint-parser",
//       parserOptions: {
//         parser: "@typescript-eslint/parser",
//         extraFileExtensions: [".astro"],
//       },
//       rules: {},
//     },
//   ],
// };

// TODO: tracking support via https://github.com/eslint/eslint/issues/18391
export default tseslint.config(
  {
    ignores: ["dist", ".vercel"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
);
