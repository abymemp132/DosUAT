import { expect, test } from "@playwright/test";
import { hasBaseUrl } from "../../../support/env";
import { HomePage } from "../pages/HomePage";

test.describe("public module", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run app smoke checks.");

  test("homepage is reachable", async ({ page, baseURL }) => {
    const homePage = new HomePage(page);
    await homePage.open(baseURL!);
    await expect(page).toHaveURL(/.*/);
  });
});
