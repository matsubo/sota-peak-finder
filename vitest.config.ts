import { defineConfig } from "vitest/config";

export default defineConfig({
  // Build-time constants come from vite.config.ts, which vitest does not read.
  // Without these, anything importing sotaDatabase throws on __DB_VERSION__.
  define: {
    __APP_VERSION__: JSON.stringify("test"),
    __DB_VERSION__: JSON.stringify("test"),
  },
  test: {
    exclude: ["node_modules/**", "e2e/**", "dist/**"],
    // jsdom so components and hooks are testable; pure util tests run unaffected.
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/__tests__/**",
        "src/test/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/locales/**",
        "src/types/**",
      ],
    },
  },
});
