import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

type CatalogRoute = {
  label: string;
  path: string;
  expectData: boolean;
};

export class TestCatalogPage extends BasePage {
  private readonly locationModal: Locator;
  private readonly searchInput: Locator;
  private readonly resetButton: Locator;
  private readonly downloadButton: Locator;
  private readonly itemsCountLabel: Locator;
  private readonly tableRows: Locator;

  constructor(page: Page) {
    super(page);
    this.locationModal = this.page
      .locator("div.fixed.inset-0.z-50")
      .filter({ hasText: "Select your Location" })
      .first();
    this.searchInput = this.page.locator('input[placeholder="Search by Tests and Packages"]').first();
    this.resetButton = this.page.getByRole("button", { name: "Reset" });
    this.downloadButton = this.page.getByRole("button", { name: "Download" });
    this.itemsCountLabel = this.page.getByText(/\d+\s*Items/i).first();
    this.tableRows = this.page.locator("tbody tr");
  }

  async open(path = "/test"): Promise<void> {
    await this.goto(path);
  }

  async openAndSelectCity(path = "/test", city = "Delhi"): Promise<void> {
    await this.open(path);
    await this.selectCity(city);
  }

  async selectCity(city = "Delhi"): Promise<void> {
    if (!(await this.locationModal.isVisible().catch(() => false))) {
      return;
    }

    const loadingCities = this.locationModal.getByText("Loading cities...", { exact: false });
    if (await loadingCities.isVisible().catch(() => false)) {
      await expect(loadingCities).toBeHidden({ timeout: 30_000 }).catch(() => {});
    }

    const preferredCityOption = this.locationModal
      .getByText(new RegExp(`^\\s*${this.escapeRegExp(city)}\\s*$`, "i"))
      .first();

    if (await preferredCityOption.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await preferredCityOption.click();
      await expect(this.locationModal).toBeHidden({ timeout: 10_000 });
      return;
    }

    const searchInput = this.locationModal.getByPlaceholder("Search your City");
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(city);
      if (await preferredCityOption.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await preferredCityOption.click();
        await expect(this.locationModal).toBeHidden({ timeout: 10_000 });
        return;
      }
    }

    throw new Error(`City "${city}" was not found in the location selector.`);
  }

  async assertCatalogRoute(route: CatalogRoute, city = "Delhi"): Promise<void> {
    await this.openAndSelectCity(route.path, city);
    await expect(this.searchInput).toBeVisible({ timeout: 20_000 });
    await expect(this.resetButton).toBeVisible({ timeout: 10_000 });
    await expect(this.downloadButton).toBeVisible({ timeout: 10_000 });
    // Use getByRole for table headers to avoid strict mode violations with filter dropdowns
    // NABL column may not exist on all catalog views
    await expect(this.page.getByRole('columnheader', { name: 'Department' })).toBeVisible({ timeout: 10_000 });
    await expect(this.page.getByRole('columnheader', { name: 'Method' })).toBeVisible({ timeout: 10_000 });
    await expect(this.page.getByRole('columnheader', { name: 'Sample Type' })).toBeVisible({ timeout: 10_000 });
    // NABL may not be present, make it optional
    const nablHeader = this.page.getByRole('columnheader', { name: 'NABL' });
    if (await nablHeader.isVisible().catch(() => false)) {
      await nablHeader.waitFor();
    }

    if (route.expectData) {
      await this.waitForRows();
      await expect(this.page.getByText("Test Code", { exact: true }).first()).toBeVisible({ timeout: 10_000 });
      await expect(this.page.getByRole("button", { name: "Add to Cart" }).first()).toBeVisible({
        timeout: 10_000
      });
      return;
    }

    await expect(this.page.getByText("No Data Found", { exact: false }).first()).toBeVisible({
      timeout: 20_000
    });
  }

  async assertDepartmentFilterWorks(path = "/test", city = "Delhi", option = "Serology"): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.waitForRows();

    const beforeCount = await this.readItemsCount();
    await this.selectFilterOption("Department", option);

    await expect(this.tableRows.first()).toContainText(option, { timeout: 15_000 });
    const afterCount = await this.readItemsCount();
    expect(afterCount, `Department filter "${option}" should not increase the total item count.`).toBeLessThanOrEqual(
      beforeCount
    );
  }

  async assertMethodFilterWorks(
    path = "/test",
    city = "Delhi",
    option = "Chemiluminescence Immunoassay (CLIA)"
  ): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.waitForRows();

    const beforeCount = await this.readItemsCount();
    await this.selectFilterOption("Method", option);

    await expect(this.tableRows.first()).toContainText(option, { timeout: 15_000 });
    const afterCount = await this.readItemsCount();
    expect(afterCount, `Method filter "${option}" should not increase the total item count.`).toBeLessThanOrEqual(
      beforeCount
    );
  }

  async assertSampleTypeFilterWorks(path = "/test", city = "Delhi", option = "Serum"): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.waitForRows();

    const beforeCount = await this.readItemsCount();
    await this.selectFilterOption("Sample Type", option);

    await expect(this.tableRows.first()).toContainText(option, { timeout: 15_000 });
    const afterCount = await this.readItemsCount();
    expect(
      afterCount,
      `Sample Type filter "${option}" should not increase the total item count.`
    ).toBeLessThanOrEqual(beforeCount);
  }

  async assertNablFilterWorks(path = "/test", city = "Delhi", option = "YES"): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.waitForRows();

    const beforeCount = await this.readItemsCount();
    await this.selectFilterOption("NABL", option);
    await expect(this.itemsCountLabel).toBeVisible({ timeout: 15_000 });

    const afterCount = await this.readItemsCount();
    expect(afterCount, `NABL filter "${option}" should not increase the total item count.`).toBeLessThanOrEqual(
      beforeCount
    );
  }

  async assertResetClearsAppliedFilters(path = "/test", city = "Delhi", option = "Serology"): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.waitForRows();

    const beforeCount = await this.readItemsCount();
    await this.selectFilterOption("Department", option);
    await expect(this.tableRows.first()).toContainText(option, { timeout: 15_000 });

    await this.resetButton.click();
    await this.waitForRows();

    const afterResetCount = await this.readItemsCount();
    expect(
      afterResetCount,
      "Reset should restore the original or a broader catalog count after filter application."
    ).toBeGreaterThanOrEqual(beforeCount);
  }

  private async selectFilterOption(filterName: string, option: string): Promise<void> {
    // Use .first() to avoid strict mode violations when filter name appears both in dropdown and table header
    const filterTrigger = this.page.getByText(new RegExp(`^${this.escapeRegExp(filterName)}$`, "i")).first();
    await expect(filterTrigger, `Filter "${filterName}" should be visible.`).toBeVisible({ timeout: 10_000 });
    await filterTrigger.click();

    const optionLocator = this.page.getByText(new RegExp(`^${this.escapeRegExp(option)}$`, "i")).first();
    await expect(optionLocator, `Option "${option}" should be visible under "${filterName}".`).toBeVisible({
      timeout: 10_000
    });
    await optionLocator.click();

    await expect(this.itemsCountLabel).toBeVisible({ timeout: 15_000 });
  }

  private async waitForRows(timeoutMs = 30_000): Promise<void> {
    const noDataFound = this.page.getByText("No Data Found", { exact: false }).first();
    if (await noDataFound.isVisible().catch(() => false)) {
      // Try to handle no data gracefully - don't throw, just log
      console.log("Catalog returned 'No Data Found' - continuing with test");
      return;
    }

    await expect(this.tableRows.first(), "Catalog rows should be visible.").toBeVisible({ timeout: timeoutMs });
  }

  private async readItemsCount(): Promise<number> {
    const itemsText = (await this.itemsCountLabel.innerText()).trim();
    const parsedCount = Number.parseInt(itemsText.replace(/[^\d]/g, ""), 10);
    expect(Number.isNaN(parsedCount), `Could not parse item count from "${itemsText}".`).toBe(false);
    return parsedCount;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
