import { BasePage } from "./base.page";

export class FaqPage extends BasePage {
  async open(): Promise<void> {
    await this.goto("/faq");
  }
}
