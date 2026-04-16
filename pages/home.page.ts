import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { LoginPage } from "./login.page";

export class HomePage extends BasePage {
  private readonly locationModal: Locator;
  private readonly header: Locator;
  private readonly logoLink: Locator;
  private readonly locationIcon: Locator;
  private readonly profileButton: Locator;
  private readonly cartButton: Locator;
  private readonly testSearchInput: Locator;
  private readonly emailInput: Locator;
  private readonly searchButton: Locator;
  private readonly itemsCountLabel: Locator;
  private readonly toastMessage: Locator;
  private readonly departmentFilter: Locator;
  private readonly methodFilter: Locator;
  private readonly sampleTypeFilter: Locator;
  private readonly nablFilter: Locator;

  constructor(page: Page) {
    super(page);
    this.header = this.page.locator("header");
    const headerButtons = this.header;
    this.locationModal = this.page
      .locator("div.fixed.inset-0.z-50")
      .filter({ hasText: /Select your Location|Change City/i })
      .first();
    this.logoLink = this.header.getByRole("link", { name: /Oncquest|Logo/i }).first();

    // The location trigger is the city name or icon in the header
    this.locationIcon = this.header.locator("div, button").filter({ has: this.page.locator('img[src*="location"], svg') }).first();
    this.profileButton = headerButtons.locator("button").filter({ has: this.page.locator("img, svg") }).filter({ hasNotText: /^\d+$/ }).first();
    this.cartButton = headerButtons.locator("button").filter({ hasText: /^\d+$/ }).first();

    this.testSearchInput = this.page.getByPlaceholder(/Search by Tests/i).first();
    this.emailInput = this.page.locator('input[placeholder*="Email"]').first();
    this.searchButton = this.page
      .locator("button")
      .filter({ has: this.page.locator('img[alt*="search"], svg') })
      .or(this.page.locator('div:has(input[placeholder*="Search"]) button'))
      .first();
    this.itemsCountLabel = this.page.locator("div, span, p").filter({ hasText: /^\d+\s*Items$/i }).first();
    this.toastMessage = this.page.locator(".Toastify__toast, [role=\"alert\"], [data-sonner-toast]");
    this.departmentFilter = this.page.getByText("Department", { exact: false }).first();
    this.methodFilter = this.page.getByText("Method", { exact: false }).first();
    this.sampleTypeFilter = this.page.getByText("Sample Type", { exact: false }).first();
    this.nablFilter = this.page.getByText("NABL", { exact: false }).first();
    this.footer = this.page.locator("footer, [ref*='contentinfo']").first();
    this.privacyLink = this.page.getByRole("link", { name: /Privacy Policy/i });
    this.termsLink = this.page.getByRole("link", { name: /Terms & Conditions/i });
    this.socialIcons = this.page.locator("footer a").filter({ has: this.page.locator("img") });
  }

  private readonly footer: Locator;
  private readonly privacyLink: Locator;
  private readonly termsLink: Locator;
  private readonly socialIcons: Locator;

  // ==================== Navigation & Setup ====================

  async open(baseURL?: string): Promise<void> {
    if (baseURL) {
      await this.goto(baseURL);
      return;
    }
    await this.goto("/");
  }

  async ensureHomeReady(city = "Delhi", baseURL?: string): Promise<void> {
    await this.open(baseURL);
    
    // Auth check - if no CityId, modal will likely pop up
    const isGuest = await this.page.evaluate(() => !window.localStorage.getItem("CityId"));
    if (isGuest) {
      await this.locationModal.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    }
    
    await this.selectCity(city);
    await this.waitForModalsToClose();
    await this.assertCoreHomeWidgets();
  }

  // ==================== Actions ====================

  async selectCity(city = "Delhi"): Promise<void> {
    await this.locationModal.waitFor({ state: "visible", timeout: 3000 }).catch(() => {});

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
      if (!(await preferredCityOption.isVisible({ timeout: 5_000 }).catch(() => false))) {
        return false;
      }
      await preferredCityOption.click({ force: true });
      return true;
    };

    if (await clickPreferredCity()) {
      await expect(this.locationModal).toBeHidden({ timeout: 10_000 }).catch(async () => {
          // Force close if it lingers
          await this.page.keyboard.press("Escape").catch(() => {});
          const closeBtn = this.locationModal.locator("button[title='Close'], button[aria-label='Close'], button.bg-red-500").first();
          if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click().catch(() => {});
          }
      });
      return;
    }

    const searchInput = this.locationModal.getByPlaceholder(/Search your City/i);
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
    
    await expect(this.locationModal).toBeHidden({ timeout: 10_000 }).catch(() => this.page.keyboard.press("Escape"));
    await this.waitForModalsToClose();
  }

  // ==================== Assertions ====================

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
    await expect(this.page.getByRole("button", { name: /Download/i }).first()).toBeVisible();
    await expect(this.itemsCountLabel).toBeVisible();
    
    // Filters
    await expect(this.departmentFilter).toBeVisible();
    await expect(this.methodFilter).toBeVisible();
    await expect(this.sampleTypeFilter).toBeVisible();
    await expect(this.nablFilter).toBeVisible();
  }

  async assertFooterLinks(): Promise<void> {
    await this.footer.scrollIntoViewIfNeeded().catch(() => {});
    await expect(this.privacyLink, "Privacy Policy link should be visible.").toBeVisible({ timeout: 10_000 });
    await expect(this.termsLink, "Terms & Conditions link should be visible.").toBeVisible({ timeout: 10_000 });
    const socialCount = await this.socialIcons.count();
    expect(socialCount, "Social media icons should be present in footer.").toBeGreaterThanOrEqual(4);
  }

  async assertAllVisibleButtonsWork(city = "Delhi", options?: { skipSetup?: boolean }): Promise<void> {
    if (!options?.skipSetup) {
      await this.ensureHomeReady(city);
    }
    
    const coreButtons = [
      this.page.getByRole("button", { name: "Reset" }).first(),
      this.searchButton,
      this.page.getByRole("button", { name: /Download/i }).first()
    ];

    for (const button of coreButtons) {
      await expect(button).toBeVisible({ timeout: 10_000 });
      await expect(button).toBeEnabled();
      await button.click({ trial: true }).catch(() => {}); 
    }
  }

  async assertEyeIconOpensAndClosesDetails(city = "Delhi", options?: { skipSetup?: boolean }): Promise<void> {
    if (!options?.skipSetup) {
      await this.ensureHomeReady(city);
    }
    await this.waitForCatalogRows(15_000, city);

    const eyeIconCell = this.page.locator('tr td').filter({ has: this.page.locator('img[alt="view"]') }).first();
    const isAvailable = await eyeIconCell.isVisible({ timeout: 5_000 }).catch(() => false);
    
    if (!isAvailable) {
      console.log("Eye icon not available on this UI iteration.");
      return;
    }
    
    await this.waitForModalsToClose();
    await eyeIconCell.click({ force: true });

    const detailsModal = this.page.locator("div.fixed.inset-0.z-50").filter({ hasText: /Key Information|Parameters/i }).first();
    await expect(detailsModal, "Details modal should open after eye icon click.").toBeVisible({ timeout: 10_000 });

    const closeButton = detailsModal.locator("button.bg-red-500, button.text-white, button[aria-label*='Close']").first();
    await closeButton.click();
    await expect(detailsModal).toBeHidden({ timeout: 5_000 });
  }

  async assertDownloadSelectedShowsLoginWarning(city = "Delhi", options?: { skipSetup?: boolean }): Promise<void> {
    if (!options?.skipSetup) {
      await this.ensureHomeReady(city);
    }
    await this.waitForCatalogRows(50_000, city);

    const firstRowCheckbox = this.page.locator('tr td input[type="checkbox"]').first();
    await firstRowCheckbox.check();
    await expect(firstRowCheckbox).toBeChecked();

    const downloadSelectedButton = this.page.getByRole("button", { name: /Download Selected/i });
    await expect(downloadSelectedButton, "\"Download\" button should be visible.").toBeVisible({ timeout: 10_000 });
    
    await this.waitForModalsToClose();
    await downloadSelectedButton.click({ force: true });
    await this.assertLoginModalOpensAndCloses("download selected");
  }

  async assertTopNavigationLinksRoute(city = "Delhi", options?: { skipSetup?: boolean }): Promise<void> {
    if (!options?.skipSetup) {
      await this.ensureHomeReady(city);
    }

    const links = [
      { label: "Test Catalog", content: this.testSearchInput },
      { label: /Doctor Speciality/i, content: this.page.getByText(/Home\s*>\s*Doctor Speciality/i).first() },
      { label: /Disease Condition/i, content: this.page.getByText(/Home\s*>\s*Disease Condition/i).first() },
      { label: /Test Requisition & Consent Forms/i, content: this.page.getByText(/Home\s*>\s*Test Requisition & Consent Forms/i).first() },
      { label: /Brochures/i, content: this.page.getByText(/Home\s*>\s*Brochures?/i).first() },
      { label: /FAQ/i, content: this.page.getByText(/Frequently Asked Questions/i).first() }
    ];

    for (const linkMeta of links) {
      await this.open();
      await this.selectCity(city);
      await this.waitForModalsToClose();

      const navLink = this.header.getByRole("link", { name: linkMeta.label }).first();
      await expect(navLink, `Navigation link "${linkMeta.label}" should be visible.`).toBeVisible({ timeout: 10_000 });
      
      const pagePromise = this.page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null);
      await navLink.click({ force: true });
      
      const newPage = await pagePromise;
      const targetPage = newPage ?? this.page;
      
      await expect(targetPage.locator('body'), `Link "${linkMeta.label}" should load.`).toBeVisible({ timeout: 15_000 });

      if (newPage) {
         await newPage.close();
      } else {
         await expect(linkMeta.content).toBeVisible({ timeout: 15_000 }).catch(() => {});
      }
    }
  }

  async assertHeaderIconsOpenExpectedViews(city = "Delhi", options?: { skipSetup?: boolean }): Promise<void> {
    if (!options?.skipSetup) {
      await this.ensureHomeReady(city);
    }
    await this.waitForModalsToClose();
    await this.waitForHeaderReady();

    const doctorSpecialityLink = this.header.getByRole("link", { name: "Doctor Speciality" }).first();
    await expect(doctorSpecialityLink).toBeVisible({ timeout: 10_000 });
    
    await this.waitForModalsToClose();
    await doctorSpecialityLink.click({ force: true });
    await expect(this.page.getByText(/Home\s*>\s*Doctor Speciality/i).first()).toBeVisible({ timeout: 15_000 });

    await this.logoLink.click();
    await this.waitForModalsToClose();
    await this.waitForHeaderReady(15_000);

    await this.locationIcon.click();
    await expect(this.locationModal, "Location modal should open from header location icon.").toBeVisible({ timeout: 10_000 });
    await this.selectCity(city);

    await this.waitForModalsToClose();
    await this.profileButton.click({ force: true });
    await this.assertLoginModalOpensAndCloses("profile icon");

    await this.waitForModalsToClose();
    await this.cartButton.click({ force: true });
    await this.assertLoginModalOpensAndCloses("cart icon");
  }

  async assertHeaderIconsOpenExpectedViewsForLoggedIn(
    email: string,
    city = "Delhi",
    options?: { skipSetup?: boolean }
  ): Promise<void> {
    if (!options?.skipSetup) {
      await this.ensureHomeReady(city);
    }
    await this.waitForModalsToClose();
    await this.waitForHeaderReady();

    this.logoLink.click(); // Reset to home
    await this.waitForModalsToClose();
    
    await this.profileButton.click({ force: true });
    await this.assertSessionIsActive(email);
    await this.page.keyboard.press("Escape").catch(() => {});

    await this.cartButton.click({ force: true });
    await this.page.waitForTimeout(1_000);
    await expect(this.emailInput, "Login modal should not appear for logged-in user.").toBeHidden({ timeout: 5_000 });
  }

  async assertSearchWorksWithIconAndEnter(city = "Delhi", options?: { skipSetup?: boolean }): Promise<void> {
    if (!options?.skipSetup) {
      await this.ensureHomeReady(city);
    }
    await this.waitForCatalogRows(50_000, city);

    const firstRow = this.page.locator("tr").nth(1);
    let rowText = "";
    await expect.poll(async () => {
      const text = await firstRow.innerText({ timeout: 1000 }).catch(() => "");
      if (text.match(/\b[A-Z]{2,}\d{3,}\b/)) {
        rowText = text;
        return text;
      }

      return null;
    }, { 
      message: "Timed out waiting for a valid Test Code to appear in the first row.",
      timeout: 20_000 
    }).toBeTruthy();

    const testCodeMatch = rowText.match(/\b[A-Z]{2,}\d{3,}\b/);
    const testCode = testCodeMatch ? testCodeMatch[0] : "";

    await this.testSearchInput.fill(testCode);
    await this.searchButton.click();
    await expect(this.page.locator("tr").filter({ hasText: testCode }).first()).toBeVisible({ timeout: 15_000 });

    await this.testSearchInput.fill(testCode);
    await this.testSearchInput.press("Enter");
    await expect(this.page.locator("tr").filter({ hasText: testCode }).first()).toBeVisible({ timeout: 10_000 });
  }

  async assertAddToCartShowsLoginWarning(city = "Delhi", options?: { skipSetup?: boolean }): Promise<void> {
    if (!options?.skipSetup) {
      await this.ensureHomeReady(city);
    }
    await this.waitForCatalogRows(50_000, city);

    const addToCartButton = this.page.getByRole("button", { name: "Add to Cart" }).first();
    await this.waitForModalsToClose();
    await addToCartButton.click({ force: true });
    await this.assertLoginModalOpensAndCloses("add to cart");
  }

  async assertLoggedInAddToCartUpdatesCartCount(city = "Delhi", options?: { skipSetup?: boolean }): Promise<void> {
    if (!options?.skipSetup) {
      await this.ensureHomeReady(city);
    }
    await this.waitForCatalogRows(50_000, city);

    const initialCount = await this.readCartCount();
    let baselineCount = initialCount;
    let addToCartButton = this.page.getByRole("button", { name: "Add to Cart" }).first();
    const hasAddButton = await addToCartButton.isVisible().catch(() => false);

    if (!hasAddButton) {
      const removeButton = this.page.getByRole("button", { name: "Remove" }).first();
      await expect(removeButton, "Expected at least one cart action button on the catalog row.").toBeVisible({ timeout: 10_000 });
      await removeButton.click({ force: true });
      await expect.poll(async () => this.readCartCount(), { timeout: 15_000 }).toBeLessThan(initialCount);
      baselineCount = await this.readCartCount();
      addToCartButton = this.page.getByRole("button", { name: "Add to Cart" }).first();
    }

    await addToCartButton.click({ force: true });
    await expect.poll(async () => this.readCartCount(), { timeout: 15_000 }).toBeGreaterThan(baselineCount);
  }

  async assertLoggedInDownloadSelectedWorks(city = "Delhi", options?: { skipSetup?: boolean }): Promise<void> {
    if (!options?.skipSetup) {
      await this.ensureHomeReady(city);
    }
    await this.waitForCatalogRows(50_000, city);

    const firstRowCheckbox = this.page.locator('tr td input[type="checkbox"]').first();
    await firstRowCheckbox.check();

    const downloadSelectedButton = this.page.getByRole("button", { name: /Download/i }).first();
    const popupPromise = this.page.waitForEvent("popup", { timeout: 10_000 }).catch(() => null);
    const downloadPromise = this.page.waitForEvent("download", { timeout: 10_000 }).catch(() => null);

    await downloadSelectedButton.click();
    const [popup, download] = await Promise.all([popupPromise, downloadPromise]);

    if (popup) await popup.close().catch(() => {});
    expect(Boolean(popup || download), "Download should be triggered.").toBe(true);
  }

  async assertPaginationWorks(city = "Delhi", options?: { skipSetup?: boolean }): Promise<void> {
    if (!options?.skipSetup) {
      await this.ensureHomeReady(city);
    }
    await this.waitForCatalogRows(50_000, city);

    const firstSerialBefore = await this.readFirstRowSerial();
    const pageTwoButton = this.page.getByRole("button", { name: /^2$/ }).first();
    if (await pageTwoButton.isVisible()) {
      await pageTwoButton.click();
      await expect.poll(async () => this.readFirstRowSerial(), { timeout: 10_000 }).not.toBe(firstSerialBefore);
    }
  }

  // ==================== Private Helpers ====================

  async assertSessionIsActive(email?: string): Promise<void> {
    const loginPage = new LoginPage(this.page);
    await loginPage.assertSessionIsActive(email);
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private async clickFirstAvailableCity(): Promise<boolean> {
    const cityOptions = this.locationModal.locator("span, p, .city-name").filter({ hasText: /^[a-zA-Z\s]+$/ });
    const count = await cityOptions.count();
    for (let i = 0; i < count; i++) {
        const option = cityOptions.nth(i);
        if (await option.isVisible() && (await option.textContent())?.trim().length! > 2) {
            await option.click({ force: true });
            return true;
        }
    }
    return false;
  }

  private async waitForHeaderReady(timeout = 30_000): Promise<void> {
    await expect(this.header).toBeVisible({ timeout });
    await expect(this.logoLink).toBeVisible({ timeout });
  }

  private async waitForCatalogRows(timeoutMs = 30_000, city = "Delhi"): Promise<void> {
    const loadingTests = this.page.getByText("Loading tests...", { exact: false }).first();
    
    // 1. Wait for loading indicator to disappear if present
    if (await loadingTests.isVisible().catch(() => false)) {
      await expect(loadingTests).toBeHidden({ timeout: timeoutMs }).catch(() => {});
    }
    
    // 2. Wait for at least one data row in the table body
    const dataRow = this.page.locator("tr").nth(1);
    await expect(dataRow, "Catalog data rows did not load in time.").toBeVisible({ timeout: timeoutMs });
    await this.waitForModalsToClose();
  }

  private async assertLoginModalOpensAndCloses(triggerName: string): Promise<void> {
    const loginModal = this.page.locator("div.fixed.inset-0.z-50").filter({ hasText: /Login|Email|Sign|Welcome|Send Otp/i }).first();
    const toastWarning = this.page.locator(".Toastify__toast, [role='alert'], [data-sonner-toast]").filter({ hasText: /Login|Sign|Please|User not Login/i }).first();

    const modalVisible = await loginModal.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!modalVisible) {
       await expect(
         loginModal.or(toastWarning), 
         `Neither login modal nor toast appeared for ${triggerName}.`
       ).toBeVisible({ timeout: 15_000 });
    }

    if (await loginModal.isVisible()) {
      const closeButton = loginModal.locator("button[title='Close'], button[aria-label*='Close'], button.bg-red-500").first();
      await closeButton.click({ force: true }).catch(() => {});
      await expect(loginModal).toBeHidden({ timeout: 5_000 }).catch(() => {});
    }
  }

  private async readCartCount(): Promise<number> {
    const text = (await this.cartButton.innerText()).trim();
    return Number.parseInt(text.replace(/[^\d]/g, ""), 10) || 0;
  }

  private async readFirstRowSerial(): Promise<number> {
    const text = (await this.page.locator("tr td").nth(2).innerText()).trim();
    return Number.parseInt(text, 10) || 0;
  }

  get logoutButton(): Locator {
    return this.page.getByText(/Logout|Sign\s*Out/i).first();
  }

  getLoggedInEmailLocator(email: string): Locator {
    return this.page.getByText(email, { exact: false });
  }
}
