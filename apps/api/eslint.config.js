import baseConfig from "lint/node.js";
import tseslint from "typescript-eslint";

const config = tseslint.config(
	...baseConfig,
	{
		ignores: [".wrangler"],
	},
	{
		rules: {},
	},
);

export default config;
