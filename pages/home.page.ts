import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class HomePage extends BasePage {
  private readonly locationModal: Locator;
  private readonly header: Locator;
  private readonly testSearchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.locationModal = this.page.locator("div.fixed.inset-0.z-50").first();
    this.header = this.page.locator("header");
    this.testSearchInput = this.page.locator('input[placeholder="Search by Tests and Packages"]');
  }

  async open(baseURL?: string): Promise<void> {
    if (baseURL) {
      await this.goto(baseURL);
      return;
    }

    await this.goto("/");
  }

  async selectCity(city = "Delhi"): Promise<void> {
    if ((await this.locationModal.count()) === 0) {
      return;
    }

    const cityOption = this.locationModal.getByText(city, { exact: true }).first();
    await cityOption.click();
    await expect(this.locationModal).toBeHidden();
  }

  async assertTopNavigation(): Promise<void> {
    await expect(this.header.getByRole("link", { name: "Test Catalog" })).toBeVisible();
    await expect(this.header.getByRole("link", { name: "Doctor Speciality" })).toBeVisible();
    await expect(this.header.getByRole("link", { name: "Disease Condition" })).toBeVisible();
    await expect(
      this.header.getByRole("link", { name: "Test Requisition & Consent Forms" })
    ).toBeVisible();
    await expect(this.header.getByRole("link", { name: "Brochures" })).toBeVisible();
    await expect(this.header.getByRole("link", { name: "FAQ's" })).toBeVisible();
  }

  async assertCoreHomeWidgets(): Promise<void> {
    await expect(this.testSearchInput).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Reset" })).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Download" })).toBeVisible();
    await expect(this.page.getByText(/\d+\s*Items/i).first()).toBeVisible();
  }
}
