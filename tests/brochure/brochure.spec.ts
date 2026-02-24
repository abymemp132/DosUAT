import { Page, test } from "@playwright/test";
import { BrochurePage } from "../../pages/brochure.page";
import { LoginPage } from "../../pages/login.page";
import { hasBaseUrl } from "../support/env";

const loginEmail = process.env.LOGIN_EMAIL || "abymemp132@gmail.com";
const loginOtp = process.env.LOGIN_OTP || "123456";
const city = "Delhi";

async function loginAsUser(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.loginWithEmailOtp(loginEmail, loginOtp, city);
  await loginPage.openProfileMenu();
  await loginPage.assertUserIsLoggedIn(loginEmail);
  await page.keyboard.press("Escape").catch(() => {});
}

test.describe("brochure page - without login (guest user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run guest brochure checks.");

  test("[Guest] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    const brochurePage = new BrochurePage(page);
    await brochurePage.openAndSelectCity(city);
    await brochurePage.assertPageShell();
  });

  test("[Guest] search by brochure works", async ({ page }) => {
    test.setTimeout(120_000);

    const brochurePage = new BrochurePage(page);
    await brochurePage.openAndSelectCity(city);
    await brochurePage.assertSearchBrochuresWorks();
  });

  test("[Guest] sharing links are reachable", async ({ page }) => {
    test.setTimeout(120_000);

    const brochurePage = new BrochurePage(page);
    await brochurePage.openAndSelectCity(city);
    await brochurePage.assertShareLinksAreReachable();
  });
});

test.describe("brochure page - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in brochure checks.");

  test("[Login] user can login with email and OTP", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);
  });

  test("[Login] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const brochurePage = new BrochurePage(page);
    await brochurePage.openAndSelectCity(city);
    await brochurePage.assertPageShell();
  });

  test("[Login] search by brochure works", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const brochurePage = new BrochurePage(page);
    await brochurePage.openAndSelectCity(city);
    await brochurePage.assertSearchBrochuresWorks();
  });

  test("[Login] sharing links are reachable", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const brochurePage = new BrochurePage(page);
    await brochurePage.openAndSelectCity(city);
    await brochurePage.assertShareLinksAreReachable();
  });
});
