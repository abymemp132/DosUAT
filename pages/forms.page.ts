import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class FormsPage extends BasePage {
  private readonly locationModal: Locator;
  private readonly consentSearchInput: Locator;
  private readonly formCards: Locator;
  private readonly formTitleSpans: Locator;
  private readonly downloadLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.locationModal = this.page
      .locator('div.fixed.inset-0.z-50')
      .filter({ hasText: 'Select your Location' })
      .first();
    this.consentSearchInput = this.page.locator('input[placeholder="Search by Consent"]').first();
    this.formCards = this.page.locator('div.bg-white.rounded-lg.shadow-md.border.border-gray-200.overflow-hidden');
    this.formTitleSpans = this.formCards.locator('div.p-4 span').first();
    this.downloadLinks = this.page.locator(
      'a[href*="oncquest-admin-uat.abym.us/s/"], a[href*="/s/"], a[href$=".pdf"], a[href$=".PDF"]'
    );
  }

  async open(): Promise<void> {
    await this.goto('/consent-forms');
  }

  async openAndSelectCity(city = 'Delhi'): Promise<void> {
    await this.open();
    await this.page.removeLocatorHandler(this.locationModal).catch(() => {});
    await this.page.addLocatorHandler(this.locationModal, async () => {
      await this.page.removeLocatorHandler(this.locationModal).catch(() => {});
      try {
        await this.cityLocationModal.closeLocationModalNoAssertions(city).catch(() => {});
      } finally {
        // No re-registration needed here
      }
    });
    await this.selectCity(city);
    await this.waitForFormsToLoad();
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

  async assertPageShell(): Promise<void> {
    await expect(this.page.getByText(/Home\s*>\s*Test Requisition & Consent Forms/i)).toBeVisible();
    await expect(
      this.page
        .locator('p')
        .filter({ hasText: /^Test Requisition & Consent Forms$/ })
        .first()
    ).toBeVisible();
    await expect(this.consentSearchInput).toBeVisible();
    await expect(this.formCards.first()).toBeVisible();
    await expect(this.formTitleSpans.first()).toBeVisible();
  }

  async assertSearchByConsentWorks(query = 'MammaPrint', expectedTitle = 'MammaPrint TRF'): Promise<void> {
    await this.waitForFormsToLoad();

    const beforeCount = await this.formCards.count();
    expect(beforeCount, 'Consent forms list should contain at least one card.').toBeGreaterThan(0);

    await this.consentSearchInput.fill(query);

    await expect
      .poll(async () => this.formCards.count(), {
        timeout: 15_000,
        message: `Searching forms by "${query}" should narrow down visible cards.`
      })
      .toBeLessThanOrEqual(beforeCount);

    await expect(this.page.getByText(expectedTitle, { exact: true })).toBeVisible({ timeout: 10_000 });
  }

  async assertDownloadLinksArePresent(): Promise<void> {
    await this.waitForFormsToLoad();

    const linksCount = await this.downloadLinks.count();
    expect(linksCount, 'At least one download link should be visible on consent forms page.').toBeGreaterThan(0);

    const firstLink = this.downloadLinks.first();
    await expect(firstLink).toBeVisible({ timeout: 10_000 });
    await expect(
      firstLink,
      'Consent form download link should point to the admin file share or a PDF.'
    ).toHaveAttribute('href', /admin\.oncquestlabs\.com\/s\/|oncquest-admin-uat\.abym\.us\/s\/|\.pdf/i);
  }

  async assertShareLinksAreReachable(): Promise<void> {
    await this.assertDownloadLinksArePresent();

    const links = await this.downloadLinks.evaluateAll((elements) => {
      const hrefs = elements
        .map((element) => element.getAttribute('href'))
        .filter((value): value is string => Boolean(value));
      return Array.from(new Set(hrefs));
    });

    expect(links.length, 'No consent-form share links were found for reachability checks.').toBeGreaterThan(0);

    const failedLinks: string[] = [];
    for (const link of links) {
      try {
        const response = await this.page.request.get(link, {
          failOnStatusCode: false,
          timeout: 30_000
        });
        const status = response.status();
        if (status < 200 || status >= 400) {
          failedLinks.push(`${link} -> HTTP ${status}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failedLinks.push(`${link} -> ${message}`);
      }
    }

    expect(failedLinks, `Found unreachable consent-form share links:\n${failedLinks.join('\n')}`).toEqual([]);
  }

  private async waitForFormsToLoad(timeoutMs = 45_000): Promise<void> {
    await expect(this.consentSearchInput).toBeVisible({ timeout: timeoutMs });
    const firstCard = this.formCards.first();
    const firstLink = this.downloadLinks.first();
    await expect
      .poll(
        async () =>
          (await firstCard.isVisible().catch(() => false)) || (await firstLink.isVisible().catch(() => false)),
        {
          timeout: timeoutMs,
          message: 'Consent forms page should render cards or share/download links.'
        }
      )
      .toBe(true);
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
