import { test } from "@playwright/test";
import { TestCatalogPage } from "../pages/testCatalog.page";
import { hasBaseUrl } from "./support/env";

const city = "Delhi";

const catalogRoutes = [
  { label: "tests", path: "/tests", expectData: true },
  { label: "packages", path: "/packages", expectData: true },
  { label: "new test", path: "/new-test", expectData: true },
  { label: "new packages", path: "/new-packages", expectData: true },
  { label: "wellness packages", path: "/wellness-package", expectData: true }
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

  test("[Guest] department filter control is visible on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertDepartmentFilterWorks("/tests", city, "Clinical Pathology");
  });

  test("[Guest] method filter control is visible on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertMethodFilterWorks("/tests", city, "CMIA");
  });

  test("[Guest] sample type filter control is visible on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertSampleTypeFilterWorks("/tests", city, "Urine");
  });

  test("[Guest] NABL filter control is visible on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertNablFilterWorks("/tests", city, "YES");
  });

  test("[Guest] reset control is available on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertResetClearsAppliedFilters("/tests", city, "Clinical Pathology");
  });
});
