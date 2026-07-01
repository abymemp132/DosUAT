import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class DiseaseConditionPage extends BasePage {
  private readonly locationModal: Locator;
  private readonly locationIcon: Locator;
  private readonly cartButton: Locator;
  private readonly conditionSearchInput: Locator;
  private readonly testSearchInput: Locator;
  private readonly testSearchButton: Locator;
  private readonly itemsCountLabel: Locator;
  private readonly tableRows: Locator;
  private readonly firstTestCodeCell: Locator;
  private readonly addToCartButton: Locator;
  private readonly toastMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.locationModal = this.page
      .locator('div.fixed.inset-0.z-50')
      .filter({ hasText: 'Select your Location' })
      .first();
    this.locationIcon = this.page.locator('header img[alt="location"]').first();
    this.cartButton = this.page.locator('header button').filter({ hasText: /^\d+$/ }).first();
    this.conditionSearchInput = this.page.locator('input[placeholder="Search"]').first();
    this.testSearchInput = this.page.locator('input[placeholder="Search by Tests"]').first();
    this.testSearchButton = this.page.locator('div:has(input[placeholder="Search by Tests"]) button').first();
    this.itemsCountLabel = this.page.getByText(/\d+\s*Items/i).first();
    this.tableRows = this.page.locator('tbody tr');
    this.firstTestCodeCell = this.page.locator('tbody tr td:nth-child(3)').first();
    this.addToCartButton = this.page.getByRole('button', { name: 'Add to Cart' }).first();
    this.toastMessage = this.page.locator('.Toastify__toast, [role="alert"], [data-sonner-toast]');
  }

  async open(): Promise<void> {
    await this.goto('/disease-condition');
  }

  async openAndSelectCity(city = 'Delhi'): Promise<void> {
    await this.open();

    // Register a global handler: whenever the location modal appears at ANY point
    // during this test (on load, after API calls, on interaction), auto-dismiss it.
    await this.page.addLocatorHandler(this.locationModal, async () => {
      await this.selectCity(city);
    });

    await this.selectCity(city);
    await this.waitForCatalogRows();
  }

  async selectCity(city = 'Delhi'): Promise<void> {
    if (!(await this.locationModal.isVisible().catch(() => false))) {
      return;
    }

    const loadingCities = this.locationModal.getByText('Loading cities...', { exact: false });
    if (await loadingCities.isVisible().catch(() => false)) {
      try {
        await expect(loadingCities).toBeHidden({ timeout: 30_000 });
      } catch {
        // Optional wait can time out without failing the flow.
      }
    }

    const preferredCityOption = this.locationModal
      .getByText(new RegExp(`^\\s*${this.escapeRegExp(city)}\\s*$`, 'i'))
      .first();
    const clickPreferredCity = async (): Promise<boolean> => {
      if (!(await preferredCityOption.isVisible({ timeout: 10_000 }).catch(() => false))) {
        return false;
      }

      await preferredCityOption.click();
      return true;
    };

    if (await clickPreferredCity()) {
      await expect(this.locationModal).toBeHidden({ timeout: 10_000 });
      return;
    }

    const searchInput = this.locationModal.getByPlaceholder('Search your City');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(city);
      if (await clickPreferredCity()) {
        await expect(this.locationModal).toBeHidden({ timeout: 10_000 });
        return;
      }
      await searchInput.fill('');
    }

    const fallbackCityClicked = await this.clickFirstAvailableCity();
    expect(fallbackCityClicked, `City option "${city}" was not available and no fallback city option was found.`).toBe(
      true
    );
    await expect(this.locationModal).toBeHidden({ timeout: 10_000 });
  }

  async openLocationSelector(): Promise<void> {
    await expect(this.locationIcon).toBeVisible({ timeout: 10_000 });
    await this.locationIcon.click();
    await expect(this.locationModal).toBeVisible({ timeout: 10_000 });
  }

  async assertPageShell(): Promise<void> {
    await expect(this.page.getByText(/Home\s*>\s*Disease Condition/i)).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'View All' })).toBeVisible();
    await expect(this.conditionSearchInput).toBeVisible();
    await expect(this.testSearchInput).toBeVisible();
    await expect(this.itemsCountLabel).toBeVisible();
    await expect(this.page.getByText('Test Code', { exact: true }).first()).toBeVisible();
    await expect(this.tableRows.first()).toBeVisible();
  }

  async assertConditionFilterChangesCatalog(condition = 'Heart'): Promise<void> {
    await this.waitForCatalogRows();

    const totalBeforeFilter = await this.readItemsCount();
    expect(totalBeforeFilter, 'Disease Condition page should list at least one test.').toBeGreaterThan(0);

    const conditionCard = this.page.getByText(new RegExp(`^\\s*${this.escapeRegExp(condition)}\\s*$`, 'i')).first();

    await expect(conditionCard, `Condition "${condition}" should be visible.`).toBeVisible({
      timeout: 15_000
    });
    await conditionCard.click();

    await expect
      .poll(async () => this.readItemsCount(), {
        timeout: 20_000,
        message: `Filtering by "${condition}" should reduce total listed items.`
      })
      .toBeLessThan(totalBeforeFilter);

    await this.waitForCatalogRows();
  }

  async assertSearchByTestCodeWorks(): Promise<void> {
    await this.waitForCatalogRows();

    const totalBeforeSearch = await this.readItemsCount();
    const firstTestCode = (await this.firstTestCodeCell.innerText()).trim();
    expect(firstTestCode, 'Could not read the first row test code on Disease Condition page.').not.toBe('');

    await this.testSearchInput.fill(firstTestCode);
    if (await this.testSearchButton.isVisible().catch(() => false)) {
      await this.testSearchButton.click();
    } else {
      await this.testSearchInput.press('Enter');
    }

    await expect(this.tableRows.filter({ hasText: firstTestCode }).first()).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(async () => this.readItemsCount(), {
        timeout: 15_000,
        message: 'Search should not increase the number of listed disease condition tests.'
      })
      .toBeLessThanOrEqual(totalBeforeSearch);
  }

  async assertLoggedInAddToCartUpdatesCartCount(): Promise<void> {
    await this.waitForCatalogRows();

    const initialCount = await this.readCartCount();
    await expect(this.addToCartButton).toBeVisible({ timeout: 15_000 });
    await this.addToCartButton.click();

    await expect
      .poll(async () => this.readCartCount(), {
        timeout: 20_000,
        message: 'Cart count should increase after adding a disease condition test for logged-in user.'
      })
      .toBeGreaterThan(initialCount);

    await expect(this.toastMessage.filter({ hasText: 'User not Login' }).first()).toBeHidden({
      timeout: 5_000
    });
  }

  async assertAddToCartShowsLoginWarning(): Promise<void> {
    await this.waitForCatalogRows();
    await expect(this.addToCartButton).toBeVisible({ timeout: 15_000 });
    await this.addToCartButton.click();
    await expect(this.toastMessage.filter({ hasText: 'User not Login' }).first()).toBeVisible({
      timeout: 10_000
    });
  }

  private async waitForCatalogRows(timeoutMs = 50_000): Promise<void> {
    const loadingTests = this.page.getByText('Loading tests...', { exact: false }).first();
    const noDataFound = this.page.getByText('No Data Found', { exact: false }).first();

    if (await loadingTests.isVisible().catch(() => false)) {
      try {
        await expect(loadingTests).toBeHidden({ timeout: timeoutMs });
      } catch {
        // Optional wait can time out without failing the flow.
      }
    }

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      if (!(await noDataFound.isVisible().catch(() => false))) {
        break;
      }

      await this.page.reload({ waitUntil: 'domcontentloaded' });
      if (await loadingTests.isVisible().catch(() => false)) {
        try {
          await expect(loadingTests).toBeHidden({ timeout: timeoutMs });
        } catch {
          // Optional wait can time out without failing the flow.
        }
      }
    }

    if (await noDataFound.isVisible().catch(() => false)) {
      for (const fallbackCity of ['Mumbai', 'Bengaluru', 'Hyderabad']) {
        await this.openLocationSelector().catch(() => {});
        await this.selectCity(fallbackCity);
        if (await loadingTests.isVisible().catch(() => false)) {
          try {
            await expect(loadingTests).toBeHidden({ timeout: timeoutMs });
          } catch {
            // Optional wait can time out without failing the flow.
          }
        }

        if (
          await this.tableRows
            .first()
            .isVisible()
            .catch(() => false)
        ) {
          return;
        }
      }
    }

    if (await noDataFound.isVisible().catch(() => false)) {
      throw new Error(
        "Disease Condition catalog returned 'No Data Found' after retry and fallback-city attempts. This is likely an environment or data issue."
      );
    }

    await expect(this.tableRows.first(), 'Disease Condition catalog rows should be visible.').toBeVisible({
      timeout: timeoutMs
    });
  }

  private async readItemsCount(): Promise<number> {
    const itemsText = (await this.itemsCountLabel.innerText()).trim();
    const parsedCount = Number.parseInt(itemsText.replace(/[^\d]/g, ''), 10);
    expect(Number.isNaN(parsedCount), `Could not parse item count from "${itemsText}".`).toBe(false);
    return parsedCount;
  }

  private async readCartCount(): Promise<number> {
    const cartText = (await this.cartButton.innerText()).trim();
    const parsedCount = Number.parseInt(cartText.replace(/[^\d]/g, ''), 10);
    expect(Number.isNaN(parsedCount), `Could not parse cart count from "${cartText}".`).toBe(false);
    return parsedCount;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async clickFirstAvailableCity(): Promise<boolean> {
    return this.locationModal.evaluate((modal) => {
      const excludedLabels = [
        'Select your Location',
        'Search your City',
        'Use Current Location',
        'Please select your location first',
        'Metro Cities',
        'Other Cities',
        'Loading cities...'
      ];

      const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim();
      const fallbackCity = Array.from(modal.querySelectorAll<HTMLElement>('*')).find((element) => {
        const label = normalizeText(element.innerText || element.textContent || '');
        if (!label || label.length > 60) {
          return false;
        }

        if (excludedLabels.some((excluded) => label.toLowerCase() === excluded.toLowerCase())) {
          return false;
        }

        if (!/^[A-Za-z][A-Za-z .,'()&-]+$/.test(label)) {
          return false;
        }

        const style = window.getComputedStyle(element);
        return style.cursor === 'pointer';
      });

      if (!fallbackCity) {
        return false;
      }

      fallbackCity.click();
      return true;
    });
  }
}
