import { Page, test } from "@playwright/test";
import { AddToCartPage } from "../../pages/addToCart.page";
import { LoginPage } from "../../pages/login.page";
import { authStatePath, hasAuthState } from "../support/auth";
import { hasBaseUrl } from "../support/env";

const loginEmail = process.env.LOGIN_EMAIL || "twkxl.test@inbox.testmail.app";
const city = "Delhi";

async function assertSavedSession(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.openHome();
  await loginPage.closeLocationModal(city);
  await loginPage.openProfileMenu();
  await loginPage.assertUserIsLoggedIn(loginEmail);
  await page.keyboard.press("Escape").catch(() => {});
}

async function openAddToCartModule(page: Page): Promise<AddToCartPage> {
  const loginPage = new LoginPage(page);
  await loginPage.openHome();
  await loginPage.closeLocationModal(city);

  const addToCartPage = new AddToCartPage(page);
  await addToCartPage.open();
  await addToCartPage.waitForCatalogRows();
  return addToCartPage;
}

test.describe("add to cart page - with login", () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in add-to-cart checks.");
  test.skip(!hasAuthState, "Run `npm run auth:manual` to create a reusable login session.");
  if (hasAuthState) {
    test.use({ storageState: authStatePath });
  }

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.openHome();
    await loginPage.closeLocationModal(city);
    
    const addToCartPage = new AddToCartPage(page);
    await addToCartPage.open();
    await addToCartPage.waitForCatalogRows();
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
    await addToCartPage.assertRandomDiscountPricingForSpecificTest("Thyroid");
  });

  test("[Login] share cart via WhatsApp for a specific test", async ({ page }) => {
    test.setTimeout(180_000);
    const addToCartPage = await openAddToCartModule(page);
    await addToCartPage.assertShareCartViaWhatsAppForSpecificTest("Thyroid");
  });

  test("[Login] share cart via Outlook for a specific test", async ({ page }) => {
    test.setTimeout(180_000);
    const addToCartPage = await openAddToCartModule(page);
    await addToCartPage.assertShareCartViaOutlookForSpecificTest("Thyroid");
  });
});
