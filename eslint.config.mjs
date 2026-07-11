// eslint.config.mjs — configuration flat native (ESLint 9)
// Remplace l'ancien .eslintrc.json (format legacy incompatible ESLint 9).
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "out/**",
      "release/**",
      "coverage/**",
      ".vite/**",
      "node_modules/**",
      "*.config.ts",
      "*.config.js",
      "*.config.mjs",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.electron,
  importPlugin.flatConfigs.typescript,
  {
    // Résout l'alias `@/*` (tsconfig paths) et les imports relatifs TS.
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.json", alwaysTryTypes: true },
        node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
      },
    },
  },
  {
    // Les imports d'assets Vite (`*.svg?react`, `*.svg?raw`) sont des
    // conventions Vite que le résolveur TypeScript ne peut pas résoudre :
    // ce sont des faux positifs, on les exclut de no-unresolved.
    // `no-explicit-any` est relégué en warning (le codebase utilise volontairement
    // `any` à plusieurs endroits ; un durcissement nécessiterait un refactor dédié).
    rules: {
      "import/no-unresolved": ["error", { ignore: ["\\?react$", "\\?raw$"] }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
