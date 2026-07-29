import { FullConfig } from "@playwright/test";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function globalSetup(config: FullConfig): Promise<void> {
  const authDir = path.join(process.cwd(), ".auth");
  const authFile = path.join(authDir, "user.json");

  // Automated setup handles login now.

  // Check if BASE_URL is set
  if (!process.env.BASE_URL) {
    process.env.BASE_URL = "https://dos-web-uat.abym.us/";
  }
  const baseURL = process.env.BASE_URL;
  console.log(`✅ BASE_URL: ${baseURL}`);

  const websiteUsername = process.env.WEBSITE_USERNAME || "";
  const websitePassword = process.env.WEBSITE_PASSWORD || "";
  if (websiteUsername && websitePassword) {
    console.log("✅ Website access credentials detected.");
  } else if (websiteUsername || websitePassword) {
    console.log("⚠️  WEBSITE_USERNAME and WEBSITE_PASSWORD should both be set for site access.");
  }

  // Cleanup old reports (optional - keep last 5)
  const reportsDir = path.join(process.cwd(), "reports");
  if (fs.existsSync(reportsDir)) {
    const oldFiles = fs.readdirSync(reportsDir)
      .filter(f => f.startsWith("playwright-") && f.endsWith(".json"))
      .sort()
      .reverse();

    // Keep only last 5 JSON reports
    oldFiles.slice(5).forEach(file => {
      const filePath = path.join(reportsDir, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Cleaned up old report: ${file}`);
      } catch (err) {
        console.warn(`⚠️  Could not delete ${file}:`, err);
      }
    });
  }

  console.log("✅ Global setup complete");
}

export default globalSetup;
