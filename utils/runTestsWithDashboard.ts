import fs from "fs";
import path from "path";
import { spawnSync, SpawnSyncReturns } from "child_process";

const repoRoot = path.resolve(__dirname, "..");
const reportsDir = path.join(repoRoot, "reports");
const npxCmd = "npx";
const nodeCmd = process.execPath;

function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  const secs = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}_${hours}-${mins}-${secs}`;
}

function removePath(targetPath: string): void {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

function cleanGeneratedReports(): void {
  removePath(path.join(repoRoot, "playwright-report"));
  removePath(path.join(repoRoot, "test-results"));

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
    return;
  }

  const generatedPatternList = [
    /^playwright-.*\.json$/i,
    /^playwright-.*\.xml$/i,
    /^playwright-html-.*/i,
    /^test-result-dashboard-.*\.html$/i,
    /^test-result-dashboard-.*\.md$/i,
    /^test-result-dashboard-latest\.html$/i,
    /^test-result-dashboard-latest\.md$/i,
    /^dashboard-assets$/i
  ];

  const entries = fs.readdirSync(reportsDir);
  for (const entry of entries) {
    if (generatedPatternList.some((pattern) => pattern.test(entry))) {
      removePath(path.join(reportsDir, entry));
    }
  }
}

function quoteArg(arg: string | number): string {
  const value = String(arg);
  if (value.length === 0) {
    return "\"\"";
  }
  if (/[ \t\n\r"]/g.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

function runCommand(command: string, args: string[], env: NodeJS.ProcessEnv): SpawnSyncReturns<Buffer> {
  const commandLine = [quoteArg(command), ...args.map((arg) => quoteArg(arg))].join(" ");
  const result = spawnSync(commandLine, {
    cwd: repoRoot,
    stdio: "inherit",
    env,
    shell: true
  });

  if (result.error) {
    console.error(`Command failed to start: ${commandLine}`);
    console.error(result.error.message);
  }

  return result;
}

function main(): void {
  cleanGeneratedReports();

  const stamp = formatTimestamp(new Date());
  const outputJson = `reports/playwright-${stamp}.json`;
  const outputXml = `reports/playwright-${stamp}.xml`;
  const outputHtmlDir = `reports/playwright-html-${stamp}`;

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PLAYWRIGHT_HTML_OUTPUT_DIR: outputHtmlDir,
    PLAYWRIGHT_HTML_OPEN: "never",
    PLAYWRIGHT_JSON_OUTPUT_NAME: outputJson,
    PLAYWRIGHT_JUNIT_OUTPUT_NAME: outputXml
  };

  const authFile = path.join(repoRoot, ".auth", "user.json");
  const hasAuth = fs.existsSync(authFile);

  if (!hasAuth) {
    console.log("\x1b[36m[System] No active session found. Running 'setup' project first...\x1b[0m");
    const setupRun = runCommand(npxCmd, ["playwright", "test", "--project=setup"], env);
    if (setupRun.status !== 0) {
      console.error("\x1b[31m[Critical] Auth setup failed. Aborting full test run.\x1b[0m");
      process.exit(1);
    }
  } else {
    console.log("\x1b[32m[System] Found existing session. Proceeding with execution.\x1b[0m");
  }

  // Ordered list of tests as requested by USER
  const orderedTests = [
    "tests/login.spec.ts",
    "tests/home.spec.ts",
    "tests/testCatalog.spec.ts",
    "tests/doctorSpeciality.spec.ts",
    "tests/diseaseCondition.spec.ts",
    "tests/forms.spec.ts",
    "tests/brochure.spec.ts",
    "tests/faq.spec.ts",
    "tests/addToCart.spec.ts"
  ];

  const extraArgs = process.argv.slice(2);
  
  // If no specific tests are passed via CLI, use the ordered list
  const targets = extraArgs.length > 0 ? extraArgs : orderedTests;
  
  const testRun = runCommand(npxCmd, ["playwright", "test", ...targets, "--reporter=line,html,json,junit"], env);
  const testExitCode = typeof testRun.status === "number" ? testRun.status : 1;

  const jsonPath = path.join(repoRoot, outputJson);
  if (fs.existsSync(jsonPath)) {
    runCommand(nodeCmd, ["utils/generateTestDashboard.js", outputJson], env);
  } else {
    console.error(`Dashboard skipped: JSON report not found at ${outputJson}`);
  }

  process.exit(testExitCode);
}

main();
