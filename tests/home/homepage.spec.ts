import { Page } from "@playwright/test";
import { test } from "../../fixtures/testData.fixture";
import { HomePage } from "../../pages/home/home.page";
import { LoginPage } from "../../pages/auth/login.page";
import { authStatePath, hasAuthState } from "../support/auth";
import { hasBaseUrl } from "../support/env";
async function assertSavedSession(page: Page, city: string): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.openHome();
  await loginPage.closeLocationModal(city);
  await loginPage.openProfileMenu();
  await loginPage.assertSessionIsActive();
  await page.keyboard.press("Escape").catch(() => {});
}

test.describe("home page - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in home checks.");
  test.use({ storageState: authStatePath });

  test.beforeEach(async ({ page, city }) => {
    test.skip(!hasAuthState(), "Run `npm run auth:manual` or allow setup project to create a reusable login session.");
    const homePage = new HomePage(page);
    await homePage.ensureHomeReady(city.name);
  });

  test("[Login] saved session is active", async ({ page, city }) => {
    test.setTimeout(120_000);

    await assertSavedSession(page, city.name);
  });

  test("[Login] loads home page and shows core modules", async ({ page }) => {
    test.setTimeout(120_000);

    const homePage = new HomePage(page);
    await homePage.assertTopNavigation();
    await homePage.assertCoreHomeWidgets();
  });

  test("[Login] top navigation links route to expected pages", async ({ page, city }) => {
    test.setTimeout(180_000);

    const homePage = new HomePage(page);
    await homePage.assertTopNavigationLinksRoute(city.name, { skipSetup: true });
  });

  test("[Login] all header icons open expected page or modal", async ({ page, city, user }) => {
    test.setTimeout(180_000);

    const homePage = new HomePage(page);
    await homePage.assertHeaderIconsOpenExpectedViewsForLoggedIn(user.email, city.name, { skipSetup: true });
  });

  test("[Login] search works with icon click and Enter key", async ({ page, city }) => {
    test.setTimeout(60_000);

    const homePage = new HomePage(page);
    await homePage.assertSearchWorksWithIconAndEnter(city.name, { skipSetup: true });
  });

  test("[Login] eye icon opens and closes details", async ({ page, city }) => {
    test.setTimeout(120_000);

    const homePage = new HomePage(page);
    await homePage.assertEyeIconOpensAndClosesDetails(city.name, { skipSetup: true });
  });

  test("[Login] add to cart updates cart count", async ({ page, city }) => {
    test.setTimeout(120_000);

    const homePage = new HomePage(page);
    await homePage.assertLoggedInAddToCartUpdatesCartCount(city.name, { skipSetup: true });
  });

  test("[Login] download selected works without login modal", async ({ page, city }) => {
    test.setTimeout(120_000);

    const homePage = new HomePage(page);
    await homePage.assertLoggedInDownloadSelectedWorks(city.name, { skipSetup: true });
  });

  test("[Login] pagination works on home catalog", async ({ page, city }) => {
    test.setTimeout(120_000);

    const homePage = new HomePage(page);
    await homePage.assertPaginationWorks(city.name, { skipSetup: true });
  });
});
