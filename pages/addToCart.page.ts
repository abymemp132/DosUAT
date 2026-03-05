import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class AddToCartPage extends BasePage {
  private readonly locationModal: Locator;
  private readonly cartButton: Locator;
  private readonly tableRows: Locator;
  private readonly addToCartButton: Locator;
  private readonly toastMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.locationModal = this.page
      .locator("div.fixed.inset-0.z-50")
      .filter({ hasText: "Select your Location" })
      .first();
    this.cartButton = this.page.locator("header button").filter({ hasText: /^\d+$/ }).first();
    this.tableRows = this.page.locator("tbody tr");
    this.addToCartButton = this.page.getByRole("button", { name: /add to cart/i }).first();
    this.toastMessage = this.page.locator(".Toastify__toast, [role=\"alert\"], [data-sonner-toast]");
  }

  async open(): Promise<void> {
    await this.goto("/");
  }

  async openAndSelectCity(city = "Delhi"): Promise<void> {
    await this.open();
    await this.selectCity(city);
    await this.waitForCatalogRows();
  }

  async selectCity(city = "Delhi"): Promise<void> {
    if (!(await this.locationModal.isVisible().catch(() => false))) {
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

  async assertAddToCartButtonVisible(): Promise<void> {
    await this.waitForCatalogRows();
    await expect(this.addToCartButton, "At least one Add to Cart button should be visible.").toBeVisible({
      timeout: 15_000
    });
  }

  async addFirstItemAndAssertCartCountIncreases(): Promise<void> {
    await this.assertAddToCartButtonVisible();

    const beforeCount = await this.readCartCount();
    await this.addToCartButton.click();

    await expect
      .poll(async () => this.readCartCount(), {
        timeout: 15_000,
        message: "Cart count should increase after adding an item."
      })
      .toBeGreaterThan(beforeCount);
  }

  async openCartFromHeaderAndAssertVisible(): Promise<void> {
    await expect(this.cartButton, "Header cart button should be visible.").toBeVisible({
      timeout: 15_000
    });
    await this.cartButton.click();

    const cartHeading = this.page.getByText(/my cart|cart summary|order summary|cart/i).first();
    await expect(cartHeading, "Add-to-cart page should open after clicking cart icon.").toBeVisible({
      timeout: 15_000
    });
  }

  async assertDiscountControlsVisible(): Promise<void> {
    await expect(this.getDiscountInput(), "Discount input should be visible in add-to-cart page.").toBeVisible(
      { timeout: 15_000 }
    );
    await expect(this.getApplyDiscountButton(), "Apply discount button should be visible.").toBeVisible({
      timeout: 15_000
    });
  }

  async addItemAndOpenCart(): Promise<void> {
    await this.addFirstItemAndAssertCartCountIncreases();
    await this.openCartFromHeaderAndAssertVisible();
  }

  async assertAddToCartPageApplyDiscount(discountCode = "TEST10"): Promise<void> {
    await this.addItemAndOpenCart();
    await this.assertDiscountControlsVisible();

    const amountBefore = await this.readBestEffortPayableAmount();
    const discountInput = this.getDiscountInput();
    await discountInput.fill(discountCode);
    await this.getApplyDiscountButton().click();

    const successToast = this.toastMessage
      .filter({ hasText: /applied|success|discount|coupon|promo/i })
      .first();
    const discountLine = this.page.getByText(/discount.*(\d|rs|inr|-)/i).first();
    const amountAfter = await this.readBestEffortPayableAmount();

    const hasSuccessToast = await successToast.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasDiscountLine = await discountLine.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasReducedAmount =
      typeof amountBefore === "number" && typeof amountAfter === "number" && amountAfter < amountBefore;

    expect(
      hasSuccessToast || hasDiscountLine || hasReducedAmount,
      "Applying discount should show success feedback or reduce payable amount."
    ).toBe(true);
  }

  private async waitForCatalogRows(timeoutMs = 50_000): Promise<void> {
    const loadingTests = this.page.getByText("Loading tests...", { exact: false }).first();
    const noDataFound = this.page.getByText("No Data Found", { exact: false }).first();

    if (await loadingTests.isVisible().catch(() => false)) {
      await expect(loadingTests).toBeHidden({ timeout: timeoutMs }).catch(() => {});
    }

    if (await noDataFound.isVisible().catch(() => false)) {
      throw new Error("Catalog returned 'No Data Found'. This is likely an environment/data issue.");
    }

    await expect(this.tableRows.first(), "Catalog rows should be visible before add to cart action.").toBeVisible({
      timeout: timeoutMs
    });
  }

  private async readBestEffortPayableAmount(): Promise<number | null> {
    const candidates = [
      this.page.getByText(/grand total|total payable|payable amount|subtotal/i).first(),
      this.page.locator("[class*='total'], [class*='amount']").first()
    ];

    for (const locator of candidates) {
      if (!(await locator.isVisible().catch(() => false))) {
        continue;
      }

      const text = (await locator.innerText()).trim();
      const amount = this.extractAmount(text);
      if (typeof amount === "number") {
        return amount;
      }
    }

    return null;
  }

  private getDiscountInput(): Locator {
    return this.page
      .locator(
        'input[placeholder*="Coupon" i], input[placeholder*="Promo" i], input[placeholder*="Discount" i]'
      )
      .first();
  }

  private getApplyDiscountButton(): Locator {
    return this.page.getByRole("button", { name: /apply/i }).first();
  }

  private extractAmount(value: string): number | null {
    const match = value.replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
    if (!match) {
      return null;
    }

    const parsedValue = Number.parseFloat(match[1]);
    return Number.isNaN(parsedValue) ? null : parsedValue;
  }

  private async readCartCount(): Promise<number> {
    const cartText = (await this.cartButton.innerText()).trim();
    const parsedCount = Number.parseInt(cartText.replace(/[^\d]/g, ""), 10);
    expect(Number.isNaN(parsedCount), `Could not parse cart count from "${cartText}".`).toBe(false);
    return parsedCount;
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
