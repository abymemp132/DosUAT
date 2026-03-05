import { Page, test } from "@playwright/test";
import { AddToCartPage } from "../../pages/addToCart.page";
import { LoginPage } from "../../pages/login.page";
import { hasBaseUrl } from "../support/env";

const loginEmail = process.env.LOGIN_EMAIL || "abymemp132@gmail.com";
const loginOtp = process.env.LOGIN_OTP || "123456";
const discountCode = process.env.DISCOUNT_CODE || "TEST10";
const city = "Delhi";

async function loginAsUser(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.loginWithEmailOtp(loginEmail, loginOtp, city);
  await loginPage.openProfileMenu();
  await loginPage.assertUserIsLoggedIn(loginEmail);
  await page.keyboard.press("Escape").catch(() => {});
}

async function openAddToCartModule(page: Page): Promise<AddToCartPage> {
  await loginAsUser(page);
  const addToCartPage = new AddToCartPage(page);
  await addToCartPage.openAndSelectCity(city);
  return addToCartPage;
}

test.describe("add to cart page - with login", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in add-to-cart checks.");

  test("[Login] add to cart button is visible", async ({ page }) => {
    test.setTimeout(120_000);
    const addToCartPage = await openAddToCartModule(page);
    await addToCartPage.assertAddToCartButtonVisible();
  });

  test("[Login] add to cart increases cart count", async ({ page }) => {
    test.setTimeout(120_000);
    const addToCartPage = await openAddToCartModule(page);
    await addToCartPage.addFirstItemAndAssertCartCountIncreases();
  });

  test("[Login] cart page opens from header cart icon", async ({ page }) => {
    test.setTimeout(120_000);
    const addToCartPage = await openAddToCartModule(page);
    await addToCartPage.addFirstItemAndAssertCartCountIncreases();
    await addToCartPage.openCartFromHeaderAndAssertVisible();
  });

  test("[Login] discount controls are visible on add to cart page", async ({ page }) => {
    test.setTimeout(120_000);
    const addToCartPage = await openAddToCartModule(page);
    await addToCartPage.addItemAndOpenCart();
    await addToCartPage.assertDiscountControlsVisible();
  });

  test("[Login] apply discount on add to cart page", async ({ page }) => {
    test.setTimeout(180_000);
    const addToCartPage = await openAddToCartModule(page);
    await addToCartPage.assertAddToCartPageApplyDiscount(discountCode);
  });
});
