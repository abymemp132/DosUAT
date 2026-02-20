import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

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

  constructor(page: Page) {
    super(page);
    this.header = this.page.locator("header");
    this.locationModal = this.page
      .locator("div.fixed.inset-0.z-50")
      .filter({ hasText: "Select your Location" })
      .first();
    this.logoLink = this.header.getByRole("link", { name: "Oncquest Laboratories" });
    this.locationIcon = this.header.locator('img[alt="location"]').first();
    this.profileButton = this.header.locator("button").first();
    this.cartButton = this.header.locator("button").filter({ hasText: /^\d+$/ }).first();
    this.testSearchInput = this.page.locator('input[placeholder="Search by Tests and Packages"]');
    this.emailInput = this.page.locator('input[placeholder="Enter Email"]');
    this.searchButton = this.page
      .locator('div:has(input[placeholder="Search by Tests and Packages"]) button')
      .first();
    this.itemsCountLabel = this.page.getByText(/\d+\s*Items/i).first();
    this.toastMessage = this.page.locator(".Toastify__toast, [role=\"alert\"], [data-sonner-toast]");
  }

  async open(baseURL?: string): Promise<void> {
    if (baseURL) {
      await this.goto(baseURL);
      return;
    }

    await this.goto("/");
  }

  async selectCity(city = "Delhi"): Promise<void> {
    if (!(await this.locationModal.isVisible())) {
      return;
    }

    const cityOption = this.locationModal.getByText(city, { exact: true }).first();
    await expect(cityOption, `City option "${city}" should be visible in location modal.`).toBeVisible();
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
    await expect(this.itemsCountLabel).toBeVisible();
  }

  async assertAllVisibleButtonsWork(city = "Delhi"): Promise<void> {
    await this.open();
    await this.selectCity(city);
    await this.assertCoreHomeWidgets();

    const buttonLabels = await this.page.locator("button").evaluateAll((buttons) => {
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

      return buttons
        .filter((button) => isVisible(button))
        .map((button) => {
          const content =
            button.getAttribute("aria-label") ||
            button.textContent ||
            button.getAttribute("title") ||
            "";
          return content.replace(/\s+/g, " ").trim();
        })
        .filter((label) => label.length > 0);
    });

    const uniqueLabels = [...new Set(buttonLabels)];
    expect(uniqueLabels.length, "No visible named buttons found on home page.").toBeGreaterThan(0);

    const failedButtons: string[] = [];

    for (const label of uniqueLabels) {
      try {
        await this.open();
        await this.selectCity(city);

        const button = this.page.getByRole("button", { name: label }).first();
        await expect(button, `Button "${label}" should be visible before click.`).toBeVisible({
          timeout: 10_000
        });
        await expect(button, `Button "${label}" should be enabled before click.`).toBeEnabled();
        await button.click({ timeout: 10_000 });
        await expect(this.page.locator("body")).toBeVisible();
      } catch (error) {
        const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
        failedButtons.push(`"${label}": ${message}`);
      }
    }

    expect(
      failedButtons,
      `These home page buttons did not work:\n${failedButtons.join("\n")}`
    ).toEqual([]);
  }

  async assertEyeIconOpensAndClosesDetails(city = "Delhi"): Promise<void> {
    await this.open();
    await this.selectCity(city);
    await this.waitForCatalogRows();

    const eyeIcon = this.page.locator('img[alt="view"]').first();
    await expect(eyeIcon, "Eye icon should be visible on catalog rows.").toBeVisible({
      timeout: 10_000
    });
    await eyeIcon.click();

    const detailsModal = this.page
      .locator("div.fixed.inset-0.z-50")
      .filter({ hasText: "Key Information" })
      .first();

    await expect(detailsModal, "Details modal should open after eye icon click.").toBeVisible({
      timeout: 10_000
    });
    await expect(detailsModal).toContainText("Key Information");

    const closeButton = detailsModal.locator("button.text-white.bg-red-500").first();
    await expect(closeButton, "Details modal close button should be visible.").toBeVisible({
      timeout: 10_000
    });
    await closeButton.click();
    await expect(detailsModal).toBeHidden({ timeout: 10_000 });
  }

  async assertDownloadSelectedShowsLoginWarning(city = "Delhi"): Promise<void> {
    await this.open();
    await this.selectCity(city);
    await this.waitForCatalogRows();

    const firstRowCheckbox = this.page.locator('tr td input[type="checkbox"]').first();
    await expect(firstRowCheckbox, "At least one test row checkbox should be visible.").toBeVisible({
      timeout: 10_000
    });
    await firstRowCheckbox.check();
    await expect(firstRowCheckbox).toBeChecked();

    const downloadSelectedButton = this.page.getByRole("button", { name: "Download Selected" });
    await expect(
      downloadSelectedButton,
      "\"Download Selected\" button should be visible after selecting a row."
    ).toBeVisible({
      timeout: 10_000
    });
    await downloadSelectedButton.click();

    await this.assertUserNotLoginToast();
  }

  async assertTopNavigationLinksRoute(city = "Delhi"): Promise<void> {
    const links = [
      { label: "Test Catalog", path: "/new-test" },
      { label: "Doctor Speciality", path: "/doctor-speciality" },
      { label: "Disease Condition", path: "/disease-condition" },
      { label: "Test Requisition & Consent Forms", path: "/consent-forms" },
      { label: "Brochures", path: "/brochure" },
      { label: "FAQ's", path: "/FAQs" }
    ];

    for (const linkMeta of links) {
      await this.open();
      await this.selectCity(city);

      const navLink = this.header.getByRole("link", { name: linkMeta.label });
      await expect(navLink, `Navigation link "${linkMeta.label}" should be visible.`).toBeVisible({
        timeout: 10_000
      });
      await Promise.all([
        this.page.waitForURL(
          (url) => {
            const normalizedPath = url.pathname.replace(/\/$/, "").toLowerCase();
            return normalizedPath === linkMeta.path.replace(/\/$/, "").toLowerCase();
          },
          { timeout: 15_000 }
        ),
        navLink.click()
      ]);

      const currentPath = new URL(this.page.url()).pathname.replace(/\/$/, "").toLowerCase();
      const expectedPath = linkMeta.path.replace(/\/$/, "").toLowerCase();
      expect(currentPath, `Link "${linkMeta.label}" should navigate to ${linkMeta.path}.`).toBe(
        expectedPath
      );
    }
  }

  async assertHeaderIconsOpenExpectedViews(city = "Delhi"): Promise<void> {
    await this.open();
    await this.selectCity(city);
    await this.waitForCatalogRows();

    const doctorSpecialityLink = this.header.getByRole("link", { name: "Doctor Speciality" });
    await expect(doctorSpecialityLink, "\"Doctor Speciality\" link should be visible.").toBeVisible({
      timeout: 10_000
    });
    await Promise.all([
      this.page.waitForURL((url) => url.pathname.toLowerCase().includes("/doctor-speciality"), {
        timeout: 15_000
      }),
      doctorSpecialityLink.click()
    ]);

    await expect(this.logoLink, "Header logo icon should be visible.").toBeVisible({ timeout: 10_000 });
    await Promise.all([
      this.page.waitForURL(
        (url) => {
          const path = url.pathname.replace(/\/$/, "").toLowerCase();
          return path === "" || path === "/";
        },
        { timeout: 15_000 }
      ),
      this.logoLink.click()
    ]);

    await expect(this.locationIcon, "Header location icon should be visible.").toBeVisible({
      timeout: 10_000
    });
    await this.locationIcon.click();
    await expect(this.locationModal, "Location modal should open from header location icon.").toBeVisible({
      timeout: 10_000
    });
    await this.selectCity(city);

    await expect(this.profileButton, "Header profile icon should be visible.").toBeVisible({
      timeout: 10_000
    });
    await this.profileButton.click();
    await this.assertLoginModalOpensAndCloses("profile icon");

    await expect(this.cartButton, "Header cart icon should be visible.").toBeVisible({ timeout: 10_000 });
    await this.cartButton.click();
    await this.assertLoginModalOpensAndCloses("cart icon");
  }

  async assertHeaderIconsOpenExpectedViewsForLoggedIn(email: string, city = "Delhi"): Promise<void> {
    await this.open();
    await this.selectCity(city);
    await this.waitForCatalogRows();

    const doctorSpecialityLink = this.header.getByRole("link", { name: "Doctor Speciality" });
    await expect(doctorSpecialityLink, "\"Doctor Speciality\" link should be visible.").toBeVisible({
      timeout: 10_000
    });
    await Promise.all([
      this.page.waitForURL((url) => url.pathname.toLowerCase().includes("/doctor-speciality"), {
        timeout: 15_000
      }),
      doctorSpecialityLink.click()
    ]);

    await expect(this.logoLink, "Header logo icon should be visible.").toBeVisible({ timeout: 10_000 });
    await Promise.all([
      this.page.waitForURL(
        (url) => {
          const path = url.pathname.replace(/\/$/, "").toLowerCase();
          return path === "" || path === "/";
        },
        { timeout: 15_000 }
      ),
      this.logoLink.click()
    ]);

    await expect(this.locationIcon, "Header location icon should be visible.").toBeVisible({
      timeout: 10_000
    });
    await this.locationIcon.click();
    await expect(this.locationModal, "Location modal should open from header location icon.").toBeVisible({
      timeout: 10_000
    });
    await this.selectCity(city);

    await expect(this.profileButton, "Header profile icon should be visible.").toBeVisible({
      timeout: 10_000
    });
    await this.profileButton.click();
    await expect(
      this.page.getByRole("button", { name: /logout/i }),
      "Profile menu should show logout for logged-in user."
    ).toBeVisible({ timeout: 10_000 });
    await expect(this.page.getByText(email, { exact: false })).toBeVisible({ timeout: 10_000 });
    await this.page.keyboard.press("Escape").catch(() => {});

    await expect(this.cartButton, "Header cart icon should be visible.").toBeVisible({ timeout: 10_000 });
    await this.cartButton.click();
    await this.page.waitForTimeout(1_000);
    await expect(
      this.emailInput,
      "Login modal should not appear when logged-in user clicks cart icon."
    ).toBeHidden({ timeout: 5_000 });
    await expect(this.toastMessage.filter({ hasText: "User not Login" }).first()).not.toBeVisible();
    await this.page.keyboard.press("Escape").catch(() => {});
  }

  async assertSearchWorksWithIconAndEnter(city = "Delhi"): Promise<void> {
    await this.open();
    await this.selectCity(city);
    await this.waitForCatalogRows(34_000);

    const firstRow = this.page
      .locator("tr")
      .filter({ has: this.page.getByRole("button", { name: "Add to Cart" }) })
      .first();
    await expect(firstRow, "At least one test row should be visible for search scenario.").toBeVisible({
      timeout: 10_000
    });

    const firstRowText = await firstRow.innerText();
    const testCodeMatch = firstRowText.match(/\b[A-Z]{2,}\d{3,}\b/);
    expect(testCodeMatch, "Could not extract test code from the first catalog row.").not.toBeNull();
    const testCode = testCodeMatch![0];

    const beforeCount = await this.readItemsCount();

    await this.testSearchInput.fill(testCode);
    await this.searchButton.click();
    await expect(this.itemsCountLabel).toBeVisible({ timeout: 10_000 });
    await expect(
      this.page.locator("tr").filter({ hasText: testCode }).first(),
      `Search with icon should show test code "${testCode}".`
    ).toBeVisible({ timeout: 10_000 });

    const afterIconSearchCount = await this.readItemsCount();
    expect(
      afterIconSearchCount,
      `Search with icon should not increase item count for "${testCode}".`
    ).toBeLessThanOrEqual(beforeCount);

    await this.testSearchInput.fill(testCode);
    await this.testSearchInput.press("Enter");
    await expect(this.itemsCountLabel).toBeVisible({ timeout: 10_000 });
    await expect(
      this.page.locator("tr").filter({ hasText: testCode }).first(),
      `Search with Enter should show test code "${testCode}".`
    ).toBeVisible({ timeout: 10_000 });
  }

  async assertAddToCartShowsLoginWarning(city = "Delhi"): Promise<void> {
    await this.open();
    await this.selectCity(city);
    await this.waitForCatalogRows();

    const addToCartButton = this.page.getByRole("button", { name: "Add to Cart" }).first();
    await expect(addToCartButton, "\"Add to Cart\" button should be visible.").toBeVisible({
      timeout: 10_000
    });
    await addToCartButton.click();
    await this.assertUserNotLoginToast();
  }

  async assertLoggedInAddToCartUpdatesCartCount(city = "Delhi"): Promise<void> {
    await this.open();
    await this.selectCity(city);
    await this.waitForCatalogRows();

    const initialCount = await this.readCartCount();
    const addToCartButton = this.page.getByRole("button", { name: "Add to Cart" }).first();
    await expect(addToCartButton, "\"Add to Cart\" button should be visible.").toBeVisible({
      timeout: 10_000
    });

    await addToCartButton.click();
    await expect
      .poll(async () => this.readCartCount(), {
        timeout: 15_000,
        message: "Cart count should increase after adding a test for logged-in user."
      })
      .toBeGreaterThan(initialCount);
  }

  async assertLoggedInDownloadSelectedWorks(city = "Delhi"): Promise<void> {
    await this.open();
    await this.selectCity(city);
    await this.waitForCatalogRows();

    const firstRowCheckbox = this.page.locator('tr td input[type="checkbox"]').first();
    await expect(firstRowCheckbox, "At least one test row checkbox should be visible.").toBeVisible({
      timeout: 10_000
    });
    await firstRowCheckbox.check();
    await expect(firstRowCheckbox).toBeChecked();

    const downloadSelectedButton = this.page.getByRole("button", { name: "Download Selected" });
    await expect(
      downloadSelectedButton,
      "\"Download Selected\" button should be visible after selecting a row."
    ).toBeVisible({
      timeout: 10_000
    });

    const popupPromise = this.page.waitForEvent("popup", { timeout: 10_000 }).catch(() => null);
    const downloadPromise = this.page.waitForEvent("download", { timeout: 10_000 }).catch(() => null);

    await downloadSelectedButton.click();
    const [popup, download] = await Promise.all([popupPromise, downloadPromise]);

    if (popup) {
      await popup.close().catch(() => {});
    }

    expect(
      Boolean(popup || download),
      "Download Selected should open a popup or trigger a file download for logged-in user."
    ).toBe(true);
    await expect(this.emailInput, "Login modal should not appear for logged-in download action.").toBeHidden({
      timeout: 5_000
    });
  }

  async assertPaginationWorks(city = "Delhi"): Promise<void> {
    await this.open();
    await this.selectCity(city);
    await this.waitForCatalogRows();

    const firstSerialBefore = await this.readFirstRowSerial();
    const pageTwoButton = this.page.getByRole("button", { name: /^2$/ }).first();
    await expect(pageTwoButton, "Pagination button \"2\" should be visible.").toBeVisible({
      timeout: 10_000
    });

    await pageTwoButton.click();
    await expect
      .poll(async () => this.readFirstRowSerial(), {
        timeout: 10_000,
        message: "First row serial should move after going to page 2."
      })
      .toBeGreaterThan(firstSerialBefore);
  }

  private async readItemsCount(): Promise<number> {
    const itemsText = (await this.itemsCountLabel.innerText()).trim();
    const parsedCount = Number.parseInt(itemsText.replace(/[^\d]/g, ""), 10);
    expect(Number.isNaN(parsedCount), `Could not parse item count from "${itemsText}".`).toBe(false);
    return parsedCount;
  }

  private async readCartCount(): Promise<number> {
    const cartText = (await this.cartButton.innerText()).trim();
    const parsedCount = Number.parseInt(cartText.replace(/[^\d]/g, ""), 10);
    expect(Number.isNaN(parsedCount), `Could not parse cart count from "${cartText}".`).toBe(false);
    return parsedCount;
  }

  private async readFirstRowSerial(): Promise<number> {
    const serialText = (await this.page.locator("tr td").nth(2).innerText()).trim();
    const parsedSerial = Number.parseInt(serialText, 10);
    expect(Number.isNaN(parsedSerial), `Could not parse first row serial from "${serialText}".`).toBe(
      false
    );
    return parsedSerial;
  }

  private async assertUserNotLoginToast(): Promise<void> {
    await expect(
      this.toastMessage.filter({ hasText: "User not Login" }).first(),
      "Login warning should appear for guest user."
    ).toBeVisible({ timeout: 10_000 });
  }

  private async waitForCatalogRows(timeoutMs = 30_000): Promise<void> {
    await expect(
      this.page.locator('tr td input[type="checkbox"]').first(),
      "Catalog rows should be loaded before proceeding."
    ).toBeVisible({ timeout: timeoutMs });
  }

  private async assertLoginModalOpensAndCloses(triggerName: string): Promise<void> {
    const loginModal = this.page
      .locator("div.fixed.inset-0.z-50")
      .filter({ has: this.emailInput })
      .first();

    await expect(loginModal, `Login modal should open after clicking ${triggerName}.`).toBeVisible({
      timeout: 10_000
    });
    await expect(this.emailInput, "Email input should be visible in login modal.").toBeVisible({
      timeout: 10_000
    });

    const closeButton = loginModal.locator("button.bg-red-500").first();
    await expect(closeButton, "Login modal close button should be visible.").toBeVisible({
      timeout: 10_000
    });
    await closeButton.click();
    await expect(loginModal).toBeHidden({ timeout: 10_000 });
  }
}
