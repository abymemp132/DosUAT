import { Locator, Page } from "@playwright/test";

export class FrameworkHealthPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = this.page.getByRole("heading", { name: "Automation Ready" });
  }

  async openDemoMarkup(): Promise<void> {
    await this.page.setContent("<main><h1>Automation Ready</h1></main>");
  }
}
