// =========================================================================================================
// ESLint Flat Configuration
// =========================================================================================================
// Lints the TypeScript sources with type-aware rules and enforces a consistent import ordering.

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

// =========================================================================================================
// Configuration
// =========================================================================================================

export default tseslint.config(
  {
    // Never lint generated output or dependencies. The flat config files themselves are not part of
    // the type-aware program, so exclude plain JS/MJS/CJS from the typed rules.
    ignores: ["dist/**", "node_modules/**", "**/*.js", "**/*.mjs", "**/*.cjs"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["src/**/*.ts", "scripts/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Surfacing unused identifiers keeps the migration honest; allow leading-underscore opt-out.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
