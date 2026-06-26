import { Page } from "@playwright/test";
import { test } from "../../fixtures/testData.fixture";
import { HomePage } from "../../pages/home.page";
import { LoginPage } from "../../pages/login.page";
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

test.describe("home page - without login (guest user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run home page checks.");

  test.beforeEach(async ({ page, city }) => {
    const homePage = new HomePage(page);
    await homePage.ensureHomeReady(city.name);
  });

  test("[Guest] loads home page and shows core modules", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.assertTopNavigation();
    await homePage.assertCoreHomeWidgets();
  });

  test("[Guest] all visible home page buttons are working", async ({ page, city }) => {
    test.setTimeout(180_000);

    const homePage = new HomePage(page);
    await homePage.assertAllVisibleButtonsWork(city.name, { skipSetup: true });
  });

  test("[Guest] eye icon opens and closes details", async ({ page, city }) => {
    test.setTimeout(120_000);

    const homePage = new HomePage(page);
    await homePage.assertEyeIconOpensAndClosesDetails(city.name, { skipSetup: true });
  });

  test("[Guest] download selected shows login warning", async ({ page, city }) => {
    test.setTimeout(120_000);

    const homePage = new HomePage(page);
    await homePage.assertDownloadSelectedShowsLoginWarning(city.name, { skipSetup: true });
  });

  test("[Guest] top navigation links route to expected pages", async ({ page, city }) => {
    test.setTimeout(120_000);

    const homePage = new HomePage(page);
    await homePage.assertTopNavigationLinksRoute(city.name, { skipSetup: true });
  });

  test("[Guest] all header icons open expected page or modal", async ({ page, city }) => {
    test.setTimeout(120_000);

    const homePage = new HomePage(page);
    await homePage.assertHeaderIconsOpenExpectedViews(city.name, { skipSetup: true });
  });

  test("[Guest] search works with icon click and Enter key", async ({ page, city }) => {
    test.setTimeout(60_000);

    const homePage = new HomePage(page);
    await homePage.assertSearchWorksWithIconAndEnter(city.name, { skipSetup: true });
  });

  test("[Guest] add to cart shows login warning", async ({ page, city }) => {
    const homePage = new HomePage(page);
    await homePage.assertAddToCartShowsLoginWarning(city.name, { skipSetup: true });
  });

  test("[Guest] pagination works on home catalog", async ({ page, city }) => {
    const homePage = new HomePage(page);
    await homePage.assertPaginationWorks(city.name, { skipSetup: true });
  });

  test("[Guest] footer links are visible and correct", async ({ page, city }) => {
    const homePage = new HomePage(page);
    await homePage.assertFooterLinks();
  });
});

test.describe("home page - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in home checks.");
  test.skip(!hasAuthState, "Run `npm run auth:manual` to create a reusable login session.");
  if (hasAuthState) {
    test.use({ storageState: authStatePath });
  }

  test.beforeEach(async ({ page, city }) => {
    const homePage = new HomePage(page);
    await homePage.ensureHomeReady(city.name);
  });

  test("[Login] saved session is active", async ({ page, city, user }) => {
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
