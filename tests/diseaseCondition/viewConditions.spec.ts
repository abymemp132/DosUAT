import { Page, test } from "@playwright/test";
import { DiseaseConditionPage } from "../../pages/diseaseCondition.page";
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

test.describe("disease condition page - without login (guest user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run guest disease condition checks.");

  test("[Guest] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.openAndSelectCity(city);
    await diseaseConditionPage.assertPageShell();
  });

  test("[Guest] condition filter updates catalog", async ({ page }) => {
    test.setTimeout(120_000);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.openAndSelectCity(city);
    await diseaseConditionPage.assertConditionFilterChangesCatalog("Heart");
  });

  test("[Guest] search by test code works", async ({ page }) => {
    test.setTimeout(120_000);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.openAndSelectCity(city);
    await diseaseConditionPage.assertSearchByTestCodeWorks();
  });

  test("[Guest] add to cart shows login warning", async ({ page }) => {
    test.setTimeout(120_000);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.openAndSelectCity(city);
    await diseaseConditionPage.assertAddToCartShowsLoginWarning();
  });
});

test.describe("disease condition page - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in disease condition checks.");

  test("[Login] user can login with email and OTP", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);
  });

  test("[Login] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.openAndSelectCity(city);
    await diseaseConditionPage.assertPageShell();
  });

  test("[Login] condition filter updates catalog", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.openAndSelectCity(city);
    await diseaseConditionPage.assertConditionFilterChangesCatalog("Heart");
  });

  test("[Login] search by test code works", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.openAndSelectCity(city);
    await diseaseConditionPage.assertSearchByTestCodeWorks();
  });

  test("[Login] add to cart updates cart count", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const diseaseConditionPage = new DiseaseConditionPage(page);
    await diseaseConditionPage.openAndSelectCity(city);
    await diseaseConditionPage.assertLoggedInAddToCartUpdatesCartCount();
  });
});
