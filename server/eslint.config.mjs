import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.js", "**/*.ts"],
    languageOptions: {
      // Enable CommonJS require syntax
      sourceType: "commonjs",
    },
    rules: {
      // Disable rules that conflict with CommonJS if necessary
      "no-var-requires": "off",
    },
  },
  {
    languageOptions: {
      globals: globals.browser,
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];