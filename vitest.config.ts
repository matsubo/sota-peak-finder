import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["node_modules/**", "e2e/**", "dist/**"],
    // jsdom so components and hooks are testable; pure util tests run unaffected.
    environment: "jsdom",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/__tests__/**", "src/main.tsx", "src/vite-env.d.ts", "src/locales/**"],
    },
  },
});
