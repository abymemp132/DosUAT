import "dotenv/config";
import { spawnSync } from "child_process";

async function main() {
  const target = process.argv[2] || "dashboard";
  const dir = target === "report" ? "playwright-report" : "reports/dashboard-static";
  const authToken = process.env.NETLIFY_AUTH_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;

  if (!authToken || !siteId) {
    console.error("❌ NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID must be configured in .env");
    process.exit(1);
  }

  console.log(`🚀 Deploying ${target} (${dir}) to Netlify...`);
  const result = spawnSync("npx", ["netlify-cli", "deploy", `--dir=${dir}`, `--site=${siteId}`, `--auth=${authToken}`, "--prod"], {
    stdio: "inherit",
    shell: true
  });

  if (result.status === 0) {
    console.log(`✅ Netlify deployment for ${target} succeeded!`);
  } else {
    console.error(`❌ Netlify deployment for ${target} failed.`);
    process.exit(result.status || 1);
  }
}

main();
