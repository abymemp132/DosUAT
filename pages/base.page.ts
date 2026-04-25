import { Locator, Page, expect } from "@playwright/test";

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Navigation ====================

  async goto(path: string): Promise<void> {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.page.goto(path, { timeout: 45_000, waitUntil: "domcontentloaded" });
        return;
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts;
        if (isLastAttempt || !this.isRetriableNavigationError(error)) {
          throw error;
        }

        await this.page.waitForTimeout(attempt * 2_000);
      }
    }
  }

  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: "domcontentloaded" });
  }

  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  async goForward(): Promise<void> {
    await this.page.goForward();
  }

  // ==================== Wait Helpers ====================

  async waitForElementVisible(selector: string, timeout = 10_000): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: "visible", timeout });
    return locator;
  }

  async waitForElementHidden(selector: string, timeout = 10_000): Promise<void> {
    await this.page.locator(selector).waitFor({ state: "hidden", timeout });
  }

  async waitForElementAttached(selector: string, timeout = 10_000): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: "attached", timeout });
    return locator;
  }

  async waitForURL(pattern: string | RegExp, timeout = 30_000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  async waitForLoadState(state: "load" | "domcontentloaded" | "networkidle" = "networkidle", timeout = 30_000): Promise<void> {
    await this.page.waitForLoadState(state, { timeout });
  }

  async waitForTimeout(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  // ==================== Click Helpers ====================

  async clickButton(selector: string, timeout = 10_000): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: "visible", timeout });
    await locator.click();
  }

  async clickButtonByText(text: string, timeout = 10_000): Promise<void> {
    const locator = this.page.getByRole("button", { name: text });
    await locator.waitFor({ state: "visible", timeout });
    await locator.click();
  }

  async clickLinkByText(text: string, timeout = 10_000): Promise<void> {
    const locator = this.page.getByRole("link", { name: text });
    await locator.waitFor({ state: "visible", timeout });
    await locator.click();
  }

  // ==================== Input Helpers ====================

  async fillInput(selector: string, value: string, timeout = 10_000): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: "visible", timeout });
    await locator.clear();
    await locator.fill(value);
  }

  async fillInputByPlaceholder(placeholder: string, value: string, timeout = 10_000): Promise<void> {
    const locator = this.page.getByPlaceholder(placeholder);
    await locator.waitFor({ state: "visible", timeout });
    await locator.clear();
    await locator.fill(value);
  }

  async selectDropdown(selector: string, value: string, timeout = 10_000): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: "visible", timeout });
    await locator.selectOption(value);
  }

  // ==================== Text Helpers ====================

  async getText(selector: string, timeout = 10_000): Promise<string> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: "visible", timeout });
    const text = await locator.textContent();
    return text || "";
  }

  async getTextByRole(role: "heading" | "button" | "link" | "paragraph", name: string | RegExp, timeout = 10_000): Promise<string> {
    const locator = this.page.getByRole(role, { name });
    await locator.waitFor({ state: "visible", timeout });
    const text = await locator.textContent();
    return text || "";
  }

  async getInputValue(selector: string, timeout = 10_000): Promise<string> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: "visible", timeout });
    return locator.inputValue();
  }

  // ==================== Visibility Helpers ====================

  async isElementVisible(selector: string, timeout = 5_000): Promise<boolean> {
    try {
      const locator = this.page.locator(selector);
      await locator.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  async waitForModalsToClose(): Promise<void> {
    const overlays = this.page.locator("div.fixed.inset-0.z-50, .loading-overlay, .modal-backdrop");
    
    // Give a short moment for animations to start/finish
    await this.page.waitForTimeout(500);

    const count = await overlays.count();
    for (let i = 0; i < count; i++) {
        const overlay = overlays.nth(i);
        if (await overlay.isVisible().catch(() => false)) {
            const text = ((await overlay.textContent().catch(() => "")) || "").toLowerCase();
            const isInteractiveModal =
              text.includes("select your location") ||
              text.includes("change city") ||
              text.includes("login") ||
              text.includes("otp") ||
              text.includes("sign in") ||
              text.includes("send otp") ||
              text.includes("email");

            if (!isInteractiveModal) {
                await overlay.waitFor({ state: "hidden", timeout: 5_000 }).catch(async () => {
                    // Force hide if stuck
                    await overlay.evaluate((el: HTMLElement) => el.style.display = "none").catch(() => {});
                });
            }
        }
    }
  }

  async selectCity(city: string): Promise<void> {
    const locationModal = this.page
      .locator("div.fixed.inset-0.z-50")
      .filter({ hasText: /Select your Location|Change City/i })
      .first();
    await expect
      .poll(async () => locationModal.isVisible().catch(() => false), { timeout: 8_000 })
      .toBe(true)
      .catch(() => {});
    if (!(await locationModal.isVisible().catch(() => false))) {
      return;
    }

    const citySelected = await this.trySelectCityFromModal(locationModal, city);
    expect(citySelected, `City option "${city}" was not available and no fallback city option was found.`).toBe(true);
    await this.dismissLocationModal(locationModal);
  }

  async closeLocationModal(city = "Delhi"): Promise<void> {
    const locationModal = this.page
      .locator("div.fixed.inset-0.z-50")
      .filter({ hasText: /Select your Location|Change City/i })
      .first();

    await expect
      .poll(async () => locationModal.isVisible().catch(() => false), { timeout: 8_000 })
      .toBe(true)
      .catch(() => {});

    if (!(await locationModal.isVisible().catch(() => false))) {
      return;
    }

    const loadingCities = locationModal.getByText("Loading cities...", { exact: false });
    if (await loadingCities.isVisible().catch(() => false)) {
      await expect(loadingCities).toBeHidden({ timeout: 30_000 }).catch(() => {});
    }

    const preferredCityOption = locationModal
      .getByText(new RegExp(`^\\s*${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"))
      .first();

    const clickPreferredCity = async (): Promise<boolean> => {
      if (!(await preferredCityOption.isVisible({ timeout: 5_000 }).catch(() => false))) {
        return false;
      }
      await preferredCityOption.click({ force: true });
      return true;
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

  async isElementHidden(selector: string, timeout = 5_000): Promise<boolean> {
    try {
      const locator = this.page.locator(selector);
      await locator.waitFor({ state: "hidden", timeout });
      return true;
    } catch {
      return false;
    }
  }

  async isElementAttached(selector: string, timeout = 5_000): Promise<boolean> {
    try {
      const locator = this.page.locator(selector);
      await locator.waitFor({ state: "attached", timeout });
      return true;
    } catch {
      return false;
    }
  }

  // ==================== Assert Helpers ====================

  async assertElementVisible(selector: string, timeout = 10_000): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible({ timeout });
  }

  async assertElementHidden(selector: string, timeout = 10_000): Promise<void> {
    await expect(this.page.locator(selector)).toBeHidden({ timeout });
  }

  async assertTextContains(selector: string, text: string, timeout = 10_000): Promise<void> {
    await expect(this.page.locator(selector)).toContainText(text, { timeout });
  }

  async assertInputValue(selector: string, value: string, timeout = 10_000): Promise<void> {
    await expect(this.page.locator(selector)).toHaveValue(value, { timeout });
  }

  async assertURLContains(text: string, timeout = 10_000): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(text), { timeout });
  }

  // ==================== Utility ====================

  async scrollToElement(selector: string): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.scrollIntoViewIfNeeded();
  }

  async hoverElement(selector: string): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.hover();
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  // ==================== Private ====================

  private async trySelectCityFromModal(locationModal: Locator, city: string): Promise<boolean> {
    const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const preferredCityOption = locationModal
      .getByText(new RegExp(`^\\s*${escapedCity}\\s*$`, "i"))
      .first();

    if (await preferredCityOption.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await preferredCityOption.click({ force: true });
      return true;
    }

    const searchInput = locationModal.getByPlaceholder(/Search your City/i);
    if (await searchInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await searchInput.fill(city);
      if (await preferredCityOption.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await preferredCityOption.click({ force: true });
        return true;
      }
      await searchInput.fill("").catch(() => {});
    }

    return this.clickFirstAvailableCityOption(locationModal);
  }

  private async dismissLocationModal(locationModal: Locator): Promise<void> {
    await expect(locationModal).toBeHidden({ timeout: 10_000 }).catch(async () => {
      await this.page.keyboard.press("Escape").catch(() => {});
      const closeBtn = locationModal
        .locator("button[title='Close'], button[aria-label='Close'], button.bg-red-500")
        .first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => {});
      }
    });
    await this.waitForModalsToClose();
  }

  private async clickFirstAvailableCityOption(locationModal: Locator): Promise<boolean> {
    return locationModal.evaluate((modal) => {
      const excludedLabels = [
        "Select your Location",
        "Search your City",
        "Use Current Location",
        "Please select your location first",
        "Metro Cities",
        "Other Cities",
        "Loading cities..."
      ];

      const normalizeText = (value: string): string => value.replace(/\s+/g, " ").trim();
      const fallbackCity = Array.from(modal.querySelectorAll<HTMLElement>("*")).find((element) => {
        const label = normalizeText(element.innerText || element.textContent || "");
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
        return style.cursor === "pointer";
      });

      if (!fallbackCity) {
        return false;
      }

      fallbackCity.click();
      return true;
    });
  }

  private isRetriableNavigationError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    const retriableMarkers = [
      "net::ERR_CONNECTION_TIMED_OUT",
      "net::ERR_CONNECTION_RESET",
      "net::ERR_CONNECTION_REFUSED",
      "net::ERR_INTERNET_DISCONNECTED",
      "net::ERR_NETWORK_CHANGED",
      "net::ERR_NAME_NOT_RESOLVED",
      "Timeout",
      "Navigation timeout"
    ];

    return retriableMarkers.some((marker) => message.includes(marker));
  }
}
