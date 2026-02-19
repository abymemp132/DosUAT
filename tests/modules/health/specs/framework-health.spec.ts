import { expect, test } from "@playwright/test";
import { FrameworkHealthPage } from "../pages/FrameworkHealthPage";

test.describe("health module", () => {
  test("framework setup is working", async ({ page }) => {
    const healthPage = new FrameworkHealthPage(page);
    await healthPage.openDemoMarkup();
    await expect(healthPage.heading).toBeVisible();
  });
});
