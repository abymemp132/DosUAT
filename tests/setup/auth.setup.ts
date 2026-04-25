import { test as setup, Page } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";
import { getOtpFromMailSlurp, clearMailSlurpInbox } from "../../utils/mailslurp.util";
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

function getRequiredLoginEmail(): string {
  const email = process.env.LOGIN_EMAIL?.trim() || "";
  if (!email) {
    throw new Error("LOGIN_EMAIL must be set in .env to create an authenticated session.");
  }
  return email;
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
    token: window.localStorage.getItem("authToken"),
    city: window.localStorage.getItem("CityId")
  }));

  if (sessionData.token && sessionData.city) {
    console.log("Existing session is still valid. Skipping login.");
    return true;
  }

  console.log("Saved auth markers are missing. Re-authenticating...");
  await page.context().clearCookies();
  await page.evaluate(() => window.localStorage.clear()).catch(() => {});
  return false;
}

setup("authenticate with dynamic OTP", async ({ page }) => {
  setup.setTimeout(300_000);

  const email = getRequiredLoginEmail();
  const envOtp = process.env.LOGIN_OTP?.trim() || "";
  const authFile = path.join(process.cwd(), ".auth", "user.json");

  // 1. ATTEMPT REUSE (Latency Saver)
  if (await reuseExistingSession(page, authFile)) {
    return;
  }

  const loginPage = new LoginPage(page);
  console.log(`Starting dynamic login for: ${email}`);

  let finalOtp = envOtp;

  if (!finalOtp) {
      console.log("LOGIN_OTP not found. Clearing MailSlurp inbox before requesting OTP...");
      await clearMailSlurpInbox();
      // Brief pause to ensure inbox clear completes server-side before we trigger OTP
      await page.waitForTimeout(2_000);
  }

  // 2. OPEN SITE & REQUEST OTP
  await loginPage.openHome();
  await loginPage.closeLocationModal("Delhi");
  await loginPage.openLoginModal();
  await loginPage.requestOtp(email);

  if (finalOtp) {
      console.log("Using static OTP from LOGIN_OTP environment variable.");
  } else {
      // 3. DYNAMIC FALLBACK (Using MailSlurp with retry)
      try {
          console.log("Attempting to fetch dynamic OTP from MailSlurp (with retry)...");
          finalOtp = await getOtpFromMailSlurp(3);
      } catch (error) {
          if (canRunInteractiveLogin()) {
              console.log("MailSlurp failed or not configured. Falling back to manual entry because interactive mode is ON.");
              console.log("Enter it in the opened browser, then resume the paused Playwright session.");
              await page.pause();
          } else {
              console.error("MailSlurp OTP extraction failed after all retries.");
              throw error;
          }
      }
  }

  // 4. VERIFY OTP
  if (finalOtp) {
      await loginPage.verifyOtp(finalOtp);
  }

  // 5. CONFIRM SESSION
  await loginPage.closeLocationModal("Delhi").catch(() => {});
  await loginPage.openProfileMenu();
  await loginPage.assertSessionIsActive();

  // 6. PERSISTENCE
  await page.context().storageState({ path: authFile });
  console.log(`Session successfully saved to ${authFile}`);
});
