import { APIRequestContext, expect, Locator, Page, request } from '@playwright/test';
import { BasePage } from './base.page';

export class BrochurePage extends BasePage {
  private readonly locationModal: Locator;
  private readonly brochureSearchInput: Locator;
  private readonly brochureCards: Locator;
  private readonly shareLinks: Locator;
  private readonly emptyStateMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.locationModal = this.page
      .locator('div.fixed.inset-0.z-50')
      .filter({ hasText: 'Select your Location' })
      .first();
    this.brochureSearchInput = this.page
      .locator(
        'input[placeholder*="Search by Brochure"], input[placeholder*="Search by brochure"], input[placeholder*="Search"]'
      )
      .first();
    this.brochureCards = this.page.locator('div.bg-white.rounded-lg.shadow-md.border.border-gray-200.overflow-hidden');
    this.shareLinks = this.page.locator(
      'a[href*="oncquest-admin-uat.abym.us/s/"], a[href*="/s/"], a[href$=".pdf"], a[href$=".PDF"]'
    );
    this.emptyStateMessage = this.page.getByText(/No brochures found\.?/i).first();
  }

  async open(): Promise<void> {
    await this.goto('/brochure');
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
    await this.selectCity(city).catch(() => {});
    await this.waitForBrochuresToLoad();
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
    const contentState = await this.waitForBrochuresToLoad();
    await expect(this.page.getByText(/Home\s*>\s*Brochures?/i)).toBeVisible();
    await expect(this.brochureSearchInput).toBeVisible({ timeout: 10_000 });

    if (contentState === 'empty') {
      await expect(this.emptyStateMessage).toBeVisible();
      return;
    }

    const cardsCount = await this.brochureCards.count();
    const linksCount = await this.shareLinks.count();
    expect(
      cardsCount + linksCount,
      'Brochure page should show brochure cards or share/download links when data is available.'
    ).toBeGreaterThan(0);
  }

  async assertSearchBrochuresWorks(): Promise<void> {
    const contentState = await this.waitForBrochuresToLoad();

    await expect(this.brochureSearchInput).toBeVisible({ timeout: 10_000 });

    if (contentState === 'empty') {
      await this.brochureSearchInput.fill('mammaprint');
      await expect(
        this.emptyStateMessage,
        'Empty state should remain visible when no brochures are available.'
      ).toBeVisible();
      return;
    }

    const beforeCount = await this.brochureCards.count();
    expect(beforeCount, 'Brochure page should list at least one brochure card.').toBeGreaterThan(0);

    const firstCard = this.brochureCards.first();
    const firstCardText = await firstCard.evaluate((card) => {
      const texts = Array.from(card.querySelectorAll('span, h1, h2, h3, h4, p, a'))
        .map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim())
        .filter((text) => text.length > 0)
        .filter((text) => !/^download(\s+pdf\s+format)?$/i.test(text))
        .sort((left, right) => right.length - left.length);
      return texts[0] || (card.textContent || '').replace(/\s+/g, ' ').trim();
    });
    const normalizedText = firstCardText.replace(/Download PDF Format|Download/gi, '').trim();
    const searchQuery = this.pickSearchPhrase(normalizedText);
    expect(searchQuery, `Could not derive brochure search query from first card text "${firstCardText}".`).not.toBe('');

    await this.brochureSearchInput.fill(searchQuery);
    await expect
      .poll(async () => this.brochureCards.count(), {
        timeout: 15_000,
        message: `Searching brochures by "${searchQuery}" should not increase visible card count.`
      })
      .toBeLessThanOrEqual(beforeCount);
    await expect(this.brochureCards.first()).toContainText(new RegExp(this.escapeRegExp(searchQuery), 'i'), {
      timeout: 15_000
    });
  }

  async assertShareLinksAreReachable(): Promise<void> {
    const contentState = await this.waitForBrochuresToLoad();

    if (contentState === 'empty') {
      await expect(
        this.emptyStateMessage,
        'Empty state should be visible when no brochure links are available.'
      ).toBeVisible();
      return;
    }

    const links = await this.shareLinks.evaluateAll((elements) => {
      const hrefs = elements
        .map((element) => element.getAttribute('href'))
        .filter((value): value is string => Boolean(value));
      return Array.from(new Set(hrefs));
    });

    expect(links.length, 'No brochure share/download links were found for reachability checks.').toBeGreaterThan(0);

    const linksToCheck = links.slice(0, 8);
    const apiContext = await this.createRequestContext();
    const failedLinks: string[] = [];

    try {
      for (const link of linksToCheck) {
        const resolvedLink = new URL(link, this.page.url()).toString();
        try {
          let response = await apiContext.fetch(resolvedLink, {
            method: 'HEAD',
            failOnStatusCode: false,
            timeout: 10_000,
            maxRedirects: 5
          });

          if ([403, 405, 501].includes(response.status())) {
            response = await apiContext.get(resolvedLink, {
              failOnStatusCode: false,
              timeout: 10_000,
              maxRedirects: 5
            });
          }

          const status = response.status();
          if (status < 200 || status >= 400) {
            failedLinks.push(`${resolvedLink} -> HTTP ${status}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failedLinks.push(`${resolvedLink} -> ${message}`);
        }
      }
    } finally {
      await apiContext.dispose();
    }

    expect(failedLinks, `Found unreachable brochure share/download links:\n${failedLinks.join('\n')}`).toEqual([]);
  }

  private async waitForBrochuresToLoad(timeoutMs = 120_000): Promise<'hasData' | 'empty'> {
    const badGateway = this.page.getByText(/502 Bad Gateway|404|This page could not be found/i).first();
    if (await badGateway.isVisible().catch(() => false)) {
      throw new Error('Brochure page is unavailable (502/404). This appears to be an environment issue.');
    }

    await expect(this.page.getByText('Brochures', { exact: false }).first()).toBeVisible({
      timeout: timeoutMs
    });
    await expect(this.brochureSearchInput).toBeVisible({ timeout: timeoutMs });

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      // The brochure page may render as cards or as direct share links depending on release.
      if (
        await this.brochureCards
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        return 'hasData';
      }

      if (
        await this.shareLinks
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        return 'hasData';
      }

      if (await this.emptyStateMessage.isVisible().catch(() => false)) {
        return 'empty';
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error('Brochure page did not render cards, links, or empty-state message within the expected time.');
  }

  private pickSearchPhrase(value: string): string {
    const clean = value.replace(/\s+/g, ' ').trim();
    if (!clean) {
      return '';
    }

    const words = clean
      .split(' ')
      .map((word) => word.trim())
      .filter((word) => /[A-Za-z]/.test(word));

    if (words.length === 0) {
      return '';
    }

    return words.slice(0, 2).join(' ');
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async createRequestContext(): Promise<APIRequestContext> {
    return request.newContext({
      baseURL: this.page.url(),
      extraHTTPHeaders: {
        cookie: await this.page
          .context()
          .cookies()
          .then((cookies) => cookies.map(({ name, value }) => `${name}=${value}`).join('; '))
      }
    });
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
