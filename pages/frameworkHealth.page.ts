import { Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class FrameworkHealthPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Automation Ready" });
  }

  async openDemoMarkup(): Promise<void> {
    await this.page.setContent("<main><h1>Automation Ready</h1></main>");
  }
}
