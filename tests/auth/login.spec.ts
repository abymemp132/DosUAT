import { test } from "../../fixtures/testData.fixture";
import { LoginPage } from "../../pages/auth/login.page";
import { authStatePath, hasAuthState } from "../support/auth";
import { hasBaseUrl } from "../support/env";

test.describe("auth", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run auth checks.");
  test.use({ storageState: authStatePath });

  test.beforeEach(async () => {
    test.skip(!hasAuthState(), "Run `npm run auth:manual` or allow setup project to create a reusable login session.");
  });

  test("[Login] saved login session is active", async ({ page, user, city }) => {
    test.setTimeout(60_000);

    const loginPage = new LoginPage(page);

    // Act
    await loginPage.openHome();
    await loginPage.closeLocationModal(city.name);
    await loginPage.openProfileMenu();

    await loginPage.assertSessionIsActive(user.email);
  });
});
