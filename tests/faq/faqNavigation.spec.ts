import { Page, test } from "@playwright/test";
import { FaqPage } from "../../pages/faq.page";
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

test.describe("faq page - without login (guest user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run guest FAQ checks.");

  test("[Guest] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    const faqPage = new FaqPage(page);
    await faqPage.openAndSelectCity(city);
    await faqPage.assertPageShell();
  });

  test("[Guest] question accordion toggles answer visibility", async ({ page }) => {
    test.setTimeout(120_000);

    const faqPage = new FaqPage(page);
    await faqPage.openAndSelectCity(city);
    await faqPage.assertQuestionAccordionWorks();
  });

  test("[Guest] show more loads additional FAQ questions", async ({ page }) => {
    test.setTimeout(120_000);

    const faqPage = new FaqPage(page);
    await faqPage.openAndSelectCity(city);
    await faqPage.assertShowMoreLoadsAdditionalQuestions();
  });
});

test.describe("faq page - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in FAQ checks.");

  test("[Login] user can login with email and OTP", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);
  });

  test("[Login] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const faqPage = new FaqPage(page);
    await faqPage.openAndSelectCity(city);
    await faqPage.assertPageShell();
  });

  test("[Login] question accordion toggles answer visibility", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const faqPage = new FaqPage(page);
    await faqPage.openAndSelectCity(city);
    await faqPage.assertQuestionAccordionWorks();
  });

  test("[Login] show more loads additional FAQ questions", async ({ page }) => {
    test.setTimeout(120_000);

    await loginAsUser(page);

    const faqPage = new FaqPage(page);
    await faqPage.openAndSelectCity(city);
    await faqPage.assertShowMoreLoadsAdditionalQuestions();
  });
});
