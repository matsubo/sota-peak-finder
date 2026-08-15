import { defineConfig, devices } from "@playwright/test";

// Override with E2E_PORT when 5173 is already taken (e.g. by an SSH tunnel).
const PORT = Number(process.env.E2E_PORT ?? 5173);
const ORIGIN = `http://localhost:${PORT}`;
const APP_PATH = "/sota-peak-finder/";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: ORIGIN,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // --strictPort so a busy port fails loudly instead of silently drifting elsewhere.
    command: `bun run dev --port ${PORT} --strictPort`,
    // Wait on the app's own base path, not the bare origin: any unrelated process
    // listening on this port would otherwise be mistaken for the dev server and the
    // whole suite would run against it.
    url: `${ORIGIN}${APP_PATH}`,
    reuseExistingServer: !process.env.CI,
  },
});
