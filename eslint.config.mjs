// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  { ignores: ["dist", ".angular"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      // Suppress unused eslint-disable warnings
      "no-restricted-syntax": "off",
      "eslint-disable": "off",
      "eslint-disable-next-line": "off",

      // Every Recursica adapter component uses the "rec-" element/attribute
      // selector prefix — see angular.json's "prefix" and
      // docs/ADAPTER_INTEGRATION_REPORT.md's <rec-button> examples.
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "rec", style: "camelCase" },
      ],
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "rec", style: "kebab-case" },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
  },
  {
    // Storybook-only tooling (`.storybook/storybook-theme-sync.component.ts`)
    // is deliberately not part of the public adapter API, so it's exempt
    // from the "rec" selector prefix reserved for real, published Recursica
    // component selectors — see that file's own header comment.
    files: ["projects/adapter-angular-material/.storybook/**/*.ts"],
    rules: {
      "@angular-eslint/component-selector": "off",
    },
  },
  storybook.configs["flat/recommended"],
);
