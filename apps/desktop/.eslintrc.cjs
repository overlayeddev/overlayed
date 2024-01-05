/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [require.resolve("lint/vite-react")],
  rules: {
    // NOTE: this is an open issue https://github.com/shadcn-ui/ui/issues/120
    // most are just disabling the error for now
    "react/prop-types": [2, { ignore: ["className"] }],
  },
};
