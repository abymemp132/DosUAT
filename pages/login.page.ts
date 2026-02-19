import { expect, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  private readonly locationModal: Locator;
  private readonly profileButton: Locator;
  private readonly emailInput: Locator;
  private readonly sendOtpButton: Locator;
  private readonly otpTitle: Locator;
  private readonly otpInputs: Locator;
  private readonly verifyButton: Locator;

  constructor(page: ConstructorParameters<typeof BasePage>[0]) {
    super(page);
    this.locationModal = this.page.locator("div.fixed.inset-0.z-50").first();
    this.profileButton = this.page.locator("header button").first();
    this.emailInput = this.page.locator('input[placeholder="Enter Email"]');
    this.sendOtpButton = this.page.getByRole("button", { name: /send otp/i });
    this.otpTitle = this.page.getByText("OTP Verification");
    this.otpInputs = this.page.locator('input[maxlength="1"]');
    this.verifyButton = this.page.getByRole("button", { name: /^verify$/i });
  }

  async openHome(): Promise<void> {
    await this.goto("/");
  }

  async closeLocationModal(city = "Delhi"): Promise<void> {
    if ((await this.locationModal.count()) === 0) {
      return;
    }

    const cityOption = this.locationModal.getByText(city, { exact: true }).first();
    await cityOption.click();
    await expect(this.locationModal).toBeHidden();
  }

  async openLoginModal(): Promise<void> {
    await this.profileButton.click();
    await expect(this.emailInput).toBeVisible();
  }

  async requestOtp(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.sendOtpButton.click();
    await expect(this.otpTitle).toBeVisible({ timeout: 35_000 });
  }

  async verifyOtp(otp: string): Promise<void> {
    const digits = otp.trim().split("");
    await expect(this.otpInputs).toHaveCount(6);

    for (let i = 0; i < 6; i += 1) {
      await this.otpInputs.nth(i).fill(digits[i] ?? "");
    }

    await this.verifyButton.click();
  }

  async openProfileMenu(): Promise<void> {
    await this.profileButton.click();
  }

  async assertUserIsLoggedIn(email: string): Promise<void> {
    await expect(this.page.getByRole("button", { name: /logout/i })).toBeVisible({
      timeout: 15_000
    });
    await expect(this.page.getByText(email, { exact: false })).toBeVisible();
  }
}
