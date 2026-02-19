import { BasePage } from "./base.page";

export class SpecialitySegmentPage extends BasePage {
  async open(): Promise<void> {
    await this.goto("/speciality-segment");
  }
}
