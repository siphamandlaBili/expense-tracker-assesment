import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import testingLibrary from "eslint-plugin-testing-library";
import jestDom from "eslint-plugin-jest-dom";
import vitest from "@vitest/eslint-plugin";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist",
    "coverage",
    "playwright-report",
    "test-results",
    "blob-report",
    "public/mockServiceWorker.js",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Unit and component tests (Vitest + Testing Library).
    files: ["src/**/*.test.{ts,tsx}"],
    extends: [
      vitest.configs.recommended,
      testingLibrary.configs["flat/react"],
      jestDom.configs["flat/recommended"],
    ],
    rules: {
      "vitest/expect-expect": [
        "error",
        {
          assertFunctionNames: [
            "expect",
            "expectNoA11yViolations",
            "expectApiError",
          ],
        },
      ],
    },
  },
  {
    // Shared test helpers export non-components alongside JSX wrappers.
    files: ["src/test/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["e2e/**/*.ts", "playwright.config.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
