import { Page, test } from "@playwright/test";
import { DoctorSpecialityPage } from "../pages/doctorSpeciality.page";
import { LoginPage } from "../pages/login.page";
import { authStatePath, hasAuthState, ensureAuthState } from "./support/auth";
import { hasBaseUrl } from "./support/env";

const city = "Delhi";

async function assertSavedSession(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.openHome();
  await loginPage.closeLocationModal(city);
  await loginPage.openProfileMenu();
  await loginPage.assertSessionIsActive();
  await page.keyboard.press("Escape").catch(() => {});
}

test.describe("doctor speciality page - without login (guest user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run guest doctor speciality checks.");

  test.beforeEach(async ({ page }) => {
    const doctorSpecialityPage = new DoctorSpecialityPage(page);
    await doctorSpecialityPage.openAndSelectCity(city);
  });

  test("[Guest] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    const doctorSpecialityPage = new DoctorSpecialityPage(page);
    await doctorSpecialityPage.assertPageShell();
  });

  test("[Guest] speciality filter updates catalog", async ({ page }) => {
    test.setTimeout(120_000);

    const doctorSpecialityPage = new DoctorSpecialityPage(page);
    await doctorSpecialityPage.assertSpecialityFilterChangesCatalog("Cardiologist");
  });

  test("[Guest] search by test code works", async ({ page }) => {
    test.setTimeout(120_000);

    const doctorSpecialityPage = new DoctorSpecialityPage(page);
    await doctorSpecialityPage.assertSearchByTestCodeWorks();
  });

  test("[Guest] add to cart shows login warning", async ({ page }) => {
    test.setTimeout(120_000);

    const doctorSpecialityPage = new DoctorSpecialityPage(page);
    await doctorSpecialityPage.assertAddToCartShowsLoginWarning();
  });
});

test.describe("doctor speciality page - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run logged-in doctor speciality checks.");
  test.skip(!ensureAuthState(), "Run `npm run auth:manual` to create a reusable login session.");
  if (hasAuthState) {
    test.use({ storageState: authStatePath });
  }

  test.beforeEach(async ({ page }) => {
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
});
