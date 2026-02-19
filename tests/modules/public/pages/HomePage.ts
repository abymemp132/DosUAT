import { Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open(baseURL: string): Promise<void> {
    await this.page.goto(baseURL);
  }
}
