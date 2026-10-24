import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import en from "./src/i18n/locales/en.json" with { type: "json" };

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// The page title and meta description must be in the HTML itself (crawlers
// read it before any JS runs), but their text lives with the rest of the
// copy in en.json; this fills in index.html's placeholders from there.
function htmlMeta(): Plugin {
  return {
    name: "html-meta",
    transformIndexHtml: (html) =>
      html
        .replace("%META_TITLE%", escapeHtml(en.meta.title))
        .replace("%META_DESCRIPTION%", escapeHtml(en.meta.description)),
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), htmlMeta()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    // Page-level tests render the whole app (charts included) and type
    // character by character; coverage instrumentation slows them further.
    testTimeout: 15_000,
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/i18n/index.ts",
        "src/test/**",
      ],
      reporter: ["text", "html", "lcov"],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
