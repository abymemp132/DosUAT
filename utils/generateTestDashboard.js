const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const reportsDir = path.join(repoRoot, "reports");
const inputArg = process.argv[2];

function ensureReportsDir() {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
}

function findLatestPlaywrightJson() {
  const files = fs
    .readdirSync(reportsDir)
    .filter((file) => /^playwright-.*\.json$/i.test(file))
    .map((file) => {
      const fullPath = path.join(reportsDir, file);
      return {
        file,
        fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return files[0] ? files[0].fullPath : null;
}

function findLatestPlaywrightHtmlDir() {
  const dirs = fs
    .readdirSync(reportsDir)
    .filter((file) => /^playwright-html-.*$/i.test(file))
    .map((file) => {
      const fullPath = path.join(reportsDir, file);
      return {
        file,
        fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (!dirs[0]) {
    return null;
  }

  const candidate = path.join(dirs[0].fullPath, "index.html");
  return fs.existsSync(candidate) ? candidate : null;
}

function formatTimestamp(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  const secs = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}_${hours}-${mins}-${secs}`;
}

function formatDateTime(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  const secs = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
}

function formatDuration(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function toRepoRelative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function toReportsRelative(filePath) {
  return path.relative(reportsDir, filePath).split(path.sep).join("/");
}

function stripAnsi(value) {
  return String(value || "").replace(/\u001b\[[0-9;]*m/g, "");
}

function getErrorMessage(result) {
  const error =
    (result && result.error && (result.error.message || result.error.value)) ||
    (result &&
      Array.isArray(result.errors) &&
      result.errors.length > 0 &&
      (result.errors[0].message || result.errors[0].value)) ||
    "";
  const cleaned = stripAnsi(error).trim();
  if (!cleaned) {
    return "";
  }
  return cleaned.split("\n").slice(0, 6).join("\n");
}

function statusLabel(status) {
  if (status === "passed") {
    return "Passed";
  }
  if (status === "failed") {
    return "Failed";
  }
  if (status === "skipped") {
    return "Skipped";
  }
  if (status === "timedOut") {
    return "TimedOut";
  }
  return status || "Unknown";
}

function statusClass(status) {
  if (status === "passed") {
    return "ok";
  }
  if (status === "failed" || status === "timedOut") {
    return "bad";
  }
  return "skip";
}

function safeToken(value, fallback) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseModule(file) {
  const normalized = String(file || "").replace(/\\/g, "/");
  const first = normalized.split("/")[0] || "unknown";
  return first;
}

function parseSegment(title, moduleName) {
  if (title.includes("[Guest]")) {
    return "Guest";
  }
  if (title.includes("[Login]")) {
    return "Login";
  }
  if (moduleName === "auth") {
    return "Auth";
  }
  if (moduleName === "smoke") {
    return "Smoke";
  }
  return "Other";
}

function collectEntries(reportJson) {
  const entries = [];

  function walkSuite(suite, parents) {
    const nextParents = suite.title ? [...parents, suite.title] : parents;

    if (Array.isArray(suite.specs)) {
      for (const spec of suite.specs) {
        const tests = Array.isArray(spec.tests) ? spec.tests : [];
        for (const test of tests) {
          const results = Array.isArray(test.results) ? test.results : [];
          const finalResult = results[results.length - 1] || {};
          const moduleName = parseModule(spec.file);
          const segment = parseSegment(spec.title, moduleName);
          const attachments = (finalResult.attachments || [])
            .filter((a) => a && a.path)
            .map((a) => ({
              name: a.name || "attachment",
              contentType: a.contentType || "",
              relPath: toRepoRelative(a.path),
              absPath: a.path
            }));

          entries.push({
            title: spec.title || "",
            file: spec.file || "",
            line: spec.line || 0,
            moduleName,
            segment,
            status: finalResult.status || "unknown",
            expectedStatus: test.expectedStatus || "passed",
            durationMs: Number(finalResult.duration || 0),
            startTime: finalResult.startTime || "",
            retries: Math.max(0, results.length - 1),
            fullPath: nextParents.join(" > "),
            errorMessage: getErrorMessage(finalResult),
            attachments
          });
        }
      }
    }

    if (Array.isArray(suite.suites)) {
      for (const child of suite.suites) {
        walkSuite(child, nextParents);
      }
    }
  }

  for (const suite of reportJson.suites || []) {
    walkSuite(suite, []);
  }

  return entries;
}

function summarize(entries) {
  const summary = {
    total: entries.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    timedOut: 0,
    unknown: 0,
    durationMs: 0
  };

  for (const e of entries) {
    summary.durationMs += e.durationMs;
    if (e.status === "passed") {
      summary.passed += 1;
    } else if (e.status === "failed") {
      summary.failed += 1;
    } else if (e.status === "skipped") {
      summary.skipped += 1;
    } else if (e.status === "timedOut") {
      summary.timedOut += 1;
    } else {
      summary.unknown += 1;
    }
  }

  summary.passRate = summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;
  return summary;
}

function summarizeBy(entries, keySelector) {
  const map = new Map();
  for (const entry of entries) {
    const key = keySelector(entry);
    if (!map.has(key)) {
      map.set(key, { total: 0, passed: 0, failed: 0, skipped: 0, timedOut: 0, durationMs: 0 });
    }
    const item = map.get(key);
    item.total += 1;
    item.durationMs += entry.durationMs;
    if (entry.status === "passed") {
      item.passed += 1;
    } else if (entry.status === "failed") {
      item.failed += 1;
    } else if (entry.status === "skipped") {
      item.skipped += 1;
    } else if (entry.status === "timedOut") {
      item.timedOut += 1;
    }
  }
  return map;
}

function toRowsFromMap(map) {
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function buildHtml(params) {
  const {
    generatedAt,
    inputJsonRel,
    inputJsonHref,
    htmlReportRel,
    htmlReportHref,
    missingAttachmentCount,
    summary,
    moduleRows,
    segmentRows,
    failures,
    entries
  } = params;

  const progressWidth = Math.max(0, Math.min(100, summary.passRate));
  const failureBlocks =
    failures.length === 0
      ? '<div class="failure okbg"><h3>No Failures</h3><p>All tests passed in this run.</p></div>'
      : failures
          .map((f, idx) => {
            const hasMissingAttachments = f.attachments.some((a) => !a.exists);
            const attachmentLinks = f.attachments
              .map((a) => {
                if (a.exists && a.dashboardRelPath) {
                  return `<a href="./${escapeHtml(a.dashboardRelPath)}" target="_blank" rel="noopener">${escapeHtml(
                    a.name
                  )}</a>`;
                }
                return `<span class="missing">${escapeHtml(a.name)} (missing)</span>`;
              })
              .join(" | ");
            const fallbackLink =
              hasMissingAttachments && htmlReportHref
                ? ` | <a href="./${escapeHtml(
                    htmlReportHref
                  )}" target="_blank" rel="noopener">open Playwright HTML report</a>`
                : "";
            return `
      <div class="failure">
        <h3>F-${idx + 1} ${escapeHtml(f.title)}</h3>
        <p><strong>Location:</strong> ${escapeHtml(f.file)}:${f.line}</p>
        <p><strong>Status:</strong> ${escapeHtml(statusLabel(f.status))}</p>
        <p><strong>Duration:</strong> ${escapeHtml(formatDuration(f.durationMs))}</p>
        <pre>${escapeHtml(f.errorMessage || "No error text captured.")}</pre>
        <p class="links"><strong>Attachments:</strong> ${attachmentLinks || "None"}${fallbackLink}</p>
      </div>`;
          })
          .join("\n");

  const moduleTableRows = moduleRows
    .map(
      ([name, m]) => `<tr>
  <td>${escapeHtml(name)}</td>
  <td>${m.total}</td>
  <td class="ok">${m.passed}</td>
  <td class="bad">${m.failed}</td>
  <td class="skip">${m.skipped}</td>
  <td>${formatDuration(m.durationMs)}</td>
</tr>`
    )
    .join("\n");

  const segmentTableRows = segmentRows
    .map(
      ([name, m]) => `<tr>
  <td>${escapeHtml(name)}</td>
  <td>${m.total}</td>
  <td class="ok">${m.passed}</td>
  <td class="bad">${m.failed}</td>
  <td class="skip">${m.skipped}</td>
  <td>${formatDuration(m.durationMs)}</td>
</tr>`
    )
    .join("\n");

  const testCaseRows = entries
    .map((e, i) => {
      const cssClass = statusClass(e.status);
      return `<tr>
  <td>${i + 1}</td>
  <td>${escapeHtml(e.title)}</td>
  <td>${escapeHtml(e.moduleName)}</td>
  <td>${escapeHtml(e.segment)}</td>
  <td><span class="pill ${cssClass}">${escapeHtml(statusLabel(e.status))}</span></td>
  <td>${formatDuration(e.durationMs)}</td>
  <td>${escapeHtml(e.file)}:${e.line}</td>
</tr>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Test Result Dashboard</title>
  <style>
    :root {
      --bg: #eef2f8;
      --card: #ffffff;
      --text: #102a43;
      --muted: #486581;
      --ok: #137333;
      --bad: #b42318;
      --skip: #8a6d3b;
      --accent: #0b5cab;
      --border: #d9e2ec;
      --hero-a: #0b5cab;
      --hero-b: #1566b3;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      color: var(--text);
      background: radial-gradient(circle at 0% 0%, #dbe7ff 0%, var(--bg) 60%);
    }
    .container { max-width: 1320px; margin: 0 auto; padding: 22px; }
    .hero {
      background: linear-gradient(120deg, var(--hero-a), var(--hero-b));
      color: white;
      border-radius: 16px;
      padding: 22px 24px;
      box-shadow: 0 12px 24px rgba(16, 42, 67, 0.2);
    }
    h1 { margin: 0 0 10px; font-size: 28px; }
    .meta { font-size: 14px; line-height: 1.45; opacity: 0.95; }
    .progress-wrap {
      margin-top: 14px;
      height: 12px;
      border-radius: 999px;
      overflow: hidden;
      background: rgba(255,255,255,0.25);
    }
    .progress {
      width: ${progressWidth.toFixed(2)}%;
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #86efac);
    }
    .cards {
      margin-top: 16px;
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 4px 10px rgba(16, 42, 67, 0.06);
    }
    .label {
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .value {
      margin-top: 6px;
      font-size: 24px;
      font-weight: 700;
    }
    .ok { color: var(--ok); }
    .bad { color: var(--bad); }
    .skip { color: var(--skip); }
    .section {
      margin-top: 18px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 4px 10px rgba(16, 42, 67, 0.06);
    }
    .section h2 { margin: 0 0 12px; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td {
      border-bottom: 1px solid #e7eef6;
      padding: 9px 8px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #f8fbff; color: #243b53; }
    .pill {
      display: inline-block;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      padding: 2px 8px;
      color: #fff;
    }
    .pill.ok { background: var(--ok); }
    .pill.bad { background: var(--bad); }
    .pill.skip { background: #97703d; }
    .failure {
      border: 1px solid #f3cccc;
      background: #fff7f7;
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .failure.okbg {
      border-color: #d5eedb;
      background: #f3fff7;
    }
    .failure h3 { margin: 0 0 8px; color: #7a1f1f; }
    .failure pre {
      margin: 8px 0;
      background: #fff;
      border: 1px solid #f0dada;
      border-radius: 8px;
      padding: 8px;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 12px;
      color: #4a1919;
    }
    .links a { color: var(--accent); text-decoration: none; }
    .links a:hover { text-decoration: underline; }
    .missing { color: #8a6d3b; font-weight: 600; }
    .warn {
      margin-top: 12px;
      border: 1px solid #f3d6b8;
      background: #fff8ef;
      color: #7d4b12;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 13px;
    }
    @media (max-width: 900px) {
      h1 { font-size: 24px; }
      .value { font-size: 22px; }
      th, td { font-size: 12px; padding: 8px 6px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <section class="hero">
      <h1>Playwright Test Result Dashboard</h1>
      <div class="meta">Generated: ${escapeHtml(generatedAt)}</div>
      <div class="meta links">Source JSON: ${
        inputJsonHref
          ? `<a href="./${escapeHtml(inputJsonHref)}" target="_blank" rel="noopener"><code>${escapeHtml(
              inputJsonRel
            )}</code></a>`
          : `<code>${escapeHtml(inputJsonRel)}</code>`
      }</div>
      <div class="meta links">Playwright HTML Report: ${
        htmlReportHref
          ? `<a href="./${escapeHtml(htmlReportHref)}" target="_blank" rel="noopener"><code>${escapeHtml(
              htmlReportRel
            )}</code></a>`
          : `<code>${escapeHtml(htmlReportRel || "N/A")}</code>`
      }</div>
      <div class="progress-wrap"><div class="progress"></div></div>
      <div class="meta" style="margin-top: 8px;">Pass Rate: ${summary.passRate.toFixed(2)}%</div>
      ${
        missingAttachmentCount > 0
          ? `<div class="warn">Some attachment files were not found in the current workspace (${missingAttachmentCount}). This usually happens when the dashboard is generated from an older JSON run after newer test runs cleaned <code>test-results</code>.</div>`
          : ""
      }
    </section>

    <section class="cards">
      <div class="card"><div class="label">Total</div><div class="value">${summary.total}</div></div>
      <div class="card"><div class="label">Passed</div><div class="value ok">${summary.passed}</div></div>
      <div class="card"><div class="label">Failed</div><div class="value bad">${summary.failed}</div></div>
      <div class="card"><div class="label">Skipped</div><div class="value skip">${summary.skipped}</div></div>
      <div class="card"><div class="label">Timed Out</div><div class="value bad">${summary.timedOut}</div></div>
      <div class="card"><div class="label">Duration</div><div class="value">${formatDuration(summary.durationMs)}</div></div>
    </section>

    <section class="section">
      <h2>Module Summary</h2>
      <table>
        <thead><tr><th>Module</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Duration</th></tr></thead>
        <tbody>${moduleTableRows}</tbody>
      </table>
    </section>

    <section class="section">
      <h2>Segment Summary</h2>
      <table>
        <thead><tr><th>Segment</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Duration</th></tr></thead>
        <tbody>${segmentTableRows}</tbody>
      </table>
    </section>

    <section class="section">
      <h2>Failed Tests</h2>
      ${failureBlocks}
    </section>

    <section class="section">
      <h2>Test Case Matrix</h2>
      <table>
        <thead><tr><th>#</th><th>Scenario</th><th>Module</th><th>Segment</th><th>Status</th><th>Duration</th><th>Location</th></tr></thead>
        <tbody>${testCaseRows}</tbody>
      </table>
    </section>
  </div>
</body>
</html>`;
}

function buildMarkdown(params) {
  const {
    generatedAt,
    inputJsonRel,
    htmlReportRel,
    missingAttachmentCount,
    summary,
    moduleRows,
    segmentRows,
    failures,
    entries
  } = params;

  const lines = [];
  lines.push("# Test Result Dashboard");
  lines.push("");
  lines.push(`- Generated: ${generatedAt}`);
  lines.push(`- Source JSON: \`${inputJsonRel}\``);
  lines.push(`- Playwright HTML report: \`${htmlReportRel || "N/A"}\``);
  if (missingAttachmentCount > 0) {
    lines.push(
      `- Warning: ${missingAttachmentCount} attachment link(s) are missing in current workspace (likely generated from an older JSON after test-results cleanup).`
    );
  }
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|---|---:|");
  lines.push(`| Total | ${summary.total} |`);
  lines.push(`| Passed | ${summary.passed} |`);
  lines.push(`| Failed | ${summary.failed} |`);
  lines.push(`| Skipped | ${summary.skipped} |`);
  lines.push(`| Timed Out | ${summary.timedOut} |`);
  lines.push(`| Duration | ${formatDuration(summary.durationMs)} |`);
  lines.push(`| Pass Rate | ${summary.passRate.toFixed(2)}% |`);
  lines.push("");

  lines.push("## Module Summary");
  lines.push("");
  lines.push("| Module | Total | Passed | Failed | Skipped | Duration |");
  lines.push("|---|---:|---:|---:|---:|---:|");
  for (const [name, m] of moduleRows) {
    lines.push(`| ${name} | ${m.total} | ${m.passed} | ${m.failed} | ${m.skipped} | ${formatDuration(m.durationMs)} |`);
  }
  lines.push("");

  lines.push("## Segment Summary");
  lines.push("");
  lines.push("| Segment | Total | Passed | Failed | Skipped | Duration |");
  lines.push("|---|---:|---:|---:|---:|---:|");
  for (const [name, m] of segmentRows) {
    lines.push(`| ${name} | ${m.total} | ${m.passed} | ${m.failed} | ${m.skipped} | ${formatDuration(m.durationMs)} |`);
  }
  lines.push("");

  lines.push("## Failed Tests");
  lines.push("");
  if (failures.length === 0) {
    lines.push("- No failed tests.");
    lines.push("");
  } else {
    failures.forEach((f, idx) => {
      lines.push(`### F-${idx + 1} ${f.title}`);
      lines.push(`- Location: \`${f.file}:${f.line}\``);
      lines.push(`- Status: ${statusLabel(f.status)}`);
      lines.push(`- Duration: ${formatDuration(f.durationMs)}`);
      lines.push("- Error:");
      lines.push("```text");
      lines.push(f.errorMessage || "No error text captured.");
      lines.push("```");
      if (f.attachments.length > 0) {
        lines.push("- Attachments:");
        for (const a of f.attachments) {
          if (a.exists && a.dashboardRelPath) {
            lines.push(`- \`${a.name}\`: \`${a.dashboardRelPath}\``);
          } else {
            lines.push(`- \`${a.name}\`: missing in current workspace`);
          }
        }
      }
      lines.push("");
    });
  }

  lines.push("## Test Case Matrix");
  lines.push("");
  lines.push("| # | Scenario | Module | Segment | Status | Duration | Location |");
  lines.push("|---:|---|---|---|---|---:|---|");
  entries.forEach((e, idx) => {
    lines.push(
      `| ${idx + 1} | ${e.title.replace(/\|/g, "\\|")} | ${e.moduleName} | ${e.segment} | ${statusLabel(e.status)} | ${formatDuration(e.durationMs)} | \`${e.file}:${e.line}\` |`
    );
  });
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function main() {
  ensureReportsDir();

  const inputJsonPath = inputArg ? path.resolve(repoRoot, inputArg) : findLatestPlaywrightJson();
  if (!inputJsonPath || !fs.existsSync(inputJsonPath)) {
    console.error("No Playwright JSON report found. Provide a path or run tests with JSON reporter first.");
    process.exit(1);
  }

  const raw = fs.readFileSync(inputJsonPath, "utf8");
  const reportJson = JSON.parse(raw);
  const entries = collectEntries(reportJson);
  const summary = summarize(entries);
  const moduleRows = toRowsFromMap(summarizeBy(entries, (e) => e.moduleName));
  const segmentRows = toRowsFromMap(summarizeBy(entries, (e) => e.segment));
  const failures = entries.filter((e) => e.status !== "passed" && e.status !== "skipped");

  const now = new Date();
  const stamp = formatTimestamp(now);
  const generatedAt = formatDateTime(now);
  const assetsDir = path.join(reportsDir, "dashboard-assets", stamp);
  fs.mkdirSync(assetsDir, { recursive: true });

  let missingAttachmentCount = 0;
  entries.forEach((entry, entryIdx) => {
    entry.attachments = entry.attachments.map((attachment, attIdx) => {
      if (!attachment.absPath || !fs.existsSync(attachment.absPath)) {
        missingAttachmentCount += 1;
        return {
          ...attachment,
          exists: false,
          dashboardRelPath: ""
        };
      }

      const ext = path.extname(attachment.absPath) || "";
      const token = safeToken(attachment.name, `attachment-${attIdx + 1}`);
      const outName = `f${entryIdx + 1}-a${attIdx + 1}-${token}${ext}`;
      const outAbs = path.join(assetsDir, outName);
      fs.copyFileSync(attachment.absPath, outAbs);

      return {
        ...attachment,
        exists: true,
        dashboardRelPath: `dashboard-assets/${stamp}/${outName}`
      };
    });
  });

  const outputHtmlPath = path.join(reportsDir, `test-result-dashboard-${stamp}.html`);
  const outputMdPath = path.join(reportsDir, `test-result-dashboard-${stamp}.md`);
  const latestHtmlPath = path.join(reportsDir, "test-result-dashboard-latest.html");
  const latestMdPath = path.join(reportsDir, "test-result-dashboard-latest.md");

  const inputJsonRel = toRepoRelative(inputJsonPath);
  const inputJsonHref = toReportsRelative(inputJsonPath);
  const htmlReportPath = findLatestPlaywrightHtmlDir();
  const htmlReportRel = htmlReportPath ? toRepoRelative(htmlReportPath) : "";
  const htmlReportHref = htmlReportPath ? toReportsRelative(htmlReportPath) : "";

  const html = buildHtml({
    generatedAt,
    inputJsonRel,
    inputJsonHref,
    htmlReportRel,
    htmlReportHref,
    missingAttachmentCount,
    summary,
    moduleRows,
    segmentRows,
    failures,
    entries
  });

  const markdown = buildMarkdown({
    generatedAt,
    inputJsonRel,
    htmlReportRel,
    missingAttachmentCount,
    summary,
    moduleRows,
    segmentRows,
    failures,
    entries
  });

  fs.writeFileSync(outputHtmlPath, html, "utf8");
  fs.writeFileSync(outputMdPath, markdown, "utf8");
  fs.writeFileSync(latestHtmlPath, html, "utf8");
  fs.writeFileSync(latestMdPath, markdown, "utf8");

  console.log(`Dashboard HTML: ${toRepoRelative(outputHtmlPath)}`);
  console.log(`Dashboard MD: ${toRepoRelative(outputMdPath)}`);
  console.log(`Latest HTML: ${toRepoRelative(latestHtmlPath)}`);
  console.log(`Latest MD: ${toRepoRelative(latestMdPath)}`);
  console.log(`Dashboard Assets: ${toRepoRelative(assetsDir)}`);
  if (missingAttachmentCount > 0) {
    console.log(`Missing attachments: ${missingAttachmentCount}`);
  }
  console.log(
    `Summary: total=${summary.total}, passed=${summary.passed}, failed=${summary.failed}, skipped=${summary.skipped}, timedOut=${summary.timedOut}, passRate=${summary.passRate.toFixed(2)}%`
  );
}

main();
