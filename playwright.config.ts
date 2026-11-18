import { defineConfig } from "@playwright/test";

// Run against a local seeded guide (npm run dev, or npm start for offline QA).
export default defineConfig({
  testDir: "./e2e",
  timeout: 45000,
  expect: { timeout: 7000 },
  workers: 2,
  reporter: "list",
  use: {
    baseURL: process.env.MAP_TEST_URL || "http://127.0.0.1:3000",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    launchOptions: process.env.CHROMIUM_PATH
      ? {
          executablePath: process.env.CHROMIUM_PATH,
          args: ["--disable-gpu", "--no-zygote"],
        }
      : {},
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1366, height: 854 } } },
    {
      name: "phone",
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
});
