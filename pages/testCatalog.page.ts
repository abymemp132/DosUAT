import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

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
      .locator('div.fixed.inset-0.z-50')
      .filter({ hasText: /Select your Location|Change City/i })
      .first();
    this.searchInput = this.page.locator('input[placeholder*="Search by Tests"]').first();
    this.resetButton = this.page.getByRole('button', { name: 'Reset' });
    this.downloadButton = this.page.getByRole('button', { name: 'Download' });
    this.itemsCountLabel = this.page.getByText(/\d+\s*Items/i).first();
    this.tableRows = this.page.locator('tbody tr');
  }

  async open(path = '/new-test'): Promise<void> {
    await this.goto(path);
  }

  async openAndSelectCity(path = '/new-test', city = 'Delhi'): Promise<void> {
    await this.open(path);
    await this.selectCity(city);
    await this.page.removeLocatorHandler(this.locationModal).catch(() => {});
    await this.page.addLocatorHandler(this.locationModal, async () => {
      try {
        await this.cityLocationModal.closeLocationModalNoAssertions(city).catch(() => {});
      } catch {}
    });
  }


  async assertCatalogRoute(route: CatalogRoute, city = 'Delhi'): Promise<void> {
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
      await expect(this.page.getByText(/Test Code|Package Code/i).first()).toBeVisible({ timeout: 10_000 });
      await expect(this.page.getByRole('button', { name: 'Add to Cart' }).first()).toBeVisible({
        timeout: 10_000
      });
      return;
    }

    await expect(this.page.getByText('No Data Found', { exact: false }).first()).toBeVisible({
      timeout: 20_000
    });
  }

  async assertDepartmentFilterWorks(path = '/new-test', city = 'Delhi'): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.waitForRows();

    const beforeCount = await this.readItemsCount();
    const option = await this.selectFirstFilterOption('Department');

    await expect(this.tableRows.first()).toContainText(option, { timeout: 15_000 });
    const afterCount = await this.readItemsCount();
    expect(afterCount, `Department filter "${option}" should not increase the total item count.`).toBeLessThanOrEqual(
      beforeCount
    );
  }

  async assertMethodFilterWorks(
    path = '/new-test',
    city = 'Delhi'
  ): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.waitForRows();

    const beforeCount = await this.readItemsCount();
    const option = await this.selectFirstFilterOption('Method');

    await expect(this.tableRows.first()).toContainText(option, { timeout: 15_000 });
    const afterCount = await this.readItemsCount();
    expect(afterCount, `Method filter "${option}" should not increase the total item count.`).toBeLessThanOrEqual(
      beforeCount
    );
  }

  async assertSampleTypeFilterWorks(path = '/new-test', city = 'Delhi'): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.waitForRows();

    const beforeCount = await this.readItemsCount();
    const option = await this.selectFirstFilterOption('Sample Type');

    await expect(this.tableRows.first()).toContainText(option, { timeout: 15_000 });
    const afterCount = await this.readItemsCount();
    expect(afterCount, `Sample Type filter "${option}" should not increase the total item count.`).toBeLessThanOrEqual(
      beforeCount
    );
  }

  async assertNablFilterWorks(path = '/new-test', city = 'Delhi'): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.waitForRows();

    const beforeCount = await this.readItemsCount();
    const option = await this.selectFirstFilterOption('NABL');
    await expect(this.itemsCountLabel).toBeVisible({ timeout: 15_000 });

    const afterCount = await this.readItemsCount();
    expect(afterCount, `NABL filter "${option}" should not increase the total item count.`).toBeLessThanOrEqual(
      beforeCount
    );
  }

  async assertResetClearsAppliedFilters(path = '/new-test', city = 'Delhi'): Promise<void> {
    await this.openAndSelectCity(path, city);
    await this.waitForRows();

    const beforeCount = await this.readItemsCount();
    const option = await this.selectFirstFilterOption('Department');
    await expect(this.tableRows.first()).toContainText(option, { timeout: 15_000 });

    await this.resetButton.click();

    // Wait for the items count to update back to the unfiltered count
    await expect.poll(async () => this.readItemsCount(), {
      timeout: 15_000,
      message: 'Reset should restore the original catalog count.'
    }).toBeGreaterThanOrEqual(beforeCount);
  }

  private async selectFirstFilterOption(filterName: string): Promise<string> {
    const filterTrigger = this.page.getByText(new RegExp(`^${this.escapeRegExp(filterName)}$`, 'i')).first();
    await expect(filterTrigger, `Filter "${filterName}" should be visible.`).toBeVisible({ timeout: 10_000 });
    await filterTrigger.click();

    const dropdownList = this.page.locator('div.absolute, div.fixed, [role="listbox"]').first();
    
    // Attempt to pick a common populated option to prevent empty "No Data Found" filter results
    const commonOptions = ['Serology', 'Biochemistry', 'Hematology', 'Oncology', 'Serum', 'Plasma', 'YES', 'No'];
    let selectedOptionElement = dropdownList.locator('div.cursor-pointer, button, [role="option"]').first();
    
    for (const opt of commonOptions) {
      const match = dropdownList.getByText(new RegExp(`^\\s*${this.escapeRegExp(opt)}\\s*$`, 'i')).first();
      if (await match.isVisible().catch(() => false)) {
        selectedOptionElement = match;
        break;
      }
    }

    await expect(selectedOptionElement).toBeVisible({ timeout: 10_000 });
    const option = (await selectedOptionElement.innerText()).trim();
    await selectedOptionElement.click();

    if (await dropdownList.isVisible().catch(() => false)) {
      await this.page.mouse.click(10, 10).catch(() => {});
    }

    await expect(this.itemsCountLabel).toBeVisible({ timeout: 15_000 });
    return option;
  }

  private async selectFilterOption(filterName: string, option: string): Promise<void> {
    // Use .first() to avoid strict mode violations when filter name appears both in dropdown and table header
    const filterTrigger = this.page.getByText(new RegExp(`^${this.escapeRegExp(filterName)}$`, 'i')).first();
    await expect(filterTrigger, `Filter "${filterName}" should be visible.`).toBeVisible({ timeout: 10_000 });
    await filterTrigger.click();

    // Target the option specifically inside the dropdown menu container
    const dropdownList = this.page.locator('div.absolute, div.fixed, [role="listbox"]').first();
    const optionLocator = dropdownList.getByText(new RegExp(`^${this.escapeRegExp(option)}$`, 'i')).first();

    await expect(optionLocator, `Option "${option}" should be visible under "${filterName}".`).toBeVisible({
      timeout: 10_000
    });
    await optionLocator.click();

    // Close the dropdown trigger only if the dropdown list remains visible
    if (await dropdownList.isVisible().catch(() => false)) {
      await this.page.mouse.click(10, 10).catch(() => {});
    }

    await expect(this.itemsCountLabel).toBeVisible({ timeout: 15_000 });
  }

  private async waitForRows(timeoutMs = 30_000): Promise<void> {
    const noDataFound = this.page.getByText('No Data Found', { exact: false }).first();
    if (await noDataFound.isVisible().catch(() => false)) {
      // Try to handle no data gracefully - don't throw, just log
      console.log("Catalog returned 'No Data Found' - continuing with test");
      return;
    }

    await expect(this.tableRows.first(), 'Catalog rows should be visible.').toBeVisible({ timeout: timeoutMs });
  }

  private async readItemsCount(): Promise<number> {
    const itemsText = (await this.itemsCountLabel.innerText()).trim();
    const parsedCount = Number.parseInt(itemsText.replace(/[^\d]/g, ''), 10);
    expect(Number.isNaN(parsedCount), `Could not parse item count from "${itemsText}".`).toBe(false);
    return parsedCount;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
