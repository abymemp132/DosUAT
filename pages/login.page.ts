import { expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  private readonly locationModal: Locator;
  private readonly profileButton: Locator;
  private readonly emailInput: Locator;
  private readonly sendOtpButton: Locator;
  private readonly otpTitle: Locator;
  private readonly otpInputs: Locator;
  private readonly verifyButton: Locator;
  public readonly logoutButton: Locator;

  constructor(page: ConstructorParameters<typeof BasePage>[0]) {
    super(page);
    const headerButtons = this.page
      .locator('header')
      .locator('button')
      .filter({ has: this.page.locator('img, svg') });
    this.locationModal = this.page
      .locator('div.fixed.inset-0.z-50')
      .filter({ hasText: /Select your Location|Change City/i })
      .first();
    this.profileButton = headerButtons.filter({ hasNotText: /^\d+$/ }).first();
    this.emailInput = this.page.locator('input[placeholder*="Email"]').first();
    this.sendOtpButton = this.page.getByRole('button', { name: /send otp/i });
    this.otpTitle = this.page.getByText('OTP Verification');
    this.otpInputs = this.page.locator('input[maxlength="1"]');
    this.verifyButton = this.page.getByRole('button', { name: /^verify$/i });
    this.logoutButton = this.page
      .locator('button, a, div, span')
      .filter({ hasText: /logout|sign\s*out/i })
      .first();
  }

  private parseJwtPayload(token: string | null): { exp?: number; EmailId?: string } | null {
    if (!token) {
      return null;
    }

    try {
      return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf-8')) as {
        exp?: number;
        EmailId?: string;
      };
    } catch {
      return null;
    }
  }

  async openHome(): Promise<void> {
    await this.goto('/');
  }

  async closeLocationModal(city = 'Delhi'): Promise<void> {
    await this.locationModal.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});

    if (!(await this.locationModal.isVisible())) {
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

      await preferredCityOption.click({ force: true });
      return true;
    };

    if (await clickPreferredCity()) {
      try {
        await expect(this.locationModal).toBeHidden({ timeout: 10_000 });
      } catch {
        await this.page.keyboard.press('Escape').catch(() => {});
        const closeBtn = this.locationModal
          .locator("button[title='Close'], button[aria-label='Close'], button.bg-red-500")
          .first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click().catch(() => {});
        }
      }
      return;
    }

    const searchInput = this.locationModal.getByPlaceholder(/Search your City/i);
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
    try {
      await expect(this.locationModal).toBeHidden({ timeout: 10_000 });
    } catch {
      await this.page.keyboard.press('Escape');
    }
    await this.waitForModalsToClose();
  }

  async loginWithEmailOtp(email: string, otp: string, city = 'Delhi'): Promise<void> {
    await this.openHome();
    await this.closeLocationModal(city);
    await this.openLoginModal();
    await this.requestOtp(email);
    await this.verifyOtp(otp);
  }

  async openLoginModal(): Promise<void> {
    await this.waitForModalsToClose();
    await this.profileButton.click({ force: true });
    await expect(this.emailInput).toBeVisible();
  }

  async requestOtp(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.sendOtpButton.click();
    await expect(this.otpTitle).toBeVisible({ timeout: 60_000 });
  }

  async verifyOtp(otp: string): Promise<void> {
    await expect(this.otpInputs).toHaveCount(6, { timeout: 10_000 });

    // Focus the first input and type all digits sequentially — faster than
    // filling each input individually in a loop.
    await this.otpInputs.first().click();
    await this.otpInputs.first().pressSequentially(otp.trim(), { delay: 50 });

    await this.verifyButton.click({ force: true });
    await expect(this.otpTitle, 'OTP verification did not complete. The OTP may be invalid or expired.').toBeHidden({
      timeout: 60_000
    });
  }

  async openProfileMenu(): Promise<void> {
    await this.waitForModalsToClose();
    await this.profileButton.click({ force: true });
  }

  // Assertions should ideally live in the spec files.
  // We expose locators for testing these directly in specs instead.

  getLoggedInEmailLocator(email: string): Locator {
    return this.page.getByText(email, { exact: false });
  }

  /** @deprecated use the locators directly using native expects in the spec file. */
  async assertUserIsLoggedIn(email: string): Promise<void> {
    await this.assertSessionIsActive(email);
  }

  async assertSessionIsActive(expectedEmail?: string): Promise<void> {
    const sessionState = await this.page.evaluate(() => ({
      token: window.localStorage.getItem('authToken'),
      cityId: window.localStorage.getItem('CityId'),
      selectedCity: window.localStorage.getItem('selectedCity')
    }));
    const tokenPayload = this.parseJwtPayload(sessionState.token);
    const tokenExpiry = tokenPayload?.exp ?? null;
    const tokenIsFresh = tokenExpiry ? tokenExpiry * 1000 > Date.now() : false;

    if (!tokenIsFresh) {
      throw new Error(
        `Session is not active: authToken is missing or expired. CityId=${sessionState.cityId ?? 'null'}, selectedCity=${sessionState.selectedCity ?? 'null'}`
      );
    }

    if (expectedEmail && tokenPayload?.EmailId && tokenPayload.EmailId.toLowerCase() !== expectedEmail.toLowerCase()) {
      throw new Error(`Session email mismatch. Expected ${expectedEmail}, found ${tokenPayload.EmailId}.`);
    }

    const menuShowsSessionUi =
      (await this.logoutButton.isVisible({ timeout: 3_000 }).catch(() => false)) ||
      (expectedEmail
        ? await this.getLoggedInEmailLocator(expectedEmail)
            .isVisible({ timeout: 3_000 })
            .catch(() => false)
        : false);

    if (!menuShowsSessionUi) {
      console.log('Session token is valid, but profile menu did not expose logout/email text on this UI state.');
    }
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
