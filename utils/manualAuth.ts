import "dotenv/config";
import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { LoginPage } from "../pages/login.page";

async function waitForEnter(prompt: string): Promise<void> {
  const rl = readline.createInterface({ input, output });
  try {
    await rl.question(`${prompt}\nPress Enter after you finish in the browser...`);
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const baseURL = process.env.BASE_URL || "";
  const websiteUsername = process.env.WEBSITE_USERNAME || "";
  const websitePassword = process.env.WEBSITE_PASSWORD || "";
  const email = process.env.LOGIN_EMAIL || "";
  const otp = process.env.LOGIN_OTP?.trim() || "";
  const authFile = path.join(process.cwd(), ".auth", "user.json");

  if (!baseURL) {
    throw new Error("BASE_URL is not set in .env.");
  }

  if (!websiteUsername || !websitePassword) {
    throw new Error("WEBSITE_USERNAME and WEBSITE_PASSWORD must be set in .env.");
  }

  if (!email) {
    throw new Error("LOGIN_EMAIL must be set in .env.");
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  console.log(`Opening manual login flow for: ${email}`);
  console.log(`Base URL: ${baseURL}`);

  const browser = await chromium.launch({ headless: false, slowMo: 150 });

  try {
    const context = await browser.newContext({
      baseURL,
      httpCredentials: {
        username: websiteUsername,
        password: websitePassword
      }
    });

    const page = await context.newPage();
    const loginPage = new LoginPage(page);

    await loginPage.openHome();
    await loginPage.closeLocationModal("Delhi");
    await loginPage.openLoginModal();
    await loginPage.requestOtp(email);

    if (otp) {
      console.log("Using LOGIN_OTP from .env.");
      await loginPage.verifyOtp(otp);
    } else {
      console.log("OTP requested successfully.");
      await waitForEnter("Enter OTP in the opened browser and click Verify.");
    }

    await loginPage.closeLocationModal("Delhi").catch(() => {});
    await loginPage.openProfileMenu();
    await loginPage.assertSessionIsActive();

    await context.storageState({ path: authFile });
    console.log(`Session saved to ${authFile}`);
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Manual auth failed: ${message}`);
  process.exitCode = 1;
});
