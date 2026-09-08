import { test } from "@playwright/test";
import { TestCatalogPage } from "../../pages/testCatalog/testCatalog.page";
import { authStatePath, hasAuthState } from "../support/auth";
import { hasBaseUrl } from "../support/env";

const city = "Delhi";

const catalogRoutes = [
  { label: "new test", path: "/new-test", expectData: true },
  { label: "new packages", path: "/new-packages", expectData: true }
] as const;

test.describe("test catalog module - with login (authenticated user)", () => {
  test.skip(!hasBaseUrl, "Set BASE_URL in .env to run test catalog module checks.");
  test.use({ storageState: authStatePath });

  test.beforeEach(async () => {
    test.skip(!hasAuthState(), "Run `npm run auth:manual` or allow setup project to create a reusable login session.");
  });

  for (const route of catalogRoutes) {
    test(`[Login] ${route.label} route loads expected catalog state`, async ({ page }) => {
      test.setTimeout(120_000);

      const testCatalogPage = new TestCatalogPage(page);
      await testCatalogPage.assertCatalogRoute(route, city);
    });
  }

  test("[Login] department filter works on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertDepartmentFilterWorks("/new-test", city);
  });

  test("[Login] method filter works on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertMethodFilterWorks("/new-test", city);
  });

  test("[Login] sample type filter works on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertSampleTypeFilterWorks("/new-test", city);
  });

  test("[Login] NABL filter works on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertNablFilterWorks("/new-test", city);
  });

  test("[Login] reset clears applied filters on test route", async ({ page }) => {
    test.setTimeout(120_000);

    const testCatalogPage = new TestCatalogPage(page);
    await testCatalogPage.assertResetClearsAppliedFilters("/new-test", city);
  });
});
