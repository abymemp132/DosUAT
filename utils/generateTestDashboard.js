const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const reportsDir = path.join(repoRoot, "reports");
const staticDir = path.join(reportsDir, "dashboard-static");
const canonicalReportPath = path.join(reportsDir, "results.json");
const executionReportDir = path.join(reportsDir, "execution-report");
const executionReportPath = path.join(executionReportDir, "results.json");

function stripAnsi(value) {
  return String(value || "").replace(/\u001b\[[0-9;]*m/g, "");
}

function getErrorMessage(result) {
  if (!result) return "";
  
  let messages = [];
  if (result.error && (result.error.message || result.error.value)) {
    messages.push(result.error.message || result.error.value);
  }
  
  if (Array.isArray(result.errors)) {
    result.errors.forEach(err => {
      if (err.message || err.value) messages.push(err.message || err.value);
    });
  }

  const combined = [...new Set(messages)].join("\n---\n");
  const cleaned = stripAnsi(combined).trim();
  // Keep up to 10 lines for better debugging context in the PDF
  return cleaned ? cleaned.split("\n").slice(0, 10).join("\n") : "";
}

function parseModule(file) {
  const normalized = String(file || "").replace(/\\/g, "/");
  const parts = normalized.split("/");
  
  // Skip root folders like 'tests', 'specs', or '.'
  let idx = 0;
  while (idx < parts.length && (parts[idx] === "tests" || parts[idx] === "." || parts[idx] === "..")) {
    idx++;
  }
  
  const m = parts[idx] || "general";
  // Capitalize and format nicely (e.g. addToCart -> AddToCart)
  return m.charAt(0).toUpperCase() + m.slice(1);
}

function collectEntries(reportJson) {
  const entries = [];
  function walkSuite(suite, parents) {
    const nextParents = suite.title ? [...parents, suite.title] : parents;
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
            const results = test.results || [];
            const finalResult = results[results.length - 1] || {};
            // Flaky logic: multiple attempts AND last one passed
            const isFlaky = results.length > 1 && finalResult.status === 'passed';

            entries.push({
                title: spec.title || "",
                file: spec.file || "",
                line: spec.line || 0,
                moduleName: parseModule(spec.file),
                status: isFlaky ? 'flaky' : (finalResult.status || "unknown"),
                durationMs: Number(finalResult.duration || 0),
                startTime: finalResult.startTime || "",
                fullPath: nextParents.join(" > "),
                errorMessage: getErrorMessage(finalResult),
                attempts: results.map((r, idx) => ({
                    id: `attempt-${idx}`,
                    status: r.status,
                    durationMs: Number(r.duration || 0),
                    startTime: r.startTime || "",
                    stdout: "",
                    stderr: getErrorMessage(r)
                })),
                flaky: isFlaky
            });
        }
      }
    }
    if (suite.suites) {
      for (const child of suite.suites) walkSuite(child, nextParents);
    }
  }
  for (const suite of reportJson.suites || []) walkSuite(suite, []);
  return entries;
}

function main() {
  const cliArgs = process.argv.slice(2);
  const inputArg = cliArgs.find((arg) => !String(arg).startsWith("--"));
  const inputJsonPath = inputArg ? path.resolve(repoRoot, inputArg) : path.join(reportsDir, "results.json");
  
  if (!fs.existsSync(inputJsonPath)) {
    console.error(`No JSON report found at ${inputJsonPath}. Run tests with JSON reporter first.`);
    process.exit(1);
  }

  let buffer = fs.readFileSync(inputJsonPath);
  let content = "";
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    content = buffer.toString("utf16le").replace(/^\uFEFF/, "");
  } else {
    content = buffer.toString("utf8");
  }

  const jsonStart = content.search(/\{\s*"config"\s*:/);
  const jsonEnd = content.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    console.error("No valid Playwright JSON report structure found in the file.");
    process.exit(1);
  }
  const jsonOnly = content.substring(jsonStart, jsonEnd + 1);

  const reportJson = JSON.parse(jsonOnly);
  const entries = collectEntries(reportJson);
  
  const passed = entries.filter(e => e.status === 'passed').length;
  const skipped = entries.filter(e => e.status === 'skipped').length;
  const flaky = entries.filter(e => e.status === 'flaky').length;
  const failed = entries.length - passed - skipped - flaky;
  const totalDuration = entries.reduce((acc, e) => acc + e.durationMs, 0);

  // Build richness for advanced widgets
  const thresholdMs = 20000;
  const slowCases = entries.filter(e => e.durationMs > thresholdMs).sort((a,b) => b.durationMs - a.durationMs);
  
  const modules = [...new Set(entries.map(e => e.moduleName))];
  const weeklyTrend = modules.map((m, i) => ({
      key: `W${i+1}`,
      label: `Module ${m}`,
      passed: entries.filter(e => e.moduleName === m && e.status === 'passed').length,
      failed: entries.filter(e => e.moduleName === m && e.status === 'failed').length,
      flaky: entries.filter(e => e.moduleName === m && e.status === 'flaky').length,
      total: entries.filter(e => e.moduleName === m).length
  }));

  const templatePath = path.join(staticDir, "index.html");
  let existingRuns = [];
  if (fs.existsSync(templatePath)) {
     try {
        const existingHtml = fs.readFileSync(templatePath, "utf8");
        const match = existingHtml.match(/window\.__DASHBOARD_REPORT__\s*=\s*({[\s\S]*?});/);
        if (match) {
           const oldData = JSON.parse(match[1]);
           if (oldData && Array.isArray(oldData.runs)) {
              existingRuns = oldData.runs;
           }
        }
     } catch (e) {
        console.warn("Could not parse existing run history:", e.message);
     }
  }

  const apiFails = entries.filter(e => e.errorMessage && /api|network|status code|500|400|fetch|axios/i.test(e.errorMessage)).length;
  const riskCases = entries.filter(e => e.status === 'failed' || e.flaky).length;

  const currentRun = {
    runId: "RUN-" + Math.floor(Math.random() * 9000 + 1000),
    startTime: reportJson.stats ? reportJson.stats.startTime : new Date().toISOString(),
    durationMs: totalDuration,
    summary: { 
        total: entries.length, 
        passed, 
        failed, 
        flaky, 
        skipped,
        apiFails,
        riskCases,
        passRate: entries.length > 0 ? ((passed + flaky) / entries.length) * 100 : 0 
    },
    // Store cases for the last 3 runs only to save space
    cases: entries.map((e, i) => ({
      id: `case-${i}`,
      suiteTitle: e.fullPath,
      testTitle: e.title,
      moduleName: e.moduleName,
      status: e.status,
      durationMs: e.durationMs,
      lastErrorMessage: e.errorMessage,
      flaky: e.flaky
    }))
  };

  // Keep history: new one at top, max 20 runs. 
  // We keep NEW cases for top 3, but clear cases for older ones to prevent file bloat
  const updatedRuns = [currentRun, ...existingRuns.filter(r => r.runId !== currentRun.runId)]
    .slice(0, 20)
    .map((run, idx) => {
       if (idx >= 3) {
          const { cases, ...rest } = run;
          return rest;
       }
       return run;
    });

  const dashboardReport = {
    generatedAt: new Date().toISOString(),
    project: "Dos",
    environment: "UAT / Performance",
    summary: {
      total: entries.length,
      passed,
      failed,
      flaky,
      skipped,
      apiFails,
      riskCases,
      attempts: entries.reduce((acc, e) => acc + e.attempts.length, 0),
      totalDurationMs: totalDuration,
      averageDurationMs: entries.length > 0 ? totalDuration / entries.length : 0,
      passRate: entries.length > 0 ? ((passed + flaky) / entries.length) * 100 : 0
    },
    metadata: {
        os: process.platform,
        node: process.version,
        engine: "Playwright",
        totalModules: modules.length
    },
    thresholdMs: thresholdMs,
    slowCaseSummary: {
        thresholdMs: thresholdMs,
        total: slowCases.length,
        cases: slowCases.slice(0, 5)
    },
    weeklyTrend: weeklyTrend,
    periodOptions: { day: [], week: [], month: [], year: [] },
    runCount: updatedRuns.length,
    runs: updatedRuns,
    cases: currentRun.cases
  };

  let html = fs.readFileSync(templatePath, "utf8");
  const dashDataVar = `window.__DASHBOARD_REPORT__ = ${JSON.stringify(dashboardReport, null, 2)};`;
  
  // Robust replacement using Regex to find the assignment even if spacing differs
  const reportRegex = /window\.__DASHBOARD_REPORT__\s*=\s*\{[\s\S]*?\};/;
  
  if (html.match(reportRegex)) {
     html = html.replace(reportRegex, dashDataVar);
  } else if (html.includes('<script>')) {
     // Fallback: inject at start of first script tag if specific structure not found
     html = html.replace('<script>', `<script>\n  ${dashDataVar}`);
  }

  fs.writeFileSync(templatePath, html);
  fs.writeFileSync(canonicalReportPath, `${JSON.stringify(reportJson, null, 2)}\n`);

  fs.mkdirSync(executionReportDir, { recursive: true });
  fs.writeFileSync(executionReportPath, `${JSON.stringify(reportJson, null, 2)}\n`);

  console.log("Successfully updated Premium Static Dashboard at: reports/dashboard-static/index.html");
  console.log("Refreshed canonical JSON report at: reports/results.json");
  console.log("Synced dashboard data source at: reports/execution-report/results.json");
}

main();
