import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

// NOTE: v9 is way diff
// https://eslint.org/blog/2022/08/new-config-system-part-1/
// https://eslint.org/blog/2022/08/new-config-system-part-2/

export default tseslint.config(
  {
    ignores: ["dist", "src-tauri"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
