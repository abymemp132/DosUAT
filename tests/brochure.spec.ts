import { Page, test } from "@playwright/test";
import { BrochurePage } from "../pages/brochure.page";
import { LoginPage } from "../pages/login.page";
import { authStatePath, hasAuthState, ensureAuthState } from "./support/auth";
import { hasBaseUrl } from "./support/env";

const city = "Delhi";

async function assertSavedSession(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.openHome();
  await loginPage.closeLocationModal(city);
  await loginPage.openProfileMenu();
  await loginPage.assertSessionIsActive();
  await page.keyboard.press("Escape").catch(() => {});
}

test.describe("brochure page - without login (guest user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run guest brochure checks.");

  test.beforeEach(async ({ page }) => {
    const brochurePage = new BrochurePage(page);
    await brochurePage.openAndSelectCity(city);
  });

  test("[Guest] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    const brochurePage = new BrochurePage(page);
    await brochurePage.assertPageShell();
  });

  test("[Guest] search by brochure works", async ({ page }) => {
    test.setTimeout(120_000);

    const brochurePage = new BrochurePage(page);
    await brochurePage.assertSearchBrochuresWorks();
  });

  test("[Guest] sharing links are reachable", async ({ page }) => {
    test.setTimeout(120_000);

    const brochurePage = new BrochurePage(page);
    await brochurePage.assertShareLinksAreReachable();
  });
});

test.describe("brochure page - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in brochure checks.");
  test.skip(!ensureAuthState(), "Run `npm run auth:manual` to create a reusable login session.");
  if (hasAuthState) {
    test.use({ storageState: authStatePath });
  }

  test.beforeEach(async ({ page }) => {
    const brochurePage = new BrochurePage(page);
    await brochurePage.openAndSelectCity(city);
  });

  test("[Login] saved session is active", async ({ page }) => {
    test.setTimeout(120_000);

    await assertSavedSession(page);
  });

  test("[Login] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    const brochurePage = new BrochurePage(page);
    await brochurePage.assertPageShell();
  });

  test("[Login] search by brochure works", async ({ page }) => {
    test.setTimeout(120_000);

    const brochurePage = new BrochurePage(page);
    await brochurePage.assertSearchBrochuresWorks();
  });

  test("[Login] sharing links are reachable", async ({ page }) => {
    test.setTimeout(120_000);

    const brochurePage = new BrochurePage(page);
    await brochurePage.assertShareLinksAreReachable();
  });
});
