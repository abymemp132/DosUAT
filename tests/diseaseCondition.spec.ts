import { Page, test } from "@playwright/test";
import { DiseaseConditionPage } from "../pages/diseaseCondition.page";
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

test.describe("disease condition page - without login (guest user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run guest disease condition checks.");

  test.beforeEach(async ({ page }) => {
    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.openAndSelectCity(city);
  });

  test("[Guest] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.assertPageShell();
  });

  test("[Guest] condition filter updates catalog", async ({ page }) => {
    test.setTimeout(120_000);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.assertConditionFilterChangesCatalog("Heart");
  });

  test("[Guest] search by test code works", async ({ page }) => {
    test.setTimeout(120_000);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.assertSearchByTestCodeWorks();
  });

  test("[Guest] add to cart shows login warning", async ({ page }) => {
    test.setTimeout(120_000);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.assertAddToCartShowsLoginWarning();
  });
});

test.describe("disease condition page - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in disease condition checks.");
  test.skip(!ensureAuthState(), "Run `npm run auth:manual` to create a reusable login session.");
  if (hasAuthState) {
    test.use({ storageState: authStatePath });
  }

  test.beforeEach(async ({ page }) => {
    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.openAndSelectCity(city);
  });

  test("[Login] saved session is active", async ({ page }) => {
    test.setTimeout(120_000);

    await assertSavedSession(page);
  });

  test("[Login] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.assertPageShell();
  });

  test("[Login] condition filter updates catalog", async ({ page }) => {
    test.setTimeout(120_000);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.assertConditionFilterChangesCatalog("Heart");
  });

  test("[Login] search by test code works", async ({ page }) => {
    test.setTimeout(120_000);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.assertSearchByTestCodeWorks();
  });
});
