import { Page, test } from "@playwright/test";
import { HomePage } from "../../pages/home.page";
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

test.describe("home page - without login (guest user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run home page checks.");

  test("[Guest] loads home page and shows core modules", async ({ page, baseURL }) => {
    const homePage = new HomePage(page);

    await homePage.open(baseURL);
    await homePage.selectCity(city);
    await homePage.assertTopNavigation();
    await homePage.assertCoreHomeWidgets();
  });

  test("[Guest] all visible home page buttons are working", async ({ page }) => {
    test.setTimeout(180_000);

    const homePage = new HomePage(page);
    await homePage.assertAllVisibleButtonsWork(city);
  });

  test("[Guest] eye icon opens and closes details", async ({ page }) => {
    test.setTimeout(120_000);

    const homePage = new HomePage(page);
    await homePage.assertEyeIconOpensAndClosesDetails(city);
  });

  test("[Guest] download selected shows login warning", async ({ page }) => {
    test.setTimeout(120_000);

    const homePage = new HomePage(page);
    await homePage.assertDownloadSelectedShowsLoginWarning(city);
  });

  test("[Guest] top navigation links route to expected pages", async ({ page }) => {
    test.setTimeout(120_000);

    const homePage = new HomePage(page);
    await homePage.assertTopNavigationLinksRoute(city);
  });

  test("[Guest] all header icons open expected page or modal", async ({ page }) => {
    test.setTimeout(120_000);

    const homePage = new HomePage(page);
    await homePage.assertHeaderIconsOpenExpectedViews(city);
  });

  test("[Guest] search works with icon click and Enter key", async ({ page }) => {
    test.setTimeout(60_000);

    const homePage = new HomePage(page);
    await homePage.assertSearchWorksWithIconAndEnter(city);
  });

  test("[Guest] add to cart shows login warning", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.assertAddToCartShowsLoginWarning(city);
  });

  test("[Guest] pagination works on home catalog", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.assertPaginationWorks(city);
  });
});

test.describe("home page - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in home checks.");

  test("[Login] user can login with email and OTP", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);
  });

  test("[Login] loads home page and shows core modules", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const homePage = new HomePage(page);
    await homePage.assertTopNavigation();
    await homePage.assertCoreHomeWidgets();
  });

  test("[Login] top navigation links route to expected pages", async ({ page }) => {
    test.setTimeout(180_000);

    await loginAsUser(page);

    const homePage = new HomePage(page);
    await homePage.assertTopNavigationLinksRoute(city);
  });

  test("[Login] all header icons open expected page or modal", async ({ page }) => {
    test.setTimeout(180_000);

    await loginAsUser(page);

    const homePage = new HomePage(page);
    await homePage.assertHeaderIconsOpenExpectedViewsForLoggedIn(loginEmail, city);
  });

  test("[Login] search works with icon click and Enter key", async ({ page }) => {
    test.setTimeout(60_000);

    await loginAsUser(page);

    const homePage = new HomePage(page);
    await homePage.assertSearchWorksWithIconAndEnter(city);
  });

  test("[Login] eye icon opens and closes details", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const homePage = new HomePage(page);
    await homePage.assertEyeIconOpensAndClosesDetails(city);
  });

  test("[Login] add to cart updates cart count", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const homePage = new HomePage(page);
    await homePage.assertLoggedInAddToCartUpdatesCartCount(city);
  });

  test("[Login] download selected works without login modal", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const homePage = new HomePage(page);
    await homePage.assertLoggedInDownloadSelectedWorks(city);
  });

  test("[Login] pagination works on home catalog", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const homePage = new HomePage(page);
    await homePage.assertPaginationWorks(city);
  });
});
