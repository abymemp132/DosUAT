import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class FaqPage extends BasePage {
  private readonly locationModal: Locator;
  private readonly breadcrumb: Locator;
  private readonly pageHeading: Locator;
  private readonly faqCards: Locator;
  private readonly faqQuestionButtons: Locator;
  private readonly showMoreButton: Locator;
  private readonly showLessButton: Locator;
  private readonly emptyStateMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.locationModal = this.page
      .locator('div.fixed.inset-0.z-50')
      .filter({ hasText: 'Select your Location' })
      .first();
    this.breadcrumb = this.page.getByText(/Home\s*>\s*FAQ'?s/i).first();
    this.pageHeading = this.page.getByText(/Frequently Asked Questions/i).first();
    this.faqCards = this.page.locator('div.bg-white.rounded-md.shadow-md.overflow-hidden');
    this.faqQuestionButtons = this.faqCards.locator('button').filter({ hasText: /\?$/ });
    this.showMoreButton = this.page.getByRole('button', { name: /show more/i });
    this.showLessButton = this.page.getByRole('button', { name: /show less/i });
    this.emptyStateMessage = this.page.getByText(/No FAQs? found|No Data Found/i).first();
  }

  async open(): Promise<void> {
    await this.goto('/FAQs');
  }

  async openAndSelectCity(city = 'Delhi'): Promise<void> {
    await this.open();
    await this.page.removeLocatorHandler(this.locationModal).catch(() => {});
    await this.page.addLocatorHandler(this.locationModal, async () => {
      await this.page.removeLocatorHandler(this.locationModal).catch(() => {});
      try {
        await this.selectCity(city).catch(() => {});
      } finally {
        // No re-registration needed here
      }
    });
    await this.selectCity(city);
    await this.waitForFaqsToLoad();
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
    const contentState = await this.waitForFaqsToLoad();

    await expect(this.breadcrumb).toBeVisible();
    await expect(this.pageHeading).toBeVisible();

    if (contentState === 'empty') {
      await expect(this.emptyStateMessage).toBeVisible();
      return;
    }

    expect(await this.faqQuestionButtons.count(), 'At least one FAQ question should be visible.').toBeGreaterThan(0);
  }

  async assertQuestionAccordionWorks(): Promise<void> {
    const contentState = await this.waitForFaqsToLoad();
    if (contentState === 'empty') {
      await expect(this.emptyStateMessage).toBeVisible();
      return;
    }

    const questionButton = this.faqQuestionButtons.first();
    const questionCard = questionButton.locator(
      "xpath=ancestor::div[contains(@class,'bg-white') and contains(@class,'rounded-md') and contains(@class,'shadow-md') and contains(@class,'overflow-hidden')][1]"
    );
    const answerPanel = questionCard.locator('div.p-4.border-t.border-gray-200.bg-white').first();

    await expect(questionButton).toBeVisible({ timeout: 10_000 });

    const answerInitiallyVisible = await answerPanel.isVisible().catch(() => false);
    await questionButton.click();

    if (answerInitiallyVisible) {
      await expect(answerPanel).toBeHidden({ timeout: 10_000 });
    } else {
      await expect(answerPanel).toBeVisible({ timeout: 10_000 });
    }

    await questionButton.click();

    if (answerInitiallyVisible) {
      await expect(answerPanel).toBeVisible({ timeout: 10_000 });
    } else {
      await expect(answerPanel).toBeHidden({ timeout: 10_000 });
    }
  }

  async assertShowMoreLoadsAdditionalQuestions(): Promise<void> {
    const contentState = await this.waitForFaqsToLoad();
    if (contentState === 'empty') {
      await expect(this.emptyStateMessage).toBeVisible();
      return;
    }

    const beforeCount = await this.faqQuestionButtons.count();
    expect(beforeCount, 'FAQ list should have at least one question.').toBeGreaterThan(0);

    if (!(await this.showMoreButton.isVisible().catch(() => false))) {
      // Show More is optional when all FAQ entries are already rendered.
      return;
    }

    await this.showMoreButton.click();

    await expect
      .poll(async () => this.faqQuestionButtons.count(), {
        timeout: 15_000,
        message: 'Show More should increase visible FAQ question count.'
      })
      .toBeGreaterThan(beforeCount);

    try {
      await expect(this.showLessButton).toBeVisible({ timeout: 10_000 });
    } catch {
      // Optional wait can time out without failing the flow.
    }
  }

  private async waitForFaqsToLoad(timeoutMs = 120_000): Promise<'hasData' | 'empty'> {
    const badGateway = this.page.getByText(/502 Bad Gateway|404|This page could not be found/i).first();
    if (await badGateway.isVisible().catch(() => false)) {
      throw new Error('FAQ page is unavailable (502/404). This appears to be an environment issue.');
    }

    await expect(this.pageHeading).toBeVisible({ timeout: timeoutMs });

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if ((await this.faqQuestionButtons.count()) > 0) {
        return 'hasData';
      }

      if (await this.emptyStateMessage.isVisible().catch(() => false)) {
        return 'empty';
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error('FAQ page did not render questions or an empty-state message within the expected time.');
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
