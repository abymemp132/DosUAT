import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const ENV = process.env.TEST_ENV || 'staging';
const BASE_URLS: Record<string, string> = {
  dev: 'http://dev.localhost:3000',
  staging: 'http://127.0.0.1:3000',
  prod: 'https://production-url.com',
};

const baseURL = process.env.BASE_URL || BASE_URLS[ENV];
const websiteUsername = process.env.WEBSITE_USERNAME || "";
const websitePassword = process.env.WEBSITE_PASSWORD || "";
const hasWebsiteCredentials = Boolean(websiteUsername && websitePassword);

function globalSetup() {
  // Global checks
}

export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/modules/**"],
  globalSetup: "./config/global-setup.ts",
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: true,
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
      name: "guest",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /.*\.spec\.ts/,
      grepInvert: /\[Login\]|auth/i, // Skip login and auth tests here
    },
    {
      name: "chromium",
      dependencies: ['setup'],
      use: { 
        ...devices["Desktop Chrome"],
        storageState: '.auth/user.json',
      },
      testMatch: /.*\.spec\.ts/,
      grep: /\[Login\]|auth/i, // Run auth and login-required tests here
    }
  ]
});
