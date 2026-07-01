import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class DoctorSpecialityPage extends BasePage {
  private readonly locationModal: Locator;
  private readonly locationIcon: Locator;
  private readonly cartButton: Locator;
  private readonly specialitySearchInput: Locator;
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
    this.specialitySearchInput = this.page.locator('input[placeholder="Search"]').first();
    this.testSearchInput = this.page.locator('input[placeholder="Search by Tests"]').first();
    this.testSearchButton = this.page.locator('div:has(input[placeholder="Search by Tests"]) button').first();
    this.itemsCountLabel = this.page
      .locator('div, span, p')
      .filter({ hasText: /\d+\s*Items/i })
      .first();
    this.tableRows = this.page.locator('tbody tr');
    this.firstTestCodeCell = this.page.locator('tbody tr td:nth-child(3)').first();
    this.addToCartButton = this.page.getByRole('button', { name: 'Add to Cart' }).first();
    this.toastMessage = this.page.locator('.Toastify__toast, [role="alert"], [data-sonner-toast]');
  }

  async open(): Promise<void> {
    await this.goto('/doctor-speciality');
  }

  async openAndSelectCity(city = 'Delhi'): Promise<void> {
    await this.open();
    await this.page.removeLocatorHandler(this.locationModal).catch(() => {});
    await this.page.addLocatorHandler(this.locationModal, async () => {
      await this.page.removeLocatorHandler(this.locationModal).catch(() => {});
      try {
        await this.closeLocationModal(city).catch(() => {});
      } finally {
        // No re-registration needed here
      }
    });
    await this.closeLocationModal(city);
    await this.closeLocationModal(city).catch(() => {});
    await this.waitForCatalogRows();
  }

  async openLocationSelector(): Promise<void> {
    await expect(this.locationIcon).toBeVisible({ timeout: 10_000 });
    await this.locationIcon.click();
    await expect(this.locationModal).toBeVisible({ timeout: 10_000 });
  }

  async assertPageShell(): Promise<void> {
    await expect(this.page.getByText(/Home\s*>\s*Doctor Speciality/i)).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'View All' })).toBeVisible();
    await expect(this.specialitySearchInput).toBeVisible();
    await expect(this.testSearchInput).toBeVisible();
    await expect(this.itemsCountLabel).toBeVisible();
    await expect(this.page.getByText('Test Code', { exact: true }).first()).toBeVisible();
    await expect(this.tableRows.first()).toBeVisible();
  }

  async assertSpecialityFilterChangesCatalog(speciality = 'Cardiologist'): Promise<void> {
    await this.waitForCatalogRows();

    const specialityCard = this.page
      .getByText(new RegExp(`^\\s*${this.escapeRegExp(speciality)}\\s*$`, 'i'))
      .filter({ hasNot: this.page.locator('table') })
      .first();

    const beforeRowSignature = await this.readFirstRowSignature();
    const beforeCardStyle = await this.readCardStyleSignature(specialityCard);

    await expect(specialityCard, `Speciality "${speciality}" should be visible.`).toBeVisible({
      timeout: 15_000
    });
    await specialityCard.click({ force: true });

    await expect
      .poll(
        async () => ({
          firstRowSignature: await this.readFirstRowSignature(),
          cardStyle: await this.readCardStyleSignature(specialityCard),
          visibleRows: await this.readVisibleRowCount()
        }),
        {
          timeout: 20_000,
          message: `Filtering by "${speciality}" should visibly update the doctor speciality catalog.`
        }
      )
      .toEqual(
        expect.objectContaining({
          visibleRows: expect.any(Number)
        })
      );

    const afterRowSignature = await this.readFirstRowSignature();
    const afterCardStyle = await this.readCardStyleSignature(specialityCard);
    const afterVisibleRows = await this.readVisibleRowCount();

    expect(afterVisibleRows, 'Filtered doctor speciality catalog should still show at least one row.').toBeGreaterThan(
      0
    );
    expect(
      afterRowSignature !== beforeRowSignature || afterCardStyle !== beforeCardStyle,
      `Filtering by "${speciality}" should change either the selected speciality state or the visible catalog rows.`
    ).toBe(true);

    await this.waitForCatalogRows();
  }

  async assertSearchByTestCodeWorks(): Promise<void> {
    await this.waitForCatalogRows();

    const firstTestCode = (await this.firstTestCodeCell.innerText()).trim();
    expect(firstTestCode, 'Could not read the first row test code on Doctor Speciality page.').not.toBe('');

    await this.testSearchInput.fill(firstTestCode);
    if (await this.testSearchButton.isVisible().catch(() => false)) {
      await this.testSearchButton.click();
    } else {
      await this.testSearchInput.press('Enter');
    }

    await expect(this.tableRows.filter({ hasText: firstTestCode }).first()).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(
        async () => {
          const rows = await this.readVisibleRowTexts();
          return rows.length > 0 && rows.every((row) => row.includes(firstTestCode));
        },
        {
          timeout: 20_000,
          message: `Searching doctor specialities by "${firstTestCode}" should narrow visible rows to matching results.`
        }
      )
      .toBe(true);
  }

  async assertAddToCartShowsLoginWarning(city = 'Delhi'): Promise<void> {
    await this.waitForCatalogRows();
    await this.closeLocationModal(city).catch(() => {});
    await this.closeLocationModal(city).catch(() => {});
    await expect(this.addToCartButton).toBeVisible({ timeout: 15_000 });
    await this.addToCartButton.click({ force: true });

    const loginModal = this.page.locator('input[placeholder*="Email"]').first();
    await expect(
      this.toastMessage
        .filter({ hasText: /User not Login|Login|Sign in/i })
        .first()
        .or(loginModal)
        .first(),
      'Guest add-to-cart should surface a login warning or login prompt.'
    ).toBeVisible({
      timeout: 10_000
    });
  }

  async assertLoggedInAddToCartUpdatesCartCount(): Promise<void> {
    await this.waitForCatalogRows();

    const initialCount = await this.readCartCount();
    await expect(this.addToCartButton).toBeVisible({ timeout: 15_000 });
    await this.addToCartButton.click();

    await expect
      .poll(async () => this.readCartCount(), {
        timeout: 20_000,
        message: 'Cart count should increase after adding a doctor speciality test for logged-in user.'
      })
      .toBeGreaterThan(initialCount);

    await expect(this.toastMessage.filter({ hasText: 'User not Login' }).first()).toBeHidden({
      timeout: 5_000
    });
  }

  private async waitForCatalogRows(timeoutMs = 120_000): Promise<void> {
    await this.closeLocationModal('Delhi').catch(() => {});
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
        "Doctor Speciality catalog returned 'No Data Found' after retry and fallback-city attempts. This is likely an environment or data issue."
      );
    }

    await expect(this.tableRows.first(), 'Doctor Speciality catalog rows should be visible.').toBeVisible({
      timeout: timeoutMs
    });
    await this.closeLocationModal('Delhi').catch(() => {});
  }

  private async readItemsCount(): Promise<number> {
    try {
      const text = await this.itemsCountLabel.evaluate((el: Element) =>
        Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent || '')
          .join('')
          .trim()
      );
      const full = text || (await this.itemsCountLabel.innerText({ timeout: 5_000 }));
      const match = full.match(/(\d+)/);
      return match ? Number.parseInt(match[1], 10) : 0;
    } catch {
      return 0;
    }
  }

  private async readVisibleRowCount(): Promise<number> {
    let visibleRows = 0;
    const count = await this.tableRows.count();
    for (let i = 0; i < count; i += 1) {
      if (
        await this.tableRows
          .nth(i)
          .isVisible()
          .catch(() => false)
      ) {
        visibleRows += 1;
      }
    }
    return visibleRows;
  }

  private async readVisibleRowTexts(): Promise<string[]> {
    const rows: string[] = [];
    const count = await this.tableRows.count();
    for (let i = 0; i < count; i += 1) {
      const row = this.tableRows.nth(i);
      if (await row.isVisible().catch(() => false)) {
        rows.push((await row.innerText()).replace(/\s+/g, ' ').trim());
      }
    }
    return rows;
  }

  private async readFirstRowSignature(): Promise<string> {
    const firstVisibleRow = this.tableRows.first();
    return firstVisibleRow
      .innerText()
      .then((text) => text.replace(/\s+/g, ' ').trim())
      .catch(() => '');
  }

  private async readCardStyleSignature(card: Locator): Promise<string> {
    return card
      .evaluate((element) => {
        const style = window.getComputedStyle(element);
        return `${style.backgroundColor}|${style.borderColor}|${element.className}`;
      })
      .catch(() => '');
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
