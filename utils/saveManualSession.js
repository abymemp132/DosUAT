require("dotenv").config();

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { chromium } = require("@playwright/test");

async function waitForEnter(promptText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await new Promise((resolve) => rl.question(promptText, resolve));
  rl.close();
}

async function main() {
  const baseURL = process.env.BASE_URL;
  if (!baseURL) {
    throw new Error("BASE_URL is not configured.");
  }

  const authDir = path.join(process.cwd(), ".auth");
  const authStatePath = path.join(authDir, "user.json");
  const websiteUsername = process.env.WEBSITE_USERNAME || "";
  const websitePassword = process.env.WEBSITE_PASSWORD || "";
  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext(
    websiteUsername && websitePassword
      ? {
          httpCredentials: {
            username: websiteUsername,
            password: websitePassword
          }
        }
      : {}
  );
  const page = await context.newPage();

  await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  console.log("\nManual login window opened.");
  console.log("Complete login in the browser, then press Enter here to save the session.\n");
  await waitForEnter("Press Enter after you have logged in manually: ");

  await context.storageState({ path: authStatePath });
  await browser.close();
  console.log(`Saved authenticated session to ${authStatePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
