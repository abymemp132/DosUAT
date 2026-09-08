import { test, expect } from "@playwright/test";
import { HomePage } from "../../pages/home/home.page";

test("[Login] debug logout button", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("https://dos-web-uat.abym.us/");
  const sessionData = await page.evaluate(() => {
     return { token: window.localStorage.getItem("authToken") };
  });
  console.log("Logged in:", !!sessionData.token);
  
  const homePage = new HomePage(page);
  await homePage.ensureHomeReady("Delhi");
  
  await page.locator("header").locator("button").filter({ has: page.locator("img, svg") }).nth(-2).click();
  await page.waitForTimeout(2000);
  
  const dropDownHTML = await page.locator("body").innerHTML();
  const match = dropDownHTML.match(/[^"'>]{0,20}(?:logout|sign out)[^"'<]{0,20}/i);
  console.log("Match:", match);
  const elementsWithLogout = await page.getByText(/logout|sign out/i).all();
  for (const el of elementsWithLogout) {
      console.log("Tag:", await el.evaluate(e => e.tagName));
      console.log("Class:", await el.evaluate(e => e.className));
  }
});
