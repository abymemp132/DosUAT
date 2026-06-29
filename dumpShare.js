const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating...");
  await page.goto("https://dos-web-uat.abym.us/add-to-cart", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  const locators = page.locator('img[src*="whatsapp" i], img[src*="mail" i], img[src*="outlook" i], img[src*="pdf" i], img[alt*="whatsapp" i], img[alt*="mail" i], img[alt*="outlook" i], img[alt*="pdf" i]');
  
  const count = await locators.count();
  console.log(`Found ${count} share images`);

  for (let i = 0; i < count; i++) {
    const el = locators.nth(i);
    // Get the outerHTML of the image and its parent
    const html = await el.evaluate(node => {
      const parent = node.parentElement;
      return {
        image: node.outerHTML,
        parent: parent ? parent.outerHTML : "NO PARENT"
      };
    });
    console.log(`Image ${i}:`, html);
  }

  await browser.close();
})();
