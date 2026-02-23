import { test } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";
import { hasBaseUrl } from "../support/env";

const loginEmail = process.env.LOGIN_EMAIL || "abymemp132@gmail.com";
const loginOtp = process.env.LOGIN_OTP || "123456";

test.describe("auth", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run auth checks.");

  test("login with email and otp", async ({ page }) => {
    test.setTimeout(120_000);

    const loginPage = new LoginPage(page);

    await loginPage.openHome();
    await loginPage.closeLocationModal("Delhi");
    await loginPage.openLoginModal();
    await loginPage.requestOtp(loginEmail);
    await loginPage.verifyOtp(loginOtp);
    await loginPage.openProfileMenu();
    await loginPage.assertUserIsLoggedIn(loginEmail);
  });
});
