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

  async addSpecificItemAndOpenCart(testQuery: string): Promise<void> {
    await this.addSpecificItemAndAssertCartCountIncreases(testQuery);
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

  async assertDiscountPricingForPercentage(discountCode: string, expectedPercent: number): Promise<void> {
    await this.addItemAndOpenCart();
    await this.assertDiscountControlsVisible();

    const beforePricing = await this.readPricingSnapshot();
    expect(beforePricing.totalMrp, "Total MRP should be visible before applying discount.").not.toBeNull();
    expect(beforePricing.netPayable, "Net payable should be visible before applying discount.").not.toBeNull();

    const discountInput = this.getDiscountInput();
    await discountInput.fill(discountCode);
    await this.getApplyDiscountButton().click();

    await this.waitForDiscountApplication(beforePricing.netPayable);

    const afterPricing = await this.readPricingSnapshot();
    expect(afterPricing.totalMrp, "Total MRP should be visible after applying discount.").not.toBeNull();
    expect(afterPricing.discount, "Discount amount should be visible after applying discount.").not.toBeNull();
    expect(afterPricing.netPayable, "Net payable should be visible after applying discount.").not.toBeNull();

    const totalMrp = afterPricing.totalMrp!;
    const discountAmount = afterPricing.discount!;
    const netPayable = afterPricing.netPayable!;
    const expectedDiscount = this.roundToTwoDecimals((totalMrp * expectedPercent) / 100);
    const expectedNetPayable = this.roundToTwoDecimals(totalMrp - discountAmount);

    expect(totalMrp, "Total MRP should be greater than zero.").toBeGreaterThan(0);
    expect(
      discountAmount,
      `Discount amount for ${discountCode} should be close to ${expectedPercent}% of total MRP.`
    ).toBeCloseTo(expectedDiscount, 0);
    expect(netPayable, "Net payable should equal total MRP minus discount amount.").toBeCloseTo(
      expectedNetPayable,
      0
    );
    expect(
      netPayable,
      `Net payable should be lower than total MRP after applying ${discountCode}.`
    ).toBeLessThan(totalMrp);
  }

  async assertRandomDiscountPricingForSpecificTest(testQuery: string): Promise<void> {
    const randomPercent = this.randomWholeNumber(1, 10);
    const discountCode = `TEST${randomPercent}`;

    await this.addSpecificItemAndOpenCart(testQuery);
    await this.assertDiscountControlsVisible();

    const beforePricing = await this.readPricingSnapshot();
    expect(beforePricing.totalMrp, "Total MRP should be visible before applying discount.").not.toBeNull();
    expect(beforePricing.netPayable, "Net payable should be visible before applying discount.").not.toBeNull();

    const discountInput = this.getDiscountInput();
    await discountInput.fill(discountCode);
    await this.getApplyDiscountButton().click();

    await this.waitForDiscountApplication(beforePricing.netPayable);

    const afterPricing = await this.readPricingSnapshot();
    expect(afterPricing.totalMrp, "Total MRP should be visible after applying discount.").not.toBeNull();
    expect(afterPricing.discount, "Discount amount should be visible after applying discount.").not.toBeNull();
    expect(afterPricing.netPayable, "Net payable should be visible after applying discount.").not.toBeNull();

    const totalMrp = afterPricing.totalMrp!;
    const discountAmount = afterPricing.discount!;
    const netPayable = afterPricing.netPayable!;
    const expectedDiscount = this.roundToTwoDecimals((totalMrp * randomPercent) / 100);
    const expectedNetPayable = this.roundToTwoDecimals(totalMrp - discountAmount);

    expect(totalMrp, `Total MRP for "${testQuery}" should be greater than zero.`).toBeGreaterThan(0);
    expect(
      discountAmount,
      `Discount amount for "${discountCode}" should be close to ${randomPercent}% of total MRP.`
    ).toBeCloseTo(expectedDiscount, 0);
    expect(netPayable, "Net payable should equal total MRP minus discount amount.").toBeCloseTo(
      expectedNetPayable,
      0
    );
    expect(
      netPayable,
      `Net payable should be lower than total MRP after applying ${discountCode} on "${testQuery}".`
    ).toBeLessThan(totalMrp);
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
    const targetAddToCartButton = targetRow.getByRole("button", { name: /add to cart/i }).first();

    const beforeCount = await this.readCartCount();
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
      .toBeGreaterThan(beforeCount);
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
      .filter({ has: this.page.getByRole("button", { name: /add to cart/i }) })
      .first();

    await expect(targetRow, `Catalog row for test "${testQuery}" should be visible after search.`).toBeVisible({
      timeout: 20_000
    });
    return targetRow;
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

  private async waitForDiscountApplication(previousNetPayable: number | null): Promise<void> {
    const successToast = this.toastMessage
      .filter({ hasText: /applied|success|discount|coupon|promo/i })
      .first();

    await expect
      .poll(
        async () => {
          const pricing = await this.readPricingSnapshot();
          const hasToast = await successToast.isVisible({ timeout: 1_000 }).catch(() => false);
          const hasDiscount = typeof pricing.discount === "number" && pricing.discount > 0;
          const hasNetReduction =
            typeof previousNetPayable === "number" &&
            typeof pricing.netPayable === "number" &&
            pricing.netPayable < previousNetPayable;

          return hasToast || hasDiscount || hasNetReduction;
        },
        {
          timeout: 20_000,
          message: "Discount application should update pricing summary or show success feedback."
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
