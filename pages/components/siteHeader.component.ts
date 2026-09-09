import { Locator, Page } from "@playwright/test";

export class SiteHeaderComponent {
  readonly header: Locator;
  readonly logoLink: Locator;
  readonly locationIcon: Locator;
  readonly profileButton: Locator;
  readonly cartButton: Locator;

  constructor(private readonly page: Page) {
    this.header = this.page.locator("header");
    this.logoLink = this.header.getByRole("link", { name: "Oncquest Laboratories" });
    this.locationIcon = this.header.locator('img[alt="location"]').first();
    // Using more robust locators if possible, otherwise keeping existing ones
    this.profileButton = this.header.locator("button").first();
    this.cartButton = this.header.locator("button").filter({ hasText: /^\d+$/ }).first();
  }

  async clickLogo(): Promise<void> {
    await this.logoLink.waitFor({ state: "visible", timeout: 10_000 });
    await this.logoLink.click();
  }

  async openLocationModal(): Promise<void> {
    await this.locationIcon.waitFor({ state: "visible", timeout: 10_000 });
    await this.locationIcon.click();
  }

  async openProfileMenu(): Promise<void> {
    await this.profileButton.waitFor({ state: "visible", timeout: 10_000 });
    await this.profileButton.click();
  }

  async openCart(): Promise<void> {
    await this.cartButton.waitFor({ state: "visible", timeout: 10_000 });
    await this.cartButton.click();
  }
}
