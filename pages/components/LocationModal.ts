import { Locator, Page, expect } from '@playwright/test';

export class LocationModal {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForModalsToClose(): Promise<void> {
    const overlays = this.page.locator('div.fixed.inset-0.z-50, .loading-overlay, .modal-backdrop');

    // Give a short moment for animations to start/finish
    await this.page.waitForTimeout(500);

    const count = await overlays.count();
    for (let i = 0; i < count; i++) {
      const overlay = overlays.nth(i);
      if (await overlay.isVisible().catch(() => false)) {
        const text = ((await overlay.textContent().catch(() => '')) || '').toLowerCase();
        const isInteractiveModal =
          text.includes('select your location') ||
          text.includes('change city') ||
          text.includes('login') ||
          text.includes('otp') ||
          text.includes('sign in') ||
          text.includes('send otp') ||
          text.includes('email');

        if (!isInteractiveModal) {
          await overlay.waitFor({ state: 'hidden', timeout: 5_000 }).catch(async () => {
            // Force hide if stuck
            await overlay.evaluate((el: HTMLElement) => (el.style.display = 'none')).catch(() => {});
          });
        }
      }
    }
  }

  async selectCity(city: string): Promise<void> {
    const locationModal = this.page
      .locator('div.fixed.inset-0.z-50')
      .filter({ hasText: /Select your Location|Change City/i })
      .first();
    try {
      await expect.poll(async () => locationModal.isVisible().catch(() => false), { timeout: 8_000 }).toBe(true);
    } catch {
      // Optional wait can time out without failing the flow.
    }
    if (!(await locationModal.isVisible().catch(() => false))) {
      return;
    }

    const citySelected = await this.trySelectCityFromModal(locationModal, city);
    expect(citySelected, `City option "${city}" was not available and no fallback city option was found.`).toBe(true);
    await this.dismissLocationModal(locationModal);
  }

  async closeLocationModal(city = 'Delhi'): Promise<void> {
    const locationModal = this.page
      .locator('div.fixed.inset-0.z-50')
      .filter({ hasText: /Select your Location|Change City/i })
      .first();

    try {
      await expect.poll(async () => locationModal.isVisible().catch(() => false), { timeout: 8_000 }).toBe(true);
    } catch {
      // Optional wait can time out without failing the flow.
    }

    if (!(await locationModal.isVisible().catch(() => false))) {
      return;
    }

    const loadingCities = locationModal.getByText('Loading cities...', { exact: false }).first();
    try {
      await expect(loadingCities).toBeHidden({ timeout: 15000 });
    } catch {
      // Optional wait can time out without failing the flow.
    }

    const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const preferredCityOption = locationModal.getByText(new RegExp(`^\\s*${escapedCity}\\s*$`, 'i')).first();

    const clickPreferredCity = async (): Promise<boolean> => {
      try {
        await preferredCityOption.waitFor({ state: 'visible', timeout: 5000 });
        await preferredCityOption.click().catch(() => preferredCityOption.click({ force: true }));
        return true;
      } catch {
        return false;
      }
    };

    if (await clickPreferredCity()) {
      await this.dismissLocationModal(locationModal);
      return;
    }

    const citySelected = await this.trySelectCityFromModal(locationModal, city);
    if (citySelected) {
      await this.dismissLocationModal(locationModal);
      return;
    }

    await this.dismissLocationModal(locationModal);
  }

  async closeLocationModalNoAssertions(city = 'Delhi'): Promise<void> {
    const locationModal = this.page
      .locator('div.fixed.inset-0.z-50')
      .filter({ hasText: /Select your Location|Change City/i })
      .first();

    if (!(await locationModal.isVisible().catch(() => false))) {
      return;
    }

    const loadingCities = locationModal.getByText('Loading cities...', { exact: false }).first();
    try {
      await expect(loadingCities).toBeHidden({ timeout: 15000 });
    } catch {}

    const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const preferredCityOption = locationModal.getByText(new RegExp(`^\\s*${escapedCity}\\s*$`, 'i')).first();

    try {
      await preferredCityOption.waitFor({ state: 'visible', timeout: 3000 });
      await preferredCityOption.click().catch(() => preferredCityOption.click({ force: true }));
    } catch {
      const searchInput = locationModal.getByPlaceholder(/Search your City/i);
      try {
        await searchInput.waitFor({ state: 'visible', timeout: 2000 });
        await searchInput.fill(city).catch(() => {});
        await preferredCityOption.waitFor({ state: 'visible', timeout: 3000 });
        await preferredCityOption.click().catch(() => preferredCityOption.click({ force: true }));
      } catch {
        await this.clickFirstAvailableCityOption(locationModal).catch(() => {});
      }
    }

    for (let i = 0; i < 20; i++) {
      if (!(await locationModal.isVisible().catch(() => false))) {
        return;
      }
      await this.page.waitForTimeout(200);
    }

    await this.page.keyboard.press('Escape').catch(() => {});
    const closeBtn = locationModal
      .locator("button[title='Close'], button[aria-label='Close'], button.bg-red-500")
      .first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ force: true }).catch(() => {});
    }
  }

  private async trySelectCityFromModal(locationModal: Locator, city: string): Promise<boolean> {
    const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const preferredCityOption = locationModal.getByText(new RegExp(`^\\s*${escapedCity}\\s*$`, 'i')).first();

    try {
      await preferredCityOption.waitFor({ state: 'visible', timeout: 5000 });
      await preferredCityOption.click().catch(() => preferredCityOption.click({ force: true }));
      return true;
    } catch {
      // Ignore and proceed to search
    }

    const searchInput = locationModal.getByPlaceholder(/Search your City/i);
    try {
      await searchInput.waitFor({ state: 'visible', timeout: 2000 });
      await searchInput.fill(city);
      await preferredCityOption.waitFor({ state: 'visible', timeout: 5000 });
      await preferredCityOption.click().catch(() => preferredCityOption.click({ force: true }));
      return true;
    } catch {
      await searchInput.fill('').catch(() => {});
    }

    return this.clickFirstAvailableCityOption(locationModal);
  }

  private async dismissLocationModal(locationModal: Locator): Promise<void> {
    try {
      await expect(locationModal).toBeHidden({ timeout: 10_000 });
    } catch {
      await this.page.keyboard.press('Escape').catch(() => {});
      const closeBtn = locationModal
        .locator("button[title='Close'], button[aria-label='Close'], button.bg-red-500")
        .first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => {});
      }
    }
    await this.waitForModalsToClose();
  }

  public async clickFirstAvailableCityOption(locationModal: Locator): Promise<boolean> {
    const cityNames = await this.page.evaluate(() => {
      const modal = Array.from(document.querySelectorAll<HTMLElement>('div.fixed.inset-0.z-50')).find((el) =>
        /Select your Location|Change City/i.test(el.textContent || '')
      );
      if (!modal) {
        return [];
      }

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
      const elements = Array.from(modal.querySelectorAll<HTMLElement>('*'));
      const cities: string[] = [];

      for (const element of elements) {
        const label = normalizeText(element.innerText || element.textContent || '');
        if (!label || label.length > 60) {
          continue;
        }

        if (excludedLabels.some((excluded) => label.toLowerCase() === excluded.toLowerCase())) {
          continue;
        }

        if (!/^[A-Za-z][A-Za-z .,'()&-]+$/.test(label)) {
          continue;
        }

        const style = window.getComputedStyle(element);
        if (style.cursor === 'pointer') {
          cities.push(label);
        }
      }
      return cities;
    });

    if (cityNames.length === 0) {
      return false;
    }

    const firstCity = cityNames[0];
    const escapedCity = firstCity.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');
    const cityOption = locationModal.getByText(new RegExp(`^\\s*${escapedCity}\\s*$`, 'i')).first();
    
    if (await cityOption.isVisible().catch(() => false)) {
      await cityOption.click({ force: true }).catch(() => {});
      return true;
    }
    return false;
  }
}
