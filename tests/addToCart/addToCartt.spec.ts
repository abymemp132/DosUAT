import { Page, test } from "@playwright/test";
import { AddToCartPage } from "../../pages/addToCart.page";
import { LoginPage } from "../../pages/login.page";
import { authStatePath, hasAuthState } from "../support/auth";
import { hasBaseUrl } from "../support/env";

const loginEmail = process.env.LOGIN_EMAIL || "test@example.com";
const city = "Delhi";
const specificTestQuery = process.env.ADD_TO_CART_TEST_QUERY || process.env.TEST_QUERY || "";

async function assertSavedSession(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.openHome();
  await loginPage.closeLocationModal(city);
  await loginPage.openProfileMenu();
  await loginPage.assertUserIsLoggedIn(loginEmail);
  await page.keyboard.press("Escape").catch(() => {});
}

async function openAddToCartModule(page: Page): Promise<AddToCartPage> {
  const addToCartPage = new AddToCartPage(page);
  await addToCartPage.openAndSelectCity(city);
  return addToCartPage;
}

test.describe("add to cart page - with login", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in add-to-cart checks.");
  test.skip(!hasAuthState, "Run `node utils/saveManualSession.js` to capture a reusable login session.");
  test.skip(!specificTestQuery, "Set ADD_TO_CART_TEST_QUERY in .env to run random discount on a specific test.");
  if (hasAuthState) {
    test.use({ storageState: authStatePath });
  }

  test.beforeEach(async ({ page }) => {
    const addToCartPage = new AddToCartPage(page);
    await addToCartPage.openAndSelectCity(city);
  });

  test("[Login] saved session is active", async ({ page }) => {
    test.setTimeout(120_000);
    await assertSavedSession(page);
  });

  test("[Login] apply random 1 to 10 percent discount on a specific test and validate pricing", async ({
    page
  }) => {
    test.setTimeout(180_000);
    const addToCartPage = await openAddToCartModule(page);
    await addToCartPage.assertRandomDiscountPricingForSpecificTest(specificTestQuery);
  });

  test("[Login] share cart via WhatsApp for a specific test", async ({ page }) => {
    test.setTimeout(180_000);
    const addToCartPage = await openAddToCartModule(page);
    await addToCartPage.assertShareCartViaWhatsAppForSpecificTest(specificTestQuery);
  });

  test("[Login] share cart via Outlook for a specific test", async ({ page }) => {
    test.setTimeout(180_000);
    const addToCartPage = await openAddToCartModule(page);
    await addToCartPage.assertShareCartViaOutlookForSpecificTest(specificTestQuery);
  });

  test("[Login] share cart via PDF for a specific test", async ({ page }) => {
    test.setTimeout(180_000);
    const addToCartPage = await openAddToCartModule(page);
    await addToCartPage.assertShareCartViaPdfForSpecificTest(specificTestQuery);
  });
});
