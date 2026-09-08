import { Page, test } from "@playwright/test";
import { DoctorSpecialityPage } from "../../pages/doctorSpeciality/doctorSpeciality.page";
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

test.describe("doctor speciality page - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in doctor speciality checks.");
  test.use({ storageState: authStatePath });

  test.beforeEach(async ({ page }) => {
    test.skip(!hasAuthState(), "Run `node utils/saveManualSession.js` or allow setup project to capture a reusable login session.");
    const doctorSpecialityPage = new DoctorSpecialityPage(page);
    await doctorSpecialityPage.openAndSelectCity(city);
  });

  test("[Login] saved session is active", async ({ page }) => {
    test.setTimeout(120_000);

    await assertSavedSession(page);
  });

  test("[Login] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    const doctorSpecialityPage = new DoctorSpecialityPage(page);
    await doctorSpecialityPage.assertPageShell();
  });

  test("[Login] speciality filter updates catalog", async ({ page }) => {
    test.setTimeout(120_000);

    const doctorSpecialityPage = new DoctorSpecialityPage(page);
    await doctorSpecialityPage.assertSpecialityFilterChangesCatalog("Cardiologist");
  });

  test("[Login] search by test code works", async ({ page }) => {
    test.setTimeout(120_000);

    const doctorSpecialityPage = new DoctorSpecialityPage(page);
    await doctorSpecialityPage.assertSearchByTestCodeWorks();
  });

  test("[Login] add to cart updates cart count", async ({ page }) => {
    test.setTimeout(120_000);

    const doctorSpecialityPage = new DoctorSpecialityPage(page);
    await doctorSpecialityPage.assertLoggedInAddToCartUpdatesCartCount();
  });
});
