import { Page, test } from "@playwright/test";
import { FaqPage } from "../../pages/faq/faq.page";
import { LoginPage } from "../../pages/auth/login.page";
import { authStatePath, hasAuthState } from "../support/auth";
import { hasBaseUrl } from "../support/env";

const city = "Delhi";

async function assertSavedSession(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.openHome();
  await loginPage.closeLocationModal(city);
  await loginPage.openProfileMenu();
  await loginPage.assertSessionIsActive();
  await page.keyboard.press("Escape").catch(() => {});
}

test.describe("faq page - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in FAQ checks.");
  test.use({ storageState: authStatePath });

  test.beforeEach(async ({ page }) => {
    test.skip(!hasAuthState(), "Run `node utils/saveManualSession.js` or allow setup project to capture a reusable login session.");
    const faqPage = new FaqPage(page);
    await faqPage.openAndSelectCity(city);
  });

  test("[Login] saved session is active", async ({ page }) => {
    test.setTimeout(120_000);

    await assertSavedSession(page);
  });

  test("[Login] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    const faqPage = new FaqPage(page);
    await faqPage.assertPageShell();
  });

  test("[Login] question accordion toggles answer visibility", async ({ page }) => {
    test.setTimeout(120_000);

    const faqPage = new FaqPage(page);
    await faqPage.assertQuestionAccordionWorks();
  });

  test("[Login] show more loads additional FAQ questions", async ({ page }) => {
    test.setTimeout(120_000);

    const faqPage = new FaqPage(page);
    await faqPage.assertShowMoreLoadsAdditionalQuestions();
  });
});
