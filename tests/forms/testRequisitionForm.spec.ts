import { Page, test } from "@playwright/test";
import { FormsPage } from "../../pages/forms.page";
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

test.describe("test requisition & consent forms page - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in consent forms checks.");

  test("[Login] user can login with email and OTP", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);
  });

  test("[Login] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const formsPage = new FormsPage(page);
    await formsPage.openAndSelectCity(city);
    await formsPage.assertPageShell();
  });

  test("[Login] search by consent works", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const formsPage = new FormsPage(page);
    await formsPage.openAndSelectCity(city);
    await formsPage.assertSearchByConsentWorks("MammaPrint", "MammaPrint TRF");
  });

  test("[Login] sharing links are reachable", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const formsPage = new FormsPage(page);
    await formsPage.openAndSelectCity(city);
    await formsPage.assertShareLinksAreReachable();
  });
});
