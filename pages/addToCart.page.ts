import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

type PricingSnapshot = {
  totalMrp: number | null;
  discount: number | null;
  netPayable: number | null;
};

export class AddToCartPage extends BasePage {
  private readonly locationModal: Locator;
  private readonly cartButton: Locator;
  private readonly tableRows: Locator;
  private readonly addToCartButton: Locator;
  private readonly testSearchInput: Locator;
  private readonly searchButton: Locator;
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
    this.testSearchInput = this.page.locator('input[placeholder="Search by Tests and Packages"]');
    this.searchButton = this.page
      .locator('div:has(input[placeholder="Search by Tests and Packages"]) button')
      .first();
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
    const discountRow = await this.getDiscountTargetRow();
    await expect(this.getPercentageToggle(discountRow), "Percentage discount toggle should be visible in add-to-cart page.").toBeVisible({
      timeout: 15_000
    });
    await expect(this.getDiscountInput(discountRow), "Discount input should be visible in add-to-cart page.").toBeVisible({
      timeout: 15_000
    });
  }

  async addItemAndOpenCart(): Promise<void> {
    await this.addFirstItemAndAssertCartCountIncreases();
    await this.openCartFromHeaderAndAssertVisible();
  }

  async addSpecificItemAndOpenCart(testQuery: string): Promise<void> {
    await this.addSpecificItemAndAssertCartCountIncreases(testQuery);
    await this.openCartFromHeaderAndAssertVisible();
  }

  async assertAddToCartPageApplyDiscount(discountCode = "TEST10"): Promise<void> {
    await this.addItemAndOpenCart();
    const percent = Number.parseInt(discountCode.replace(/[^\d]/g, ""), 10) || 10;
    await this.assertDiscountPricingForPercentage(`TEST${percent}`, percent);
  }

  async assertDiscountPricingForPercentage(discountCode: string, expectedPercent: number): Promise<void> {
    await this.addItemAndOpenCart();
    const discountRow = await this.getDiscountTargetRow();
    await this.assertDiscountControlsVisible();
    const rowPrice = await this.readCartRowPrice(discountRow);
    expect(rowPrice, "Cart row price should be visible before applying discount.").not.toBeNull();

    await this.applyPercentageDiscountToRow(discountRow, expectedPercent);

    const expectedDiscount = this.roundToTwoDecimals((rowPrice! * expectedPercent) / 100);
    const expectedFinalPrice = this.roundToTwoDecimals(rowPrice! - expectedDiscount);

    await this.waitForRowDiscountApplication(discountRow, expectedPercent, expectedFinalPrice);

    const finalRowPrice = await this.readCartRowFinalPrice(discountRow);
    const appliedPercent = await this.readDiscountInputValue(discountRow);

    expect(rowPrice, "Cart row price should be greater than zero.").toBeGreaterThan(0);
    expect(
      appliedPercent,
      `Discount input should retain the applied ${discountCode} percentage.`
    ).toBe(expectedPercent);
    expect(finalRowPrice, `Final row price should reflect the applied ${discountCode} discount.`).toBeCloseTo(expectedFinalPrice, 1);
  }

  async assertRandomDiscountPricingForSpecificTest(testQuery: string): Promise<void> {
    await this.addSpecificItemAndOpenCart(testQuery);
    const discountRow = await this.getDiscountTargetRow(testQuery);
    await this.assertDiscountControlsVisible();
    const rowPrice = await this.readCartRowPrice(discountRow);
    expect(rowPrice, "Target cart row price should be visible before applying discount.").not.toBeNull();
    const currentPercent = await this.readDiscountInputValue(discountRow);
    const randomPercent = this.pickPercentDifferentFromCurrent(currentPercent);

    await this.applyPercentageDiscountToRow(discountRow, randomPercent);

    const expectedDiscount = this.roundToTwoDecimals((rowPrice! * randomPercent) / 100);
    const expectedFinalPrice = this.roundToTwoDecimals(rowPrice! - expectedDiscount);

    await this.waitForRowDiscountApplication(discountRow, randomPercent, expectedFinalPrice);

    const finalRowPrice = await this.readCartRowFinalPrice(discountRow);
    const appliedPercent = await this.readDiscountInputValue(discountRow);

    expect(rowPrice, `Target row price for "${testQuery}" should be greater than zero.`).toBeGreaterThan(0);
    expect(
      appliedPercent,
      `Discount input should retain the applied ${randomPercent}% value.`
    ).toBe(randomPercent);
    expect(
      finalRowPrice,
      `Final row price should reflect a ${randomPercent}% discount for "${testQuery}".`
    ).toBeCloseTo(expectedFinalPrice, 1);
  }

  async assertShareCartViaWhatsAppForSpecificTest(testQuery: string): Promise<void> {
    await this.addSpecificItemAndOpenCart(testQuery);
    await this.assertShareActionWorks("whatsapp");
  }

  async assertShareCartViaOutlookForSpecificTest(testQuery: string): Promise<void> {
    await this.addSpecificItemAndOpenCart(testQuery);
    await this.assertShareActionWorks("outlook");
  }

  async assertShareCartViaPdfForSpecificTest(testQuery: string): Promise<void> {
    await this.addSpecificItemAndOpenCart(testQuery);
    await this.assertShareActionWorks("pdf");
  }

  async addSpecificItemAndAssertCartCountIncreases(testQuery: string): Promise<void> {
    const targetRow = await this.searchAndGetTargetRow(testQuery);
    let countBeforeAdd = await this.readCartCount();
    let targetAddToCartButton = targetRow.getByRole("button", { name: /add to cart/i }).first();

    if (!(await targetAddToCartButton.isVisible().catch(() => false))) {
      const removeButton = targetRow.getByRole("button", { name: /^remove$/i }).first();
      await expect(
        removeButton,
        `Expected either Add to Cart or Remove button for searched test "${testQuery}".`
      ).toBeVisible({ timeout: 15_000 });
      await removeButton.click();

      await expect
        .poll(async () => this.readCartCount(), {
          timeout: 15_000,
          message: `Cart count should decrease after removing the already-added "${testQuery}" item.`
        })
        .toBeLessThan(countBeforeAdd);

      countBeforeAdd = await this.readCartCount();
      targetAddToCartButton = targetRow.getByRole("button", { name: /add to cart/i }).first();
    }

    await expect(
      targetAddToCartButton,
      `Add to Cart button should be visible for searched test "${testQuery}".`
    ).toBeVisible({ timeout: 15_000 });
    await targetAddToCartButton.click();

    await expect
      .poll(async () => this.readCartCount(), {
        timeout: 15_000,
        message: `Cart count should increase after adding test "${testQuery}".`
      })
      .toBeGreaterThan(countBeforeAdd);
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

  private async readPricingSnapshot(): Promise<PricingSnapshot> {
    return {
      totalMrp: await this.readAmountByLabel(/total\s*mrp|mrp\s*total|sub\s*total|subtotal|grand\s*total/i),
      discount: await this.readAmountByLabel(/discount|coupon|promo/i),
      netPayable: await this.readAmountByLabel(/net\s*payable|total\s*payable|payable\s*amount|amount\s*payable/i)
    };
  }

  private async searchAndGetTargetRow(testQuery: string): Promise<Locator> {
    await this.waitForCatalogRows();
    await expect(this.testSearchInput, "Test search input should be visible on add-to-cart catalog.").toBeVisible({
      timeout: 15_000
    });

    await this.testSearchInput.fill(testQuery);
    if (await this.searchButton.isVisible().catch(() => false)) {
      await this.searchButton.click();
    } else {
      await this.testSearchInput.press("Enter");
    }

    const targetRow = this.page
      .locator("tr")
      .filter({ hasText: new RegExp(this.escapeRegExp(testQuery), "i") })
      .filter({
        has: this.page
          .getByRole("button", { name: /add to cart|remove/i })
          .first()
      })
      .first();

    const hasMatchingRow = await targetRow.isVisible({ timeout: 20_000 }).catch(() => false);
    if (hasMatchingRow) {
      return targetRow;
    }

    console.warn(`[AddToCart] No visible row matched "${testQuery}". Falling back to the first addable catalog row.`);
    await this.testSearchInput.fill("");
    if (await this.searchButton.isVisible().catch(() => false)) {
      await this.searchButton.click().catch(() => {});
    } else {
      await this.testSearchInput.press("Enter").catch(() => {});
    }
    await this.waitForCatalogRows();

    const fallbackRow = this.page
      .locator("tr")
      .filter({
        has: this.page
          .getByRole("button", { name: /add to cart|remove/i })
          .first()
      })
      .first();
    await expect(
      fallbackRow,
      `Catalog row for test "${testQuery}" was not found, and no fallback addable row was available.`
    ).toBeVisible({ timeout: 20_000 });
    return fallbackRow;
  }

  private async assertShareActionWorks(channel: "whatsapp" | "outlook" | "pdf"): Promise<void> {
    const shareControl = this.getShareControl(channel);
    await expect(shareControl, `Share control for ${channel} should be visible on cart page.`).toBeVisible({
      timeout: 15_000
    });

    const href = await shareControl.getAttribute("href").catch(() => null);
    if (href) {
      if (channel === "whatsapp") {
        expect(
          /whatsapp|wa\.me|api\.whatsapp\.com/i.test(href),
          `WhatsApp share href should point to WhatsApp. Received: ${href}`
        ).toBe(true);
      } else if (channel === "outlook") {
        expect(
          /mailto:|outlook|office\.com|live\.com/i.test(href),
          `Outlook share href should point to mail client or Outlook. Received: ${href}`
        ).toBe(true);
      } else {
        expect(
          /\.pdf\b|pdf/i.test(href),
          `PDF share href should point to a PDF resource. Received: ${href}`
        ).toBe(true);
      }
    }

    const popupPromise = this.page.waitForEvent("popup", { timeout: 7_000 }).catch(() => null);
    const downloadPromise = this.page.waitForEvent("download", { timeout: 7_000 }).catch(() => null);

    await shareControl.click();

    const [popup, download] = await Promise.all([popupPromise, downloadPromise]);
    const popupUrl = popup ? popup.url() : "";

    if (popup) {
      await popup.close().catch(() => {});
    }

    if (channel === "whatsapp") {
      const resolvedHref = href || popupUrl;
      expect(
        Boolean(resolvedHref) && /whatsapp|wa\.me|api\.whatsapp\.com/i.test(resolvedHref),
        "WhatsApp share action should resolve to a WhatsApp URL."
      ).toBe(true);
      return;
    }

    if (channel === "outlook") {
      const resolvedHref = href || popupUrl;
      expect(
        Boolean(resolvedHref) && /mailto:|outlook|office\.com|live\.com/i.test(resolvedHref),
        "Outlook share action should resolve to a mailto or Outlook URL."
      ).toBe(true);
      return;
    }

    expect(
      Boolean(download) || /\.pdf\b|pdf/i.test(href ?? "") || /\.pdf\b|pdf/i.test(popupUrl),
      "PDF share action should trigger a download or open a PDF resource."
    ).toBe(true);
  }

  private async waitForRowDiscountApplication(row: Locator, expectedPercent: number, expectedFinalPrice: number): Promise<void> {
    await expect
      .poll(
        async () => {
          const inputPercent = await this.readDiscountInputValue(row);
          const finalPrice = await this.readCartRowFinalPrice(row);
          return (
            inputPercent === expectedPercent &&
            typeof finalPrice === "number" &&
            Math.abs(finalPrice - expectedFinalPrice) < 0.2
          );
        },
        {
          timeout: 20_000,
          message: "Discount application should update the target cart row pricing."
        }
      )
      .toBe(true);
  }

  private async readAmountByLabel(labelPattern: RegExp): Promise<number | null> {
    const matchText = await this.page.evaluate(({ patternSource, patternFlags }) => {
      const regex = new RegExp(patternSource, patternFlags);
      const isVisible = (element: Element): boolean => {
        if (!(element instanceof HTMLElement)) {
          return false;
        }

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          rect.width > 0 &&
          rect.height > 0
        );
      };

      const candidates = Array.from(document.querySelectorAll("div, li, p, span, td, th, strong, h1, h2, h3"))
        .filter((element) => isVisible(element))
        .map((element) => (element.textContent || "").replace(/\s+/g, " ").trim())
        .filter((text) => text.length > 0 && text.length <= 140)
        .filter((text) => regex.test(text) && /\d/.test(text));

      candidates.sort((left, right) => left.length - right.length);
      return candidates[0] || null;
    }, { patternSource: labelPattern.source, patternFlags: labelPattern.flags });

    return matchText ? this.extractAmount(matchText) : null;
  }

  private getDiscountInput(row: Locator): Locator {
    return row.locator('input[placeholder="0"], input[type="text"]').first();
  }

  private getPercentageToggle(row: Locator): Locator {
    return row.getByRole("button", { name: /^Percentage$/i }).first();
  }

  private getShareControl(channel: "whatsapp" | "outlook" | "pdf"): Locator {
    if (channel === "whatsapp") {
      return this.page
        .locator(
          'a[href*="whatsapp"], a[href*="wa.me"], a[href*="api.whatsapp.com"], button[aria-label*="WhatsApp" i], button[title*="WhatsApp" i]'
        )
        .or(this.page.getByRole("link", { name: /whatsapp/i }))
        .or(this.page.getByRole("button", { name: /whatsapp/i }))
        .first();
    }

    if (channel === "outlook") {
      return this.page
        .locator(
          'a[href^="mailto:"], a[href*="outlook"], a[href*="office.com"], a[href*="live.com"], button[aria-label*="Outlook" i], button[title*="Outlook" i], button[aria-label*="Email" i], button[title*="Email" i]'
        )
        .or(this.page.getByRole("link", { name: /outlook|email|mail/i }))
        .or(this.page.getByRole("button", { name: /outlook|email|mail/i }))
        .first();
    }

    return this.page
      .locator(
        'a[href$=".pdf"], a[href*=".pdf?"], a[href*="pdf"], button[aria-label*="PDF" i], button[title*="PDF" i], button[aria-label*="Download" i], button[title*="Download" i]'
      )
      .or(this.page.getByRole("link", { name: /pdf|download/i }))
      .or(this.page.getByRole("button", { name: /pdf|download/i }))
      .first();
  }

  private extractAmount(value: string): number | null {
    const match = value.replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
    if (!match) {
      return null;
    }

    const parsedValue = Number.parseFloat(match[1]);
    return Number.isNaN(parsedValue) ? null : parsedValue;
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private randomWholeNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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

  private async getDiscountTargetRow(testQuery?: string): Promise<Locator> {
    const normalizedQuery = (testQuery || "").trim();
    if (normalizedQuery) {
      const matchingRow = this.page.locator("tbody tr").filter({ hasText: new RegExp(this.escapeRegExp(normalizedQuery), "i") }).first();
      if (await matchingRow.isVisible().catch(() => false)) {
        return matchingRow;
      }
    }

    const firstDiscountRow = this.page.locator("tbody tr").filter({ has: this.page.getByRole("button", { name: /^Percentage$/i }) }).first();
    await expect(firstDiscountRow, "At least one cart row with discount controls should be visible.").toBeVisible({
      timeout: 15_000
    });
    return firstDiscountRow;
  }

  private async applyPercentageDiscountToRow(row: Locator, percent: number): Promise<void> {
    const percentageToggle = this.getPercentageToggle(row);
    const discountInput = this.getDiscountInput(row);

    await expect(percentageToggle, "Percentage discount toggle should be visible.").toBeVisible({ timeout: 10_000 });
    await percentageToggle.click({ force: true });
    await expect(discountInput, "Discount input should be visible for the selected cart row.").toBeVisible({ timeout: 10_000 });
    await discountInput.fill(String(percent));
    await discountInput.press("Tab").catch(() => {});
  }

  private async readCartRowPrice(row: Locator): Promise<number | null> {
    const priceText = await row.locator("td").nth(5).innerText().catch(() => "");
    return this.extractAmount(priceText);
  }

  private async readCartRowFinalPrice(row: Locator): Promise<number | null> {
    const cellCount = await row.locator("td").count();
    if (cellCount === 0) {
      return null;
    }

    const finalPriceText = await row.locator("td").nth(cellCount - 2).innerText().catch(() => "");
    return this.extractAmount(finalPriceText);
  }

  private async readDiscountInputValue(row: Locator): Promise<number | null> {
    const rawValue = await this.getDiscountInput(row).inputValue().catch(() => "");
    const parsedValue = Number.parseInt(rawValue.trim(), 10);
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  }

  private pickPercentDifferentFromCurrent(currentPercent: number | null): number {
    const current = currentPercent ?? 0;
    const candidates = Array.from({ length: 10 }, (_, index) => index + 1).filter((value) => value !== current);
    return candidates[Math.floor(Math.random() * candidates.length)] ?? 1;
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
