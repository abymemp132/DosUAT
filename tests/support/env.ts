// Playwright supplies the staging fallback in playwright.config.ts when BASE_URL
// is omitted, so guest tests must not be skipped merely because it is not set.
export const hasBaseUrl = true;
