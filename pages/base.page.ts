import { Page } from "@playwright/test";

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

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
