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
              text.includes("login") ||
              text.includes("otp") ||
              text.includes("sign in") ||
              text.includes("send otp") ||
              text.includes("email");

            if (!isInteractiveModal) {
                await overlay.waitFor({ state: "hidden", timeout: 15_000 }).catch(async () => {
                    // Force hide if stuck
                    await overlay.evaluate((el: HTMLElement) => el.style.display = "none").catch(() => {});
                });
            }
        }
    }
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
