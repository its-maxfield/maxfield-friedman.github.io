import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://127.0.0.1:3000" },
  projects: [{ name: "mobile-safari", use: { ...devices["iPhone 13"] } }],
  webServer: { command: "npm run dev:site", url: "http://127.0.0.1:3000", reuseExistingServer: true },
});
