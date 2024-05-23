import tseslint from "typescript-eslint";

import baseConfig from "lint/node.js";

// TODO: make work for next
const config = tseslint.config(
	...baseConfig,
	{
		ignores: ["src-tauri/"],
	},
	{
		rules: {},
	},
);

export default config;
