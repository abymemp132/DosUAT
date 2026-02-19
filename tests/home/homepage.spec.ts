import { test } from "@playwright/test";
import { HomePage } from "../../pages/home.page";
import { hasBaseUrl } from "../support/env";

test.describe("home page", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run home page checks.");

  test("loads home page and shows core modules", async ({ page, baseURL }) => {
    const homePage = new HomePage(page);

    await homePage.open(baseURL);
    await homePage.selectCity("Delhi");
    await homePage.assertTopNavigation();
    await homePage.assertCoreHomeWidgets();
  });
});
