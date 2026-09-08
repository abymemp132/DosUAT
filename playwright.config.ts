import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

const ENV = (process.env.TEST_ENV || "uat").toLowerCase();
const BASE_URLS: Record<string, string> = {
  dev: "http://dev.localhost:3000",
  uat: "https://dos-web-uat.abym.us/",
  staging: "https://dos-web-uat.abym.us/"
};

if (ENV === "prod" && !process.env.BASE_URL) {
  throw new Error("Set BASE_URL explicitly when TEST_ENV=prod.");
}

const baseURL = process.env.BASE_URL || BASE_URLS[ENV] || BASE_URLS.uat;
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
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/
    },
    {
      name: "auth",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: ".auth/user.json" },
      testMatch: /auth\/.*\.spec\.ts/
    },
    {
      name: "home",
      dependencies: ["auth"],
      use: { ...devices["Desktop Chrome"], storageState: ".auth/user.json" },
      testMatch: /home\/.*\.spec\.ts/
    },
    {
      name: "testCatalog",
      dependencies: ["home"],
      use: { ...devices["Desktop Chrome"], storageState: ".auth/user.json" },
      testMatch: /testCatalog\/.*\.spec\.ts/
    },
    {
      name: "forms",
      dependencies: ["testCatalog"],
      use: { ...devices["Desktop Chrome"], storageState: ".auth/user.json" },
      testMatch: /forms\/.*\.spec\.ts/
    },
    {
      name: "diseaseCondition",
      dependencies: ["forms"],
      use: { ...devices["Desktop Chrome"], storageState: ".auth/user.json" },
      testMatch: /diseaseCondition\/.*\.spec\.ts/
    },
    {
      name: "doctorSpeciality",
      dependencies: ["diseaseCondition"],
      use: { ...devices["Desktop Chrome"], storageState: ".auth/user.json" },
      testMatch: /doctorSpeciality\/.*\.spec\.ts/
    },
    {
      name: "brochure",
      dependencies: ["doctorSpeciality"],
      use: { ...devices["Desktop Chrome"], storageState: ".auth/user.json" },
      testMatch: /brochure\/.*\.spec\.ts/
    },
    {
      name: "faq",
      dependencies: ["brochure"],
      use: { ...devices["Desktop Chrome"], storageState: ".auth/user.json" },
      testMatch: /faq\/.*\.spec\.ts/
    },
    {
      name: "addToCart",
      dependencies: ["faq"],
      use: { ...devices["Desktop Chrome"], storageState: ".auth/user.json" },
      testMatch: /addToCart\/.*\.spec\.ts/
    }
  ]
});
