import { BasePage } from "./base.page";

export class FormsPage extends BasePage {
  async open(): Promise<void> {
    await this.goto("/forms");
  }
}
