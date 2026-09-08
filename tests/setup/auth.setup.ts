import { test as setup, Page } from "@playwright/test";
import { LoginPage } from "../../pages/auth/login.page";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { getOtpFromTestmail } from "../../utils/testmail";

dotenv.config();

function readTokenExpiry(token: string | null): number | null {
  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf-8")) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function canRunInteractiveLogin(): boolean {
  return process.env.PWDEBUG === "1" || process.env.PWDEBUG === "console" || process.env.PLAYWRIGHT_INTERACTIVE_LOGIN === "1";
}

async function reuseExistingSession(page: Page, authFile: string, email: string): Promise<boolean> {
  if (!fs.existsSync(authFile)) {
    return false;
  }

  const state = JSON.parse(fs.readFileSync(authFile, "utf-8"));
  const dosOrigin = state.origins?.find((origin: { origin?: string }) => origin.origin?.includes("dos-web-uat"));
  const authToken = dosOrigin?.localStorage?.find((item: { name?: string; value?: string }) => item.name === "authToken")?.value ?? null;
  const tokenExpiry = readTokenExpiry(authToken);
  const tokenIsFresh = tokenExpiry ? tokenExpiry * 1000 > Date.now() : false;

  if (!tokenIsFresh) {
    const expiryText = tokenExpiry ? new Date(tokenExpiry * 1000).toISOString() : "unknown";
    console.log(`Saved auth session is expired or invalid (exp: ${expiryText}). Re-authenticating...`);
    fs.rmSync(authFile, { force: true });
    return false;
  }

  await page.context().addCookies(state.cookies ?? []);
  await page.goto("/");

  if (dosOrigin?.localStorage) {
    await page.evaluate((localStorageItems: Array<{ name: string; value: string }>) => {
      for (const item of localStorageItems) {
        window.localStorage.setItem(item.name, item.value);
      }
    }, dosOrigin.localStorage);
  }

  const sessionData = await page.evaluate(() => ({
    token: window.localStorage.getItem("authToken")
  }));

  if (sessionData.token) {
    try {
      const loginPage = new LoginPage(page);
      await loginPage.openProfileMenu();
      await loginPage.assertSessionIsActive(email);
      console.log("Existing session is valid and verified. Skipping login.");
      return true;
    } catch (error) {
      console.log(`Saved session token exists but failed active session verification: ${error instanceof Error ? error.message : error}. Re-authenticating...`);
      fs.rmSync(authFile, { force: true });
      await page.context().clearCookies();
      await page.evaluate(() => window.localStorage.clear()).catch(() => {});
      return false;
    }
  }

  console.log("Saved auth markers are missing. Re-authenticating...");
  await page.context().clearCookies();
  await page.evaluate(() => window.localStorage.clear()).catch(() => {});
  return false;
}

setup("authenticate with interactive OTP", async ({ page }) => {
  setup.setTimeout(300_000);

  const email = process.env.LOGIN_EMAIL || "twkxl.test@inbox.testmail.app";
  const otp = process.env.LOGIN_OTP?.trim() || "";
  const authFile = path.join(process.cwd(), ".auth", "user.json");

  if (await reuseExistingSession(page, authFile, email)) {
    return;
  }

  const isTestmail = email.includes("inbox.testmail.app");

  if (!otp && !isTestmail && !canRunInteractiveLogin()) {
    throw new Error(
      [
        "No reusable auth session was found and LOGIN_OTP is empty.",
        "Run `npm run auth:manual` to create `.auth/user.json`, or set LOGIN_OTP for a non-interactive run."
      ].join(" ")
    );
  }

  const loginPage = new LoginPage(page);
  console.log(`Starting login for: ${email}`);

  await loginPage.openHome();
  await loginPage.closeLocationModal("Delhi");
  await loginPage.openLoginModal();
  await loginPage.requestOtp(email);

  if (otp) {
    console.log("Auto-entering OTP from LOGIN_OTP.");
    await loginPage.verifyOtp(otp);
  } else if (isTestmail) {
    console.log("Fetching OTP from Testmail.app...");
    // Extract tag from format: namespace.tag@inbox.testmail.app
    const tagMatch = email.match(/\.([^@]+)@/);
    const tag = tagMatch ? tagMatch[1] : null;
    
    if (!tag) {
      throw new Error(`Could not extract tag from testmail address: ${email}`);
    }
    
    const testmailOtp = await getOtpFromTestmail(tag, 60000);
    if (!testmailOtp) {
      throw new Error(
        "Failed to fetch OTP from testmail.app within 60 seconds. " +
        "Ensure UAT backend sends emails to testmail.app, or set LOGIN_OTP / provide valid .auth/user.json."
      );
    }
    
    console.log("OTP fetched successfully. Entering OTP.");
    await loginPage.verifyOtp(testmailOtp);
  } else {
    console.log("OTP sent. Enter it in the opened browser, then resume the paused Playwright session.");
    await page.pause();
  }

  await loginPage.closeLocationModal("Delhi").catch(() => {});
  await loginPage.openProfileMenu();
  await loginPage.assertSessionIsActive();

  await page.context().storageState({ path: authFile });
  console.log(`Session saved to ${authFile}`);
});
