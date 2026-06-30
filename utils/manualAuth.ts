import "dotenv/config";
import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { LoginPage } from "../pages/login.page";
import { getOtpFromTestmail } from "./testmail";

async function askForOtp(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(`${prompt}\nEnter OTP: `);
    return answer.trim();
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const baseURL = process.env.BASE_URL || "";
  const websiteUsername = process.env.WEBSITE_USERNAME || "";
  const websitePassword = process.env.WEBSITE_PASSWORD || "";
  const email = process.env.LOGIN_EMAIL?.trim() || "";
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

    const isTestmail = email.includes("inbox.testmail.app");

    if (otp) {
      console.log("Using LOGIN_OTP from .env.");
      await loginPage.verifyOtp(otp);
    } else if (isTestmail) {
      console.log("Fetching OTP from Testmail.app...");
      const tagMatch = email.match(/\.([^@]+)@/);
      const tag = tagMatch ? tagMatch[1] : null;
      
      if (!tag) {
        throw new Error(`Could not extract tag from testmail address: ${email}`);
      }
      
      const testmailOtp = await getOtpFromTestmail(tag);
      if (!testmailOtp) {
        throw new Error("Failed to fetch OTP from testmail.app within the timeout.");
      }
      
      console.log("OTP fetched successfully. Entering OTP.");
      await loginPage.verifyOtp(testmailOtp);
    } else {
      console.log("OTP requested successfully. If this fails, verify LOGIN_EMAIL belongs to an existing allowed account.");
      const manualOtp = await askForOtp("Check your email for the OTP.");
      if (manualOtp) {
        await loginPage.verifyOtp(manualOtp);
      } else {
        throw new Error("No OTP provided.");
      }
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
