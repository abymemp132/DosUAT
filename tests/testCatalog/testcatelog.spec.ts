import { test } from "@playwright/test";
import { TestCatalogPage } from "../../pages/testCatalog.page";
import { hasBaseUrl } from "../support/env";

const city = "Delhi";

const catalogRoutes = [
  { label: "test", path: "/test", expectData: true },
  { label: "new test", path: "/new-test", expectData: false },
  { label: "packages", path: "/packages", expectData: true },
  { label: "new packages", path: "/new-packages", expectData: false }
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
    await testCatalogPage.assertDepartmentFilterWorks("/test", city, "Serology");
  });

  test("[Guest] method filter works on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertMethodFilterWorks("/test", city, "Chemiluminescence Immunoassay (CLIA)");
  });

  test("[Guest] sample type filter works on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertSampleTypeFilterWorks("/test", city, "Serum");
  });

  test("[Guest] NABL filter works on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertNablFilterWorks("/test", city, "YES");
  });

  test("[Guest] reset clears applied filters on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertResetClearsAppliedFilters("/test", city, "Serology");
  });
});
