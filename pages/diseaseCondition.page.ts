import { BasePage } from "./base.page";

export class DiseaseConditionPage extends BasePage {
  async open(): Promise<void> {
    await this.goto("/disease-condition");
  }
}
