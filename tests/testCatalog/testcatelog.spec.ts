import { test } from "@playwright/test";
import { TestCatalogPage } from "../../pages/testCatalog.page";
import { hasBaseUrl } from "../support/env";

const city = "Delhi";

const catalogRoutes = [
  { label: "new test", path: "/new-test", expectData: true },
  { label: "new packages", path: "/new-packages", expectData: true }
] as const;

test.describe("test catalog module - guest user", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run test catalog module checks.");

  for (const route of catalogRoutes) {
    test(`[Guest] ${route.label} route loads expected catalog state`, async ({ page }) => {
      test.setTimeout(120_000);

      const testCatalogPage = new TestCatalogPage(page);
      await testCatalogPage.assertCatalogRoute(route, city);
    });
  }

  test("[Guest] department filter works on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertDepartmentFilterWorks("/new-test", city);
  });

  test("[Guest] method filter works on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertMethodFilterWorks("/new-test", city);
  });

  test("[Guest] sample type filter works on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertSampleTypeFilterWorks("/new-test", city);
  });

  test("[Guest] NABL filter works on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertNablFilterWorks("/new-test", city);
  });

  test("[Guest] reset clears applied filters on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertResetClearsAppliedFilters("/new-test", city);
  });
});
