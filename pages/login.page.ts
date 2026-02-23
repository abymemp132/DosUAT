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
    if (!(await this.locationModal.isVisible())) {
      return;
    }

    const loadingCities = this.locationModal.getByText("Loading cities...", { exact: false });
    if (await loadingCities.isVisible().catch(() => false)) {
      await expect(loadingCities).toBeHidden({ timeout: 30_000 }).catch(() => {});
    }

    const preferredCityOption = this.locationModal
      .getByText(new RegExp(`^\\s*${this.escapeRegExp(city)}\\s*$`, "i"))
      .first();
    const clickPreferredCity = async (): Promise<boolean> => {
      if (!(await preferredCityOption.isVisible({ timeout: 10_000 }).catch(() => false))) {
        return false;
      }

      await preferredCityOption.click();
      return true;
    };

    if (await clickPreferredCity()) {
      await expect(this.locationModal).toBeHidden({ timeout: 10_000 });
      return;
    }

    const searchInput = this.locationModal.getByPlaceholder("Search your City");
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(city);
      if (await clickPreferredCity()) {
        await expect(this.locationModal).toBeHidden({ timeout: 10_000 });
        return;
      }
      await searchInput.fill("");
    }

    const fallbackCityClicked = await this.clickFirstAvailableCity();
    expect(
      fallbackCityClicked,
      `City option "${city}" was not available and no fallback city option was found.`
    ).toBe(true);
    await expect(this.locationModal).toBeHidden({ timeout: 10_000 });
  }

  async loginWithEmailOtp(email: string, otp: string, city = "Delhi"): Promise<void> {
    await this.openHome();
    await this.closeLocationModal(city);
    await this.openLoginModal();
    await this.requestOtp(email);
    await this.verifyOtp(otp);
  }

  async openLoginModal(): Promise<void> {
    await this.profileButton.click();
    await expect(this.emailInput).toBeVisible();
  }

  async requestOtp(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.sendOtpButton.click();
    await expect(this.otpTitle).toBeVisible({ timeout: 60_000 });
  }

  async verifyOtp(otp: string): Promise<void> {
    const digits = otp.trim().split("");
    await expect(this.otpInputs).toHaveCount(6);

    for (let i = 0; i < 6; i += 1) {
      await this.otpInputs.nth(i).fill(digits[i] ?? "");
    }

    await this.verifyButton.click();
    await expect(
      this.otpTitle,
      "OTP verification did not complete. The OTP may be invalid or expired."
    ).toBeHidden({ timeout: 45_000 });
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

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private async clickFirstAvailableCity(): Promise<boolean> {
    return this.locationModal.evaluate((modal) => {
      const excludedLabels = [
        "Select your Location",
        "Search your City",
        "Use Current Location",
        "Please select your location first",
        "Metro Cities",
        "Other Cities",
        "Loading cities..."
      ];

      const normalizeText = (value: string): string => value.replace(/\s+/g, " ").trim();
      const fallbackCity = Array.from(modal.querySelectorAll<HTMLElement>("*")).find((element) => {
        const label = normalizeText(element.innerText || element.textContent || "");
        if (!label || label.length > 60) {
          return false;
        }

        if (excludedLabels.some((excluded) => label.toLowerCase() === excluded.toLowerCase())) {
          return false;
        }

        if (!/^[A-Za-z][A-Za-z .,'()&-]+$/.test(label)) {
          return false;
        }

        const style = window.getComputedStyle(element);
        return style.cursor === "pointer";
      });

      if (!fallbackCity) {
        return false;
      }

      fallbackCity.click();
      return true;
    });
  }
}
