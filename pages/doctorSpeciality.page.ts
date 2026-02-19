import { BasePage } from "./base.page";

export class DoctorSpecialityPage extends BasePage {
  async open(): Promise<void> {
    await this.goto("/doctor-speciality");
  }
}
