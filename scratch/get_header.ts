import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: ".auth/user.json" });
  const page = await context.newPage();
  await page.goto("https://dos-web-uat.abym.us/");
  
  // Wait for the profile button to be visible (assumes it's the 2nd to last button with an image)
  const profileBtn = page.locator("header button").filter({ has: page.locator('img, svg') }).nth(-2);
  await page.waitForTimeout(5000);
  
  // Dump the dropdown HTML
  const headerHTML = await page.locator("header").innerHTML();
  console.log("HEADER HTML====\n" + headerHTML);
  await page.screenshot({ path: "scratch/loggedin_header.png" });
  
  await browser.close();
})();
