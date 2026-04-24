import { Page, test } from "@playwright/test";
import { FormsPage } from "../pages/forms.page";
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

test.describe("test requisition & consent forms page - without login (guest user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run guest consent forms checks.");

  test.beforeEach(async ({ page }) => {
    const formsPage = new FormsPage(page);
    await formsPage.openAndSelectCity(city);
  });

  test("[Guest] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    const formsPage = new FormsPage(page);
    await formsPage.assertPageShell();
  });

  test("[Guest] search by consent works", async ({ page }) => {
    test.setTimeout(120_000);

    const formsPage = new FormsPage(page);
    await formsPage.assertSearchByConsentWorks("MammaPrint", "MammaPrint TRF");
  });

  test("[Guest] sharing links are reachable", async ({ page }) => {
    test.setTimeout(120_000);

    const formsPage = new FormsPage(page);
    await formsPage.assertShareLinksAreReachable();
  });
});

test.describe("test requisition & consent forms page - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in consent forms checks.");
  test.skip(!ensureAuthState(), "Run `npm run auth:manual` to create a reusable login session.");
  if (hasAuthState) {
    test.use({ storageState: authStatePath });
  }

  test.beforeEach(async ({ page }) => {
    const formsPage = new FormsPage(page);
    await formsPage.openAndSelectCity(city);
  });

  test("[Login] saved session is active", async ({ page }) => {
    test.setTimeout(120_000);

    await assertSavedSession(page);
  });

  test("[Login] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    const formsPage = new FormsPage(page);
    await formsPage.assertPageShell();
  });

  test("[Login] search by consent works", async ({ page }) => {
    test.setTimeout(120_000);

    const formsPage = new FormsPage(page);
    await formsPage.assertSearchByConsentWorks("MammaPrint", "MammaPrint TRF");
  });

  test("[Login] sharing links are reachable", async ({ page }) => {
    test.setTimeout(120_000);

    const formsPage = new FormsPage(page);
    await formsPage.assertShareLinksAreReachable();
  });
});
