// @ts-check

import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

import nextTS from "eslint-config-next/typescript";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig(
  eslint.configs.recommended,
  reactRefresh.configs.next,
  reactHooks.configs.flat.recommended,
  ...nextTS,
  ...nextVitals,
  {
    languageOptions: {
      ecmaVersion: 2021,
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./tsconfig.json",
      },
    },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowExportNames: ["metadata",] },
      ],
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/consistent-type-definitions": "off",
    },
  },
  globalIgnores([
    "node_modules/**",
    "dist/**",
    "out/**",
    ".next/**",
    "public/**",

    "src/prisma/generated/**",
    "src/components/ui/**",

    "scripts/**",
  ]),
);
