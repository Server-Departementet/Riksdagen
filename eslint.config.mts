import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";

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
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
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
    "dist/**",
    "node_modules/**",
    "scripts/**",
    "*.config.js",
    "*.config.ts",
    "tailwind.config.js",
    "**/*.d.ts",
    ".next/**",
    "out/**",
    "public/**",
    "**/prisma/client/**",
    "scripts/**",
    "src/components/ui/**",
  ]),
);
