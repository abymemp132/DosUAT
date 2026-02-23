import { test } from "@playwright/test";
import { FormsPage } from "../../pages/forms.page";
import { hasBaseUrl } from "../support/env";

const city = "Delhi";

test.describe("test requisition & consent forms page - without login (guest user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run guest consent forms checks.");

  test("[Guest] loads page and shows core widgets", async ({ page }) => {
    test.setTimeout(120_000);

    const formsPage = new FormsPage(page);
    await formsPage.openAndSelectCity(city);
    await formsPage.assertPageShell();
  });

  test("[Guest] search by consent works", async ({ page }) => {
    test.setTimeout(120_000);

    const formsPage = new FormsPage(page);
    await formsPage.openAndSelectCity(city);
    await formsPage.assertSearchByConsentWorks("MammaPrint", "MammaPrint TRF");
  });

  test("[Guest] sharing links are reachable", async ({ page }) => {
    test.setTimeout(120_000);

    const formsPage = new FormsPage(page);
    await formsPage.openAndSelectCity(city);
    await formsPage.assertShareLinksAreReachable();
  });
});
