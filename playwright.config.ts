import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

const ENV = (process.env.TEST_ENV || "staging").toLowerCase();
const BASE_URLS: Record<string, string> = {
  dev: "http://dev.localhost:3000",
  staging: "https://dos-web-uat.abym.us/"
};

if (ENV === "prod" && !process.env.BASE_URL) {
  throw new Error("Set BASE_URL explicitly when TEST_ENV=prod.");
}

const baseURL = process.env.BASE_URL || BASE_URLS[ENV] || BASE_URLS.staging;
const websiteUsername = process.env.WEBSITE_USERNAME || "";
const websitePassword = process.env.WEBSITE_PASSWORD || "";
const hasWebsiteCredentials = Boolean(websiteUsername && websitePassword);

export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/modules/**"],
  globalSetup: "./config/global-setup.ts",
  timeout: process.env.CI ? 180_000 : 60_000,
  expect: {
    timeout: process.env.CI ? 20_000 : 10_000
  },
  // Authenticated tests share one account and mutable cart state.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"], 
    ["html", { open: "never", outputFolder: process.env.PLAYWRIGHT_HTML_OUTPUT_DIR || "playwright-report" }],
    ["json", { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME || "reports/results.json" }],
    ["junit", { outputFile: process.env.PLAYWRIGHT_JUNIT_OUTPUT_NAME || "reports/results.xml" }]
  ],
  use: {
    baseURL,
    ...(hasWebsiteCredentials
      ? {
          httpCredentials: {
            username: websiteUsername,
            password: websitePassword
          }
        }
      : {}),
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "guest-chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /.*\.spec\.ts/,
      grepInvert: /\[Login\]/
    },
    {
      name: "authenticated-chromium",
      dependencies: ["setup"],
      use: { 
        ...devices["Desktop Chrome"],
        storageState: '.auth/user.json',
      },
      testMatch: /.*\.spec\.ts/,
      grep: /\[Login\]/
    }
  ]
});
