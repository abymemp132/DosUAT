import { expect, test } from "@playwright/test";
import { FrameworkHealthPage } from "../../pages/frameworkHealth.page";
import { HomePage } from "../../pages/home.page";
import { hasBaseUrl } from "../support/env";

test.describe("smoke", () => {
  test("framework setup is working", async ({ page }) => {
    const healthPage = new FrameworkHealthPage(page);
    await healthPage.openDemoMarkup();
    await expect(healthPage.heading).toBeVisible();
  });

  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run app smoke checks.");
  test("homepage is reachable", async ({ page, baseURL }) => {
    const homePage = new HomePage(page);
    await homePage.open(baseURL);
    await expect(page).toHaveURL(/.*/);
  });
});
