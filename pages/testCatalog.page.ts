import { BasePage } from "./base.page";

export class TestCatalogPage extends BasePage {
  async open(): Promise<void> {
    await this.goto("/test-catalog");
  }
}
