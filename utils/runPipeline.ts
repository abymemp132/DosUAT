import { spawnSync } from "child_process";
import path from "path";
import fs from "fs";

const repoRoot = path.resolve(__dirname, "..");
const reportsDir = path.join(repoRoot, "reports");

function runCommand(command: string, args: string[]): number {
  console.log(`\n=== Running: ${command} ${args.join(" ")} ===\n`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: true,
  });
  return typeof result.status === "number" ? result.status : 1;
}

async function main() {
  process.env.TEST_ENV = process.env.TEST_ENV || "UAT";

  // 1. Run both guest and login tests via runTestsWithDashboard
  const testExitCode = runCommand("npm", ["run", "test"]);

  // 2. Find the latest timestamped playwright json report and copy it to reports/results.json
  // so that the email sender script has the most up-to-date metrics.
  try {
    const files = fs.readdirSync(reportsDir);
    const reportFiles = files
      .filter(f => f.startsWith("playwright-") && f.endsWith(".json"))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(reportsDir, f)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time);

    if (reportFiles.length > 0) {
      const latestReport = reportFiles[0].name;
      const srcPath = path.join(reportsDir, latestReport);
      const destPath = path.join(reportsDir, "results.json");
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${latestReport} to reports/results.json for email sender.`);
    }
  } catch (err) {
    console.error("Failed to copy latest report JSON:", err);
  }

  // 3. Generate PDF report from the static dashboard.
  const reportExitCode = runCommand("npm", ["run", "report:pdf"]);

  // 4. Send email only when the attachment was generated successfully.
  const emailExitCode = reportExitCode === 0 ? runCommand("npm", ["run", "send-email"]) : 1;

  // 5. Propagate failures from every required pipeline stage.
  process.exit(testExitCode || reportExitCode || emailExitCode);
}

main().catch((err) => {
  console.error("Pipeline run failed:", err);
  process.exit(1);
});
