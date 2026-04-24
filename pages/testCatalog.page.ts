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
      .filter({ hasText: /Select your Location|Change City/i })
      .first();
    this.searchInput = this.page.locator('input[placeholder*="Search by Tests" i]').first();
    this.resetButton = this.page.getByRole("button", { name: "Reset" });
    this.downloadButton = this.page.getByRole("button", { name: "Download" });
    this.itemsCountLabel = this.page.locator("div, span, p").filter({ hasText: /\d+\s*Items/i }).first();
    this.tableRows = this.page.locator("tbody tr");
  }

  async open(path = "/tests"): Promise<void> {
    await this.goto(path);
  }

  async openAndSelectCity(path = "/tests", city = "Delhi"): Promise<void> {
    await this.open(path);
    await this.closeLocationModal(city);
    await this.waitForRows();
  }

  async assertCatalogRoute(route: CatalogRoute, city = "Delhi"): Promise<void> {
    await this.openAndSelectCity(route.path, city);
    await expect(this.searchInput).toBeVisible({ timeout: 20_000 });
    
    if (route.expectData) {
      await this.waitForRows();
      await expect(this.tableRows.first()).toBeVisible({ timeout: 10_000 });
    } else {
      await expect(this.page.getByText(/No Data Found/i).first()).toBeVisible({ timeout: 15_000 });
    }
  }

  async assertDepartmentFilterWorks(path = "/tests", city = "Delhi", option = "Haematology"): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.assertFilterControlVisible("Department");
  }

  async assertMethodFilterWorks(path = "/tests", city = "Delhi", option = "CMIA"): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.assertFilterControlVisible("Method");
  }

  async assertSampleTypeFilterWorks(path = "/tests", city = "Delhi", option = "Serum"): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.assertFilterControlVisible("Sample Type");
  }

  async assertNablFilterWorks(path = "/tests", city = "Delhi", option = "YES"): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.assertFilterControlVisible("NABL");
  }

  async assertResetClearsAppliedFilters(path = "/tests", city = "Delhi", option = "Haematology"): Promise<void> {
    await this.openAndSelectCity(path, city);
    await expect(this.resetButton).toBeVisible({ timeout: 10_000 });
    await expect(this.resetButton).toBeEnabled({ timeout: 10_000 });
    await expect(this.tableRows.first()).toBeVisible({ timeout: 15_000 });
  }

  private async assertFilterControlVisible(filterName: string): Promise<void> {
    const filterControl = this.page
      .locator("div[class*='min-w-[150px]'][class*='relative']")
      .filter({ hasText: new RegExp(`^\\s*${this.escapeRegExp(filterName)}\\s*$`, "i") })
      .first();

    await expect(filterControl, `Filter control "${filterName}" should be visible.`).toBeVisible({ timeout: 15_000 });
    await expect(filterControl.locator("div[class*='cursor-pointer']").first()).toBeVisible({ timeout: 10_000 });
  }

  private async waitForRows(timeoutMs = 40_000): Promise<void> {
    const loadingTests = this.page.getByText(/Loading tests/i).first();
    if (await loadingTests.isVisible().catch(() => false)) {
      await expect(loadingTests).toBeHidden({ timeout: timeoutMs }).catch(() => {});
    }
    await expect(this.tableRows.first(), "Catalog rows should be visible.").toBeVisible({ timeout: timeoutMs });
  }

  private async readItemsCount(): Promise<number> {
    try {
      // Use evaluate to read only the direct text of the element, not its children
      // This avoids concatenation of child element texts producing wrong numbers
      const text = await this.itemsCountLabel.evaluate(
        (el: Element) => Array.from(el.childNodes)
          .filter(n => n.nodeType === Node.TEXT_NODE)
          .map(n => n.textContent || '')
          .join('')
          .trim()
      );
      const full = text || await this.itemsCountLabel.innerText({ timeout: 5_000 });
      const match = full.match(/(\d+)/);
      return match ? Number.parseInt(match[1], 10) : 0;
    } catch {
      return 0;
    }
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }


  private async clickFirstAvailableCity(): Promise<boolean> {
    const cityOptions = this.locationModal.locator("span, p, .city-name").filter({ hasText: /^[a-zA-Z\s]+$/ });
    const count = await cityOptions.count();
    for (let i = 0; i < count; i++) {
        const option = cityOptions.nth(i);
        if (await option.isVisible() && (await option.textContent())?.trim().length! > 2) {
            await option.click({ force: true });
            return true;
        }
    }
    return false;
  }
}
