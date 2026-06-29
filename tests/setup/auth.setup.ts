import { test as setup, Page } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";
import path from "path";
import fs from "fs";

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

async function reuseExistingSession(page: Page, authFile: string): Promise<boolean> {
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
    console.log("Existing session is still valid. Skipping login.");
    return true;
  }

  console.log("Saved auth markers are missing. Re-authenticating...");
  await page.context().clearCookies();
  await page.evaluate(() => window.localStorage.clear()).catch(() => {});
  return false;
}

setup("authenticate with interactive OTP", async ({ page }) => {
  setup.setTimeout(300_000);

  const email = process.env.LOGIN_EMAIL || "test@example.com";
  const otp = process.env.LOGIN_OTP?.trim() || "";
  const authFile = path.join(process.cwd(), ".auth", "user.json");

  if (await reuseExistingSession(page, authFile)) {
    return;
  }

  if (!otp && !canRunInteractiveLogin()) {
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
