const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT_DIR = __dirname;
const PORT = Number(process.env.DASHBOARD_PORT || 4173);
const CURRENT_REPORT_PATH = path.join(ROOT_DIR, 'reports', 'execution-report', 'results.json');
const HISTORY_DIR = path.join(ROOT_DIR, 'reports', 'execution-report', 'history');
const STATIC_DASHBOARD_PATH = path.join(ROOT_DIR, 'reports', 'dashboard-static', 'index.html');
const FALLBACK_INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const DEFAULT_INDEX_PATH = fs.existsSync(STATIC_DASHBOARD_PATH) ? STATIC_DASHBOARD_PATH : FALLBACK_INDEX_PATH;

const STATIC_FILES = {
  '/': DEFAULT_INDEX_PATH,
  '/index.html': DEFAULT_INDEX_PATH,
  '/dashboard-static': STATIC_DASHBOARD_PATH,
  '/dashboard-static/index.html': STATIC_DASHBOARD_PATH,
  '/dashboard.css': path.join(ROOT_DIR, 'dashboard.css'),
  '/dashboard.js': path.join(ROOT_DIR, 'dashboard.js')
};

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.log': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip'
};

const SLOW_DURATION_THRESHOLD_MS = 20 * 1000;
const SLOW_LOG_DIR = path.join(ROOT_DIR, 'reports', 'execution-report');
const SLOW_LOG_FILE = path.join(SLOW_LOG_DIR, 'slow-tests.log');
const SLOW_LOG_SIGNATURES = new Set();

const API_REPORT_CACHE = new Map();
const FAILURE_STATUSES = new Set(['failed', 'flaky']);
let XLSX_MODULE;
let PLAYWRIGHT_CHROMIUM;

function getMimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function stripAnsi(input) {
  return String(input || '').replace(/\u001b\[[0-9;]*m/g, '');
}

function cleanText(input) {
  return stripAnsi(input || '').replace(/\r/g, '').trim();
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function toIsoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toRelativePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return '';
  }

  const absolutePath = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(ROOT_DIR, filePath);
  const rootLower = ROOT_DIR.toLowerCase();
  const absoluteLower = absolutePath.toLowerCase();

  if (!absoluteLower.startsWith(rootLower)) {
    return '';
  }

  return path.relative(ROOT_DIR, absolutePath).replace(/\\/g, '/');
}

function formatDurationSeconds(durationMs) {
  const ms = Number(durationMs || 0);
  if (!Number.isFinite(ms) || ms <= 0) {
    return '0s';
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function normalizeLocation(location) {
  if (!location) {
    return null;
  }

  const locationFile = location.file ? toRelativePath(location.file) || location.file : '';
  const locationLine = Number.isFinite(location.line) ? location.line : null;
  const locationColumn = Number.isFinite(location.column) ? location.column : null;

  return {
    file: locationFile,
    line: locationLine,
    column: locationColumn
  };
}

function normalizeStream(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return '';
  }

  return entries
    .map((entry) => {
      if (!entry) {
        return '';
      }
      if (typeof entry === 'string') {
        return stripAnsi(entry);
      }
      if (typeof entry.text === 'string') {
        return stripAnsi(entry.text);
      }
      return '';
    })
    .filter(Boolean)
    .join('')
    .trim();
}

function normalizeErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return [];
  }

  return errors
    .map((errorItem) => cleanText(errorItem && errorItem.message))
    .filter(Boolean);
}

function normalizeAttachment(attachment) {
  if (!attachment || typeof attachment !== 'object') {
    return null;
  }

  const relativePath = toRelativePath(attachment.path);
  const hasRelativePath = Boolean(relativePath);
  const resolvedPath = hasRelativePath ? path.resolve(ROOT_DIR, relativePath) : '';

  return {
    name: attachment.name || 'artifact',
    contentType: attachment.contentType || 'application/octet-stream',
    path: hasRelativePath ? relativePath : '',
    url: hasRelativePath ? `/artifact?file=${encodeURIComponent(relativePath)}` : '',
    exists: hasRelativePath ? fs.existsSync(resolvedPath) : false
  };
}

function normalizeApiCallEntry(call) {
  if (!call || typeof call !== 'object') {
    return null;
  }

  const statusValue = Number.isFinite(call.status) ? call.status : null;

  return {
    kind: call.kind || 'response',
    timestamp: toIsoDate(call.timestamp) || null,
    method: call.method || 'GET',
    url: cleanText(call.url || ''),
    resourceType: call.resourceType || '',
    status: statusValue,
    statusText: cleanText(call.statusText || ''),
    ok: Boolean(call.ok),
    failureText: cleanText(call.failureText || ''),
    requestBodySnippet: cleanText(call.requestBodySnippet || ''),
    responseBodySnippet: cleanText(call.responseBodySnippet || '')
  };
}

function normalizeApiFailureReport(rawReport) {
  if (!rawReport || typeof rawReport !== 'object') {
    return null;
  }

  const failedApiCalls = Array.isArray(rawReport.failedApiCalls)
    ? rawReport.failedApiCalls.map(normalizeApiCallEntry).filter(Boolean).slice(0, 35)
    : [];
  const recentApiCalls = Array.isArray(rawReport.recentApiCalls)
    ? rawReport.recentApiCalls.map(normalizeApiCallEntry).filter(Boolean).slice(-40)
    : [];
  const likelySource = rawReport.analysis && typeof rawReport.analysis.likelySource === 'string'
    ? rawReport.analysis.likelySource
    : (failedApiCalls.length > 0 ? 'backend-or-api' : 'frontend-or-ui');
  const reason = cleanText(rawReport.analysis && rawReport.analysis.reason);
  const totalCaptured = Number.isFinite(rawReport.summary && rawReport.summary.totalCapturedCalls)
    ? rawReport.summary.totalCapturedCalls
    : recentApiCalls.length;
  const failedCount = Number.isFinite(rawReport.summary && rawReport.summary.failedApiCalls)
    ? rawReport.summary.failedApiCalls
    : failedApiCalls.length;

  return {
    generatedAt: toIsoDate(rawReport.generatedAt) || null,
    summary: {
      totalCapturedCalls: totalCaptured,
      failedApiCalls: failedCount,
      recentApiCalls: recentApiCalls.length
    },
    analysis: {
      likelySource,
      reason
    },
    failedApiCalls,
    recentApiCalls
  };
}

function readApiFailureReport(relativePath) {
  if (!relativePath) {
    return null;
  }

  if (API_REPORT_CACHE.has(relativePath)) {
    return API_REPORT_CACHE.get(relativePath);
  }

  const absolutePath = path.resolve(ROOT_DIR, relativePath);
  if (!fs.existsSync(absolutePath)) {
    API_REPORT_CACHE.set(relativePath, null);
    return null;
  }

  const parsed = readJsonFile(absolutePath);
  const normalized = normalizeApiFailureReport(parsed);
  API_REPORT_CACHE.set(relativePath, normalized);
  return normalized;
}

function extractApiFailureReportFromAttachments(attachments) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return null;
  }

  for (const attachment of attachments) {
    if (!attachment || !attachment.path) {
      continue;
    }

    const attachmentLabel = `${attachment.name || ''} ${attachment.path}`.toLowerCase();
    const isApiReport = attachmentLabel.includes('api-failure-report') || attachment.path.toLowerCase().endsWith('.json');
    if (!isApiReport) {
      continue;
    }

    const parsed = readApiFailureReport(attachment.path);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function extractHighlightedCodeLine(snippet) {
  if (!snippet) {
    return '';
  }

  const cleanedLines = stripAnsi(snippet).split('\n');
  for (const line of cleanedLines) {
    if (line.includes('>') && line.includes('|')) {
      const markerIndex = line.indexOf('|');
      if (markerIndex >= 0) {
        return line.slice(markerIndex + 1).trim();
      }
    }
  }
  return '';
}

function extractProbableElement(text, snippet) {
  const mergedText = [text, extractHighlightedCodeLine(snippet)].filter(Boolean).join('\n');
  const patterns = [
    /locator\(([^)]+)\)/i,
    /getByRole\(([^)]+)\)/i,
    /getByText\(([^)]+)\)/i,
    /getByTestId\(([^)]+)\)/i,
    /page\.click\(([^)]+)\)/i,
    /page\.fill\(([^)]+)\)/i,
    /page\.goto\(([^)]+)\)/i,
    /(https?:\/\/[^\s"')]+)/i
  ];

  for (const pattern of patterns) {
    const match = mergedText.match(pattern);
    if (match) {
      const raw = (match[1] || match[0] || '').trim();
      if (!raw) {
        continue;
      }
      return raw.replace(/^['"`]/, '').replace(/['"`]$/, '').slice(0, 240);
    }
  }

  return '';
}

function buildFailureInsights(lastAttempt, spec, testEntry, apiFailureReport) {
  if (!lastAttempt) {
    return null;
  }

  const combinedErrorText = [
    lastAttempt.primaryError,
    lastAttempt.errorStack,
    lastAttempt.snippet
  ]
    .filter(Boolean)
    .join('\n');
  const lower = combinedErrorText.toLowerCase();
  let category = 'Unhandled failure';
  let probableFailedElement = extractProbableElement(combinedErrorText, lastAttempt.snippet);
  let improvementSuggestions = [
    'Capture explicit checkpoints around the failing action to isolate where state diverges.',
    'Add deterministic test data and cleanup so each run starts from the same baseline.',
    'Log locator state and network details around the failing step for faster triage.'
  ];
  let likelySource = (apiFailureReport && apiFailureReport.analysis && apiFailureReport.analysis.likelySource)
    ? apiFailureReport.analysis.likelySource
    : 'frontend-or-ui';

  if (lower.includes('ismobile is not supported in firefox')) {
    category = 'Project configuration mismatch';
    probableFailedElement = probableFailedElement || 'Browser context setup (isMobile with Firefox)';
    improvementSuggestions = [
      'Remove mobile emulation flags from Firefox projects because Playwright Firefox does not support `isMobile`.',
      'Keep mobile coverage in Chromium/WebKit and run Firefox as desktop-only.',
      'Guard browser-specific options in `playwright.config.ts` to prevent incompatible contexts.'
    ];
  } else if (
    lower.includes('err_network') ||
    lower.includes('network_io') ||
    lower.includes('econn') ||
    lower.includes('enotfound') ||
    lower.includes('net::')
  ) {
    category = 'Network instability';
    probableFailedElement = probableFailedElement || 'Navigation/API dependency';
    improvementSuggestions = [
      'Add retry logic only around network-dependent setup steps, not around assertions.',
      'Wait for specific API responses or stable UI markers before continuing actions.',
      'Record API status codes and response timing in logs to separate app vs environment failures.'
    ];
  } else if (lower.includes('timeout') || lower.includes('timed out')) {
    category = 'Timeout or synchronization issue';
    probableFailedElement = probableFailedElement || 'UI state synchronization';
    improvementSuggestions = [
      'Replace fixed waits with condition-based waits (element visible, enabled, stable).',
      'Use robust locator strategies and avoid brittle positional selectors.',
      'Break long user journeys into shorter assertions to pinpoint the exact blocking step.'
    ];
  } else if (
    lower.includes('not visible') ||
    lower.includes('strict mode violation') ||
    lower.includes('tobevisible') ||
    lower.includes('no node found')
  ) {
    category = 'Element locator or visibility failure';
    probableFailedElement = probableFailedElement || 'Target UI locator';
    improvementSuggestions = [
      'Switch to semantic locators (`getByRole`, `getByLabel`, `getByTestId`) with stable attributes.',
      'Assert element visibility before click/fill and add scroll/viewport handling for mobile cases.',
      'Review dynamic overlays or loaders that might block the element at interaction time.'
    ];
  } else if (
    lower.includes('expect(') ||
    lower.includes('assertionerror') ||
    lower.includes('toequal') ||
    lower.includes('tohavetext') ||
    lower.includes('tohaveurl')
  ) {
    category = 'Assertion mismatch';
    probableFailedElement = probableFailedElement || 'Expected output assertion';
    improvementSuggestions = [
      'Verify expected values against current product behavior and environment configuration.',
      'Use partial/regex assertions for dynamic text where complete exact match is unstable.',
      'Capture intermediate state in logs so assertion failures include actionable context.'
    ];
  }

  const failedApiCount = apiFailureReport && apiFailureReport.summary
    ? Number(apiFailureReport.summary.failedApiCalls || 0)
    : 0;
  if (failedApiCount > 0 && category !== 'Project configuration mismatch') {
    likelySource = 'backend-or-api';
    category = 'Backend/API failure';
    probableFailedElement = probableFailedElement || 'API endpoint or backend response';
    improvementSuggestions = [
      'Inspect failed API response payload, status code, and validation message from the API report section.',
      'Validate backend contract/schema for this endpoint against current UI expectation.',
      'Add API mocks or contract checks to isolate backend failures from frontend rendering issues.'
    ];
  }

  if (!probableFailedElement) {
    probableFailedElement = spec && spec.title ? `Scenario: ${spec.title}` : 'Unable to infer element';
  }

  const fallbackLocation = {
    file: toRelativePath(spec && spec.file),
    line: Number.isFinite(spec && spec.line) ? spec.line : null,
    column: Number.isFinite(spec && spec.column) ? spec.column : null
  };

  return {
    category,
    probableFailedElement,
    improvementSuggestions,
    errorExcerpt: (lastAttempt.primaryError || '').slice(0, 360),
    location: lastAttempt.location || fallbackLocation,
    testStatus: testEntry.status || 'unknown',
    likelySource,
    failedApiCalls: failedApiCount
  };
}

function normalizeCaseStatus(playwrightStatus, lastAttemptStatus, expectedStatus) {
  if (playwrightStatus === 'flaky') {
    return 'flaky';
  }
  if (playwrightStatus === 'unexpected') {
    return 'failed';
  }
  if (playwrightStatus === 'skipped') {
    return 'skipped';
  }
  if (playwrightStatus === 'expected') {
    if (expectedStatus === 'passed') {
      return 'passed';
    }
    return lastAttemptStatus === 'passed' ? 'failed' : 'passed';
  }
  if (lastAttemptStatus === 'passed') {
    return 'passed';
  }
  if (lastAttemptStatus === 'skipped') {
    return 'skipped';
  }
  return 'failed';
}

function visitSuiteTree(suite, lineage, onSpec) {
  const nextLineage = suite && suite.title ? lineage.concat(suite.title) : lineage;
  const specs = (suite && Array.isArray(suite.specs)) ? suite.specs : [];
  const nestedSuites = (suite && Array.isArray(suite.suites)) ? suite.suites : [];

  for (const spec of specs) {
    onSpec(spec, nextLineage, suite);
  }

  for (const childSuite of nestedSuites) {
    visitSuiteTree(childSuite, nextLineage, onSpec);
  }
}

function extractCasesFromReport(report, runMeta) {
  const reportSuites = Array.isArray(report.suites) ? report.suites : [];
  const extractedCases = [];

  for (const topSuite of reportSuites) {
    visitSuiteTree(topSuite, [], (spec, lineage, suite) => {
      const testEntries = Array.isArray(spec.tests) ? spec.tests : [];
      const suiteTitle = lineage.filter(Boolean).join(' > ');

      for (const testEntry of testEntries) {
        const caseFile = toRelativePath(spec.file) || toRelativePath(suite && suite.file) || spec.file || '';
        const moduleName = normalizeModuleName(inferModuleNameFromFilePath(caseFile));
        const attempts = Array.isArray(testEntry.results)
          ? testEntry.results.map((result, index) => {
              const errorMessages = normalizeErrors(result.errors);
              const primaryError = cleanText(
                (result.error && result.error.message) || errorMessages[0] || ''
              );
              const attachments = Array.isArray(result.attachments)
                ? result.attachments.map(normalizeAttachment).filter(Boolean)
                : [];
              const apiFailureReport = extractApiFailureReportFromAttachments(attachments);

              return {
                id: `${runMeta.runId}::${spec.id || spec.title || 'spec'}::${testEntry.projectName || testEntry.projectId || 'project'}::attempt-${index}`,
                status: result.status || 'unknown',
                retry: Number.isFinite(result.retry) ? result.retry : index,
                durationMs: Number.isFinite(result.duration) ? result.duration : 0,
                startTime: toIsoDate(result.startTime) || runMeta.startTime,
                workerIndex: Number.isFinite(result.workerIndex) ? result.workerIndex : null,
                parallelIndex: Number.isFinite(result.parallelIndex) ? result.parallelIndex : null,
                stdout: normalizeStream(result.stdout),
                stderr: normalizeStream(result.stderr),
                errorMessages,
                primaryError,
                errorStack: cleanText(result.error && result.error.stack),
                snippet: cleanText(result.error && result.error.snippet),
                location: normalizeLocation(
                  (result.error && result.error.location) || result.errorLocation || (result.errors && result.errors[0] && result.errors[0].location)
                ),
                annotations: Array.isArray(result.annotations) ? result.annotations : [],
                attachments,
                apiFailureReport
              };
            })
          : [];
        const lastAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;
        const apiFailureCount = attempts.reduce((count, attempt) => {
          const current = attempt.apiFailureReport && attempt.apiFailureReport.summary
            ? Number(attempt.apiFailureReport.summary.failedApiCalls || 0)
            : 0;
          return count + current;
        }, 0);
        const latestApiFailureReport = [...attempts]
          .reverse()
          .find((attempt) => attempt.apiFailureReport)
          ?.apiFailureReport || null;
        const normalizedStatus = normalizeCaseStatus(
          testEntry.status,
          lastAttempt ? lastAttempt.status : '',
          testEntry.expectedStatus || 'passed'
        );
        const failureInsights = (normalizedStatus === 'failed' || normalizedStatus === 'flaky')
          ? buildFailureInsights(lastAttempt, spec, testEntry, latestApiFailureReport)
          : null;
        const likelyBugSource = latestApiFailureReport && latestApiFailureReport.analysis
          ? latestApiFailureReport.analysis.likelySource
          : (failureInsights && failureInsights.likelySource ? failureInsights.likelySource : 'frontend-or-ui');
        const caseId = [
          runMeta.runId,
          spec.id || spec.title || 'spec',
          testEntry.projectName || testEntry.projectId || 'project'
        ].join('::');

        const durationMs = attempts.reduce((total, attempt) => total + attempt.durationMs, 0);
        extractedCases.push({
          id: caseId,
          runId: runMeta.runId,
          runStartTime: runMeta.startTime,
          runSource: runMeta.sourceRelativePath,
          suiteTitle,
          testTitle: spec.title || 'Untitled test',
          fullTitle: suiteTitle ? `${suiteTitle} > ${spec.title || 'Untitled test'}` : (spec.title || 'Untitled test'),
          file: caseFile,
          moduleName,
          line: Number.isFinite(spec.line) ? spec.line : null,
          column: Number.isFinite(spec.column) ? spec.column : null,
          projectName: testEntry.projectName || testEntry.projectId || 'Unknown project',
          projectId: testEntry.projectId || testEntry.projectName || 'unknown',
          expectedStatus: testEntry.expectedStatus || 'passed',
          playwrightStatus: testEntry.status || 'unknown',
          status: normalizedStatus,
          timeoutMs: Number.isFinite(testEntry.timeout) ? testEntry.timeout : null,
          durationMs,
          isSlow: durationMs > SLOW_DURATION_THRESHOLD_MS,
          attemptCount: attempts.length,
          lastAttemptStatus: lastAttempt ? lastAttempt.status : 'unknown',
          lastErrorMessage: lastAttempt ? lastAttempt.primaryError : '',
          likelyBugSource,
          apiFailureCount,
          latestApiFailureReport,
          hasLogs: attempts.some((attempt) => Boolean(attempt.stdout || attempt.stderr)),
          hasArtifacts: attempts.some((attempt) => attempt.attachments.length > 0),
          attempts,
          failureInsights
        });
      }
    });
  }

  return extractedCases;
}

function buildSummary(cases) {
  const summary = {
    total: cases.length,
    passed: 0,
    failed: 0,
    flaky: 0,
    skipped: 0,
    attempts: 0,
    totalDurationMs: 0,
    averageDurationMs: 0,
    passRate: 0
  };

  for (const testCase of cases) {
    if (summary[testCase.status] !== undefined) {
      summary[testCase.status] += 1;
    }
    summary.attempts += testCase.attemptCount || 0;
    summary.totalDurationMs += testCase.durationMs || 0;
  }

  if (summary.total > 0) {
    summary.averageDurationMs = Math.round(summary.totalDurationMs / summary.total);
    const passBase = Math.max(summary.total - summary.skipped, 1);
    summary.passRate = Number(((summary.passed / passBase) * 100).toFixed(2));
  }

  return summary;
}

function buildSlowCaseSummary(cases) {
  const slowCases = (Array.isArray(cases) ? cases : [])
    .filter((testCase) => Number(testCase.durationMs || 0) > SLOW_DURATION_THRESHOLD_MS)
    .sort((left, right) => (right.durationMs || 0) - (left.durationMs || 0));

  return {
    thresholdMs: SLOW_DURATION_THRESHOLD_MS,
    total: slowCases.length,
    cases: slowCases.slice(0, 24).map((testCase) => ({
      id: testCase.id,
      runId: testCase.runId,
      runStartTime: testCase.runStartTime,
      moduleName: getCaseModuleName(testCase),
      projectName: testCase.projectName || '',
      testTitle: testCase.testTitle || '',
      fullTitle: testCase.fullTitle || '',
      durationMs: Number(testCase.durationMs || 0),
      file: testCase.file || ''
    }))
  };
}

function recordSlowRunCases(runMeta, runCases) {
  if (!runMeta || runMeta.reportPath !== CURRENT_REPORT_PATH) {
    return;
  }

  const slowCases = (Array.isArray(runCases) ? runCases : [])
    .filter((testCase) => Number(testCase.durationMs || 0) > SLOW_DURATION_THRESHOLD_MS);

  if (slowCases.length === 0) {
    return;
  }

  const signature = `${runMeta.runId}|${runMeta.startTime || 'unknown'}`;
  if (SLOW_LOG_SIGNATURES.has(signature)) {
    return;
  }
  SLOW_LOG_SIGNATURES.add(signature);

  fs.mkdirSync(SLOW_LOG_DIR, { recursive: true });
  const header = `=== Slow cases detected for ${runMeta.runId} (${formatDateTimeForExport(runMeta.startTime) || 'Unknown time'}) ===`;
  const entries = slowCases.map((testCase) => {
    const durationText = formatDurationSeconds(testCase.durationMs);
    const moduleName = getCaseModuleName(testCase) || 'Unknown module';
    const title = cleanText(testCase.fullTitle || testCase.testTitle || 'Unnamed test');
    const fileRef = buildFileReference(testCase.file, testCase.line, testCase.column);
    return `${durationText} | ${moduleName} | ${title} | ${fileRef}`;
  });

  try {
    fs.appendFileSync(SLOW_LOG_FILE, `${header}\n${entries.join('\n')}\n\n`, 'utf8');
  } catch (error) {
    // Ignore logging failures to keep dashboard responsive.
  }
}

function isoWeek(date) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - (utcDate.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
  return {
    year: utcDate.getUTCFullYear(),
    week: weekNumber
  };
}

function buildWeeklyTrend(cases) {
  const grouped = new Map();

  for (const testCase of cases) {
    const runDate = new Date(testCase.runStartTime);
    if (Number.isNaN(runDate.getTime())) {
      continue;
    }

    const weekInfo = isoWeek(runDate);
    const key = `${weekInfo.year}-W${String(weekInfo.week).padStart(2, '0')}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        year: weekInfo.year,
        week: weekInfo.week,
        label: `W${String(weekInfo.week).padStart(2, '0')} ${weekInfo.year}`,
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0,
        total: 0
      });
    }

    const bucket = grouped.get(key);
    bucket.total += 1;
    if (bucket[testCase.status] !== undefined) {
      bucket[testCase.status] += 1;
    }
  }

  return Array.from(grouped.values())
    .sort((left, right) => (left.year * 100 + left.week) - (right.year * 100 + right.week))
    .slice(-12);
}

function buildPeriodOptions(cases) {
  const periods = {
    day: new Map(),
    week: new Map(),
    month: new Map(),
    year: new Map()
  };

  for (const testCase of cases) {
    const runDate = new Date(testCase.runStartTime);
    if (Number.isNaN(runDate.getTime())) {
      continue;
    }

    const dayKey = runDate.toISOString().slice(0, 10);
    const monthKey = runDate.toISOString().slice(0, 7);
    const yearKey = String(runDate.getUTCFullYear());
    const weekInfo = isoWeek(runDate);
    const weekKey = `${weekInfo.year}-W${String(weekInfo.week).padStart(2, '0')}`;
    const periodValues = { day: dayKey, week: weekKey, month: monthKey, year: yearKey };

    for (const periodName of Object.keys(periods)) {
      const map = periods[periodName];
      const key = periodValues[periodName];

      if (!map.has(key)) {
        map.set(key, {
          key,
          count: 0
        });
      }
      map.get(key).count += 1;
    }
  }

  const serialize = (periodName, map) => {
    const values = Array.from(map.values());
    if (periodName === 'week') {
      return values.sort((left, right) => {
        const [leftYear, leftWeek] = left.key.split('-W').map(Number);
        const [rightYear, rightWeek] = right.key.split('-W').map(Number);
        return (rightYear * 100 + rightWeek) - (leftYear * 100 + leftWeek);
      });
    }
    return values.sort((left, right) => right.key.localeCompare(left.key));
  };

  return {
    day: serialize('day', periods.day),
    week: serialize('week', periods.week),
    month: serialize('month', periods.month),
    year: serialize('year', periods.year)
  };
}

function loadReports() {
  const candidateFiles = [];

  if (fs.existsSync(HISTORY_DIR)) {
    const historyFiles = fs
      .readdirSync(HISTORY_DIR)
      .filter((fileName) => fileName.toLowerCase().endsWith('.json'))
      .sort()
      .map((fileName) => path.join(HISTORY_DIR, fileName));
    candidateFiles.push(...historyFiles);
  }

  if (fs.existsSync(CURRENT_REPORT_PATH)) {
    candidateFiles.push(CURRENT_REPORT_PATH);
  }

  const uniqueRuns = new Map();
  for (const reportPath of candidateFiles) {
    const report = readJsonFile(reportPath);
    if (!report) {
      continue;
    }

    const startTime = toIsoDate(report.stats && report.stats.startTime)
      || toIsoDate(fs.statSync(reportPath).mtime)
      || new Date().toISOString();
    const signature = [
      startTime,
      report.stats && report.stats.duration,
      report.stats && report.stats.expected,
      report.stats && report.stats.unexpected,
      report.stats && report.stats.flaky
    ].join('|');
    const sourceRelativePath = path.relative(ROOT_DIR, reportPath).replace(/\\/g, '/');
    const existing = uniqueRuns.get(signature);

    if (!existing || reportPath === CURRENT_REPORT_PATH) {
      uniqueRuns.set(signature, {
        reportPath,
        sourceRelativePath,
        report,
        startTime
      });
    }
  }

  return Array.from(uniqueRuns.values())
    .sort((left, right) => new Date(left.startTime) - new Date(right.startTime))
    .map((entry, index) => ({
      ...entry,
      runId: `run-${String(index + 1).padStart(3, '0')}`
    }));
}

function buildDashboardData() {
  API_REPORT_CACHE.clear();
  const loadedRuns = loadReports();
  const allCases = [];
  const runs = [];

  for (const loadedRun of loadedRuns) {
    const runCases = extractCasesFromReport(loadedRun.report, loadedRun);
    recordSlowRunCases(loadedRun, runCases);
    const runSummary = buildSummary(runCases);
    const stats = loadedRun.report.stats || {};
    runs.push({
      runId: loadedRun.runId,
      source: loadedRun.sourceRelativePath,
      startTime: loadedRun.startTime,
      durationMs: Number.isFinite(stats.duration) ? Math.round(stats.duration) : runSummary.totalDurationMs,
      expected: Number.isFinite(stats.expected) ? stats.expected : runSummary.passed,
      unexpected: Number.isFinite(stats.unexpected) ? stats.unexpected : runSummary.failed,
      flaky: Number.isFinite(stats.flaky) ? stats.flaky : runSummary.flaky,
      skipped: Number.isFinite(stats.skipped) ? stats.skipped : runSummary.skipped,
      summary: runSummary
    });
    allCases.push(...runCases);
  }

  allCases.sort((left, right) => {
    const leftTime = new Date(left.runStartTime).getTime();
    const rightTime = new Date(right.runStartTime).getTime();
    return rightTime - leftTime;
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: buildSummary(allCases),
    runCount: runs.length,
    runs,
    weeklyTrend: buildWeeklyTrend(allCases),
    periodOptions: buildPeriodOptions(allCases),
    thresholdMs: SLOW_DURATION_THRESHOLD_MS,
    slowCaseSummary: buildSlowCaseSummary(allCases),
    cases: allCases
  };
}

function tryLoadXlsx() {
  if (XLSX_MODULE !== undefined) {
    return XLSX_MODULE;
  }

  try {
    XLSX_MODULE = require('xlsx');
  } catch {
    XLSX_MODULE = null;
  }

  return XLSX_MODULE;
}

function tryLoadPlaywrightChromium() {
  if (PLAYWRIGHT_CHROMIUM !== undefined) {
    return PLAYWRIGHT_CHROMIUM;
  }

  try {
    const playwrightTest = require('@playwright/test');
    PLAYWRIGHT_CHROMIUM = playwrightTest && playwrightTest.chromium
      ? playwrightTest.chromium
      : null;
  } catch {
    PLAYWRIGHT_CHROMIUM = null;
  }

  return PLAYWRIGHT_CHROMIUM;
}

function parseBooleanFlag(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function normalizeSuiteName(value) {
  const cleaned = cleanText(value || '');
  return cleaned || 'General';
}

function inferModuleNameFromFilePath(filePath) {
  const normalizedPath = cleanText(filePath || '').replace(/\\/g, '/');
  if (!normalizedPath) {
    return '';
  }

  const segments = normalizedPath.split('/').filter(Boolean);
  if (segments.length >= 2) {
    const parentFolder = cleanText(segments[segments.length - 2] || '');
    if (parentFolder && !parentFolder.includes('.')) {
      return parentFolder;
    }
  }

  const fileName = cleanText(segments[segments.length - 1] || '');
  if (!fileName) {
    return '';
  }

  return fileName
    .replace(/\.(spec|test)\.[^.]+$/i, '')
    .replace(/\.[^.]+$/i, '')
    .trim();
}

function normalizeModuleName(value) {
  const cleaned = cleanText(value || '');
  return cleaned || 'Unmapped Module';
}

function getCaseModuleName(testCase) {
  if (!testCase || typeof testCase !== 'object') {
    return 'Unmapped Module';
  }

  const explicit = cleanText(testCase.moduleName || '');
  if (explicit) {
    return explicit;
  }

  return normalizeModuleName(inferModuleNameFromFilePath(testCase.file));
}

function toReadableWords(value) {
  return cleanText(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSentenceCase(value) {
  const text = cleanText(value || '');
  if (!text) {
    return '';
  }
  return `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

function buildTestCaseDescription(testCase) {
  if (!testCase || typeof testCase !== 'object') {
    return 'No description available';
  }

  const suiteTitle = toReadableWords(testCase.suiteTitle || '');
  const testTitle = toReadableWords(testCase.testTitle || '');
  const scenarioSource = testTitle || suiteTitle || toReadableWords(getCaseModuleName(testCase));
  const scenario = cleanText(scenarioSource)
    .replace(/^(verify that|to check that|check that|verify|check|should)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!scenario) {
    return 'No description available';
  }

  return `Verify that ${toSentenceCase(scenario)}`;
}

function buildFileReference(filePath, line, column) {
  const normalizedPath = cleanText(filePath || '').replace(/\\/g, '/');
  const linePart = Number.isFinite(line) ? `:${line}` : '';
  const columnPart = Number.isFinite(column) ? `:${column}` : '';
  if (!normalizedPath) {
    return `Unknown file${linePart}${columnPart}`;
  }
  return `${normalizedPath}${linePart}${columnPart}`;
}

function formatDateTimeForExport(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString();
}

function normalizeStatusFilter(searchParams) {
  if (!searchParams.has('statuses')) {
    return null;
  }

  const raw = String(searchParams.get('statuses') || '');
  const allowed = new Set(['passed', 'failed', 'flaky', 'skipped']);
  const values = raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => allowed.has(item));

  return new Set(values);
}

function matchesSearchFilter(testCase, searchText) {
  if (!searchText) {
    return true;
  }

  const latestApiReason = testCase.latestApiFailureReport
    && testCase.latestApiFailureReport.analysis
    && testCase.latestApiFailureReport.analysis.reason
    ? testCase.latestApiFailureReport.analysis.reason
    : '';
  const haystack = [
    testCase.testTitle,
    testCase.fullTitle,
    getCaseModuleName(testCase),
    testCase.suiteTitle,
    testCase.file,
    testCase.projectName,
    testCase.projectId,
    testCase.lastErrorMessage,
    testCase.likelyBugSource,
    testCase.failureInsights && testCase.failureInsights.category,
    testCase.failureInsights && testCase.failureInsights.probableFailedElement,
    latestApiReason
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(searchText);
}

function filterCasesForExport(allCases, searchParams) {
  const currentRunId = cleanText(searchParams.get('currentRunId') || 'all') || 'all';
  const searchText = cleanText(searchParams.get('search') || '').toLowerCase();
  const moduleFilter = cleanText(searchParams.get('module') || searchParams.get('suite') || 'all') || 'all';
  const browserFilter = cleanText(searchParams.get('browser') || 'all') || 'all';
  const statusFilter = normalizeStatusFilter(searchParams);

  let scopedCases = [];
  if (currentRunId === 'all') {
    scopedCases = [...allCases];
  } else {
    scopedCases = allCases.filter((testCase) => testCase.runId === currentRunId);
  }

  const filtered = scopedCases.filter((testCase) => {
    if (moduleFilter !== 'all' && getCaseModuleName(testCase) !== moduleFilter) {
      return false;
    }

    const browser = cleanText(testCase.projectName || 'Unknown project');
    if (browserFilter !== 'all' && browser !== browserFilter) {
      return false;
    }

    if (!matchesSearchFilter(testCase, searchText)) {
      return false;
    }

    if (statusFilter) {
      if (statusFilter.size === 0) {
        return false;
      }
      if (!statusFilter.has(testCase.status)) {
        return false;
      }
    }

    return true;
  });

  const statusOrder = {
    failed: 0,
    flaky: 1,
    passed: 2,
    skipped: 3
  };

  filtered.sort((left, right) => {
    const leftPriority = statusOrder[left.status] ?? 99;
    const rightPriority = statusOrder[right.status] ?? 99;
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftTime = new Date(left.runStartTime).getTime();
    const rightTime = new Date(right.runStartTime).getTime();
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return String(left.testTitle || '').localeCompare(String(right.testTitle || ''));
  });

  return {
    filteredCases: filtered,
    context: {
      currentRunId,
      search: searchText,
      module: moduleFilter,
      suite: moduleFilter,
      browser: browserFilter,
      statuses: statusFilter ? Array.from(statusFilter).join(',') : 'all'
    }
  };
}

function buildExportContextLabels(payload, context) {
  const runs = Array.isArray(payload.runs) ? payload.runs : [];
  const runMap = new Map(runs.map((run) => [run.runId, run]));
  const current = runMap.get(context.currentRunId);

  const formatRun = (run, fallback) => {
    if (!run) {
      return fallback || '';
    }
    return `${run.runId} | ${formatDateTimeForExport(run.startTime)}`;
  };

  return {
    currentRunLabel: context.currentRunId === 'all'
      ? 'All Runs'
      : formatRun(current, context.currentRunId)
  };
}

function buildWorkbookBuffer(payload, filteredCases, context) {
  const XLSX = tryLoadXlsx();
  if (!XLSX) {
    throw new Error('xlsx module is not available. Run npm install before exporting.');
  }

  const summary = buildSummary(filteredCases);
  const contextLabels = buildExportContextLabels(payload, context);
  const workbook = XLSX.utils.book_new();

  const summaryRows = [{
    GeneratedAt: formatDateTimeForExport(payload.generatedAt),
    CurrentRun: contextLabels.currentRunLabel,
    Search: context.search || '',
    ModuleFilter: context.module || context.suite || 'all',
    BrowserFilter: context.browser || 'all',
    StatusFilter: context.statuses || 'all',
    TotalTests: summary.total,
    Passed: summary.passed,
    Failed: summary.failed,
    Flaky: summary.flaky,
    Skipped: summary.skipped,
    PassRate: Number(summary.passRate.toFixed(2)),
    AverageDurationMs: summary.averageDurationMs,
    TotalDurationMs: summary.totalDurationMs
  }];

  const testCaseRows = filteredCases.map((testCase) => ({
    RunId: testCase.runId || '',
    RunStartTime: formatDateTimeForExport(testCase.runStartTime),
    TestCase: testCase.testTitle || '',
    Description: buildTestCaseDescription(testCase),
    FullTitle: testCase.fullTitle || '',
    Module: getCaseModuleName(testCase),
    Suite: normalizeSuiteName(testCase.suiteTitle),
    Browser: testCase.projectName || '',
    Status: testCase.status || '',
    Attempts: Number(testCase.attemptCount || 0),
    DurationMs: Number(testCase.durationMs || 0),
    TimeoutMs: Number(testCase.timeoutMs || 0),
    FailedApiCalls: Number(testCase.apiFailureCount || 0),
    LikelySource: testCase.likelyBugSource || '',
    FileRef: buildFileReference(testCase.file, testCase.line, testCase.column),
    LastError: cleanText(testCase.lastErrorMessage || '')
  }));

  const failedDetailsRows = filteredCases
    .filter((testCase) => FAILURE_STATUSES.has(testCase.status))
    .map((testCase) => {
      const insights = testCase.failureInsights || {};
      const suggestions = Array.isArray(insights.improvementSuggestions)
        ? insights.improvementSuggestions.join(' | ')
        : '';

      return {
        RunId: testCase.runId || '',
        TestCase: testCase.testTitle || '',
        Module: getCaseModuleName(testCase),
        Project: testCase.projectName || '',
        Status: testCase.status || '',
        FailureCategory: insights.category || '',
        ProbableFailedElement: insights.probableFailedElement || '',
        LikelySource: insights.likelySource || testCase.likelyBugSource || '',
        FailureLocation: insights.location
          ? buildFileReference(insights.location.file, insights.location.line, insights.location.column)
          : buildFileReference(testCase.file, testCase.line, testCase.column),
        FailedApiCalls: Number(testCase.apiFailureCount || 0),
        LastError: cleanText(testCase.lastErrorMessage || ''),
        Suggestions: suggestions
      };
    });

  const apiFailureRows = [];
  for (const testCase of filteredCases) {
    const attempts = Array.isArray(testCase.attempts) ? testCase.attempts : [];
    for (let index = 0; index < attempts.length; index += 1) {
      const attempt = attempts[index];
      if (!attempt || !attempt.apiFailureReport) {
        continue;
      }

      const report = attempt.apiFailureReport;
      const failedCalls = Array.isArray(report.failedApiCalls) ? report.failedApiCalls : [];

      if (failedCalls.length === 0) {
        apiFailureRows.push({
          RunId: testCase.runId || '',
          TestCase: testCase.testTitle || '',
          Module: getCaseModuleName(testCase),
          Project: testCase.projectName || '',
          Attempt: index + 1,
          AttemptStatus: attempt.status || '',
          Method: '',
          Url: '',
          Result: 'No failed API call captured',
          LikelySource: report.analysis && report.analysis.likelySource
            ? report.analysis.likelySource
            : '',
          Reason: report.analysis && report.analysis.reason ? report.analysis.reason : '',
          ResponseSnippet: ''
        });
        continue;
      }

      for (const call of failedCalls) {
        const result = call.status === null || call.status === undefined
          ? `REQ_FAILED ${cleanText(call.failureText || '')}`.trim()
          : `HTTP ${call.status} ${cleanText(call.statusText || '')}`.trim();
        apiFailureRows.push({
          RunId: testCase.runId || '',
          TestCase: testCase.testTitle || '',
          Module: getCaseModuleName(testCase),
          Project: testCase.projectName || '',
          Attempt: index + 1,
          AttemptStatus: attempt.status || '',
          Method: cleanText(call.method || 'GET'),
          Url: cleanText(call.url || ''),
          Result: result,
          LikelySource: report.analysis && report.analysis.likelySource
            ? report.analysis.likelySource
            : '',
          Reason: report.analysis && report.analysis.reason ? report.analysis.reason : '',
          ResponseSnippet: cleanText(call.responseBodySnippet || call.requestBodySnippet || call.failureText || '')
        });
      }
    }
  }

  const ensureRows = (rows, message) => rows.length > 0 ? rows : [{ Message: message }];
  const appendSheet = (name, rows, emptyMessage) => {
    const sheet = XLSX.utils.json_to_sheet(ensureRows(rows, emptyMessage));
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  };

  appendSheet('Summary', summaryRows, 'No summary data');
  appendSheet('TestCases', testCaseRows, 'No test case rows for current filters');
  appendSheet('FailedDetails', failedDetailsRows, 'No failed test rows for current filters');
  appendSheet('ApiFailures', apiFailureRows, 'No API failure rows for current filters');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}

function escapeHtmlForPdf(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PDF_STATUS_LABELS = Object.freeze({
  passed: 'Passed',
  failed: 'Failed',
  flaky: 'Partial pass',
  skipped: 'Skipped'
});

function getStatusKey(status) {
  const raw = cleanText(status || '').toLowerCase();
  const normalized = raw.replace(/[^a-z0-9]+/g, '-');
  return normalized || 'unknown';
}

function getPdfStatusLabel(status) {
  if (!status) {
    return 'Unknown';
  }

  const normalized = String(status).trim();
  if (!normalized) {
    return 'Unknown';
  }

  return PDF_STATUS_LABELS[normalized.toLowerCase()] || normalized;
}

function compactExportText(value, maxLength) {
  const cleaned = cleanText(value || '');
  if (!maxLength || cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, Math.max(maxLength - 1, 0))}...`;
}

function readLatestAttemptResult(testCase) {
  const attempts = Array.isArray(testCase && testCase.attempts) ? testCase.attempts : [];
  const lastAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;

  if (!lastAttempt) {
    return cleanText(testCase && testCase.status) || '-';
  }

  const lastStatus = cleanText(lastAttempt.status || '');
  const primaryError = cleanText(lastAttempt.primaryError || '');
  if (primaryError) {
    return primaryError;
  }

  const stderr = cleanText(lastAttempt.stderr || '');
  if (stderr) {
    return stderr;
  }

  const stdout = cleanText(lastAttempt.stdout || '');
  if (stdout) {
    return stdout;
  }

  return lastStatus || cleanText(testCase && testCase.status) || '-';
}

function buildTestCaseRowsForPdf(filteredCases) {
  return filteredCases.map((testCase) => {
    const durationMs = Number(testCase.durationMs || 0);
    const statusKey = getStatusKey(testCase.status);
    const statusLabel = getPdfStatusLabel(testCase.status);

    return {
      runId: testCase.runId || '',
      testCase: testCase.testTitle || '',
      description: buildTestCaseDescription(testCase),
      module: getCaseModuleName(testCase),
      browser: testCase.projectName || '',
      status: testCase.status || '',
      statusLabel,
      statusKey,
      result: readLatestAttemptResult(testCase),
      expected: testCase.expectedStatus || '',
      lastAttemptStatus: testCase.lastAttemptStatus || '',
      attempts: Number(testCase.attemptCount || 0),
      duration: formatDurationSeconds(durationMs),
      durationMs,
      durationClass: durationMs > SLOW_DURATION_THRESHOLD_MS ? 'duration-warning' : '',
      failedApis: Number(testCase.apiFailureCount || 0),
      likelySource: testCase.likelyBugSource || '',
      fileRef: buildFileReference(testCase.file, testCase.line, testCase.column)
    };
  });
}

function buildFailedCaseRowsForPdf(filteredCases) {
  return filteredCases
    .filter((testCase) => FAILURE_STATUSES.has(testCase.status))
    .map((testCase) => {
      const insights = testCase.failureInsights || {};
      const suggestions = Array.isArray(insights.improvementSuggestions)
        ? insights.improvementSuggestions.join('\n')
        : '';
      const statusKey = getStatusKey(testCase.status);
      const statusLabel = getPdfStatusLabel(testCase.status);

      return {
        runId: testCase.runId || '',
        testCase: testCase.testTitle || '',
        description: buildTestCaseDescription(testCase),
        module: getCaseModuleName(testCase),
        browser: testCase.projectName || '',
        status: testCase.status || '',
        statusLabel,
        statusKey,
        failureCategory: insights.category || '',
        failedElement: insights.probableFailedElement || '',
        likelySource: insights.likelySource || testCase.likelyBugSource || '',
        failedApis: Number(testCase.apiFailureCount || 0),
        failureLocation: insights.location
          ? buildFileReference(insights.location.file, insights.location.line, insights.location.column)
          : buildFileReference(testCase.file, testCase.line, testCase.column),
        result: readLatestAttemptResult(testCase),
        lastError: cleanText(testCase.lastErrorMessage || '') || '-',
        suggestions: suggestions || '-'
      };
    });
}

function buildModuleRowsForPdf(filteredCases) {
  const modules = new Map();

  for (const testCase of filteredCases) {
    const moduleName = getCaseModuleName(testCase);
    if (!modules.has(moduleName)) {
      modules.set(moduleName, {
        module: moduleName,
        total: 0,
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0,
        apiFailures: 0
      });
    }

    const bucket = modules.get(moduleName);
    bucket.total += 1;
    if (bucket[testCase.status] !== undefined) {
      bucket[testCase.status] += 1;
    }
    bucket.apiFailures += Number(testCase.apiFailureCount || 0);
  }

  return Array.from(modules.values())
    .map((item) => ({
      ...item,
      passRate: item.total > 0
        ? (item.passed / Math.max(item.total - item.skipped, 1)) * 100
        : 0
    }))
    .sort((left, right) => {
      const leftRisk = left.failed + left.flaky;
      const rightRisk = right.failed + right.flaky;
      if (leftRisk !== rightRisk) {
        return rightRisk - leftRisk;
      }
      return right.total - left.total;
    });
}

function buildRunRowsForPdf(payload, filteredCases) {
  const runMap = new Map((Array.isArray(payload.runs) ? payload.runs : [])
    .map((run) => [run.runId, {
      runId: run.runId,
      startTime: run.startTime,
      total: 0,
      passed: 0,
      failed: 0,
      flaky: 0,
      skipped: 0,
      apiFailures: 0,
      modules: new Set()
    }]));

  for (const testCase of filteredCases) {
    const runId = testCase.runId || 'run-unknown';
    if (!runMap.has(runId)) {
      runMap.set(runId, {
        runId,
        startTime: testCase.runStartTime || '',
        total: 0,
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0,
        apiFailures: 0,
        modules: new Set()
      });
    }

    const bucket = runMap.get(runId);
    bucket.total += 1;
    if (bucket[testCase.status] !== undefined) {
      bucket[testCase.status] += 1;
    }
    bucket.apiFailures += Number(testCase.apiFailureCount || 0);
    bucket.modules.add(getCaseModuleName(testCase));
  }

    return Array.from(runMap.values())
      .map((item) => ({
        ...item,
        moduleCount: item.modules.size,
        passRate: item.total > 0
          ? (item.passed / Math.max(item.total - item.skipped, 1)) * 100
          : 0
      }))
      .sort((left, right) => new Date(right.startTime) - new Date(left.startTime));
}

function formatShortTimeForPdf(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function buildTrendDataForPdf(filteredCases, payload) {
  const runLookup = new Map((Array.isArray(payload.runs) ? payload.runs : []).map((run) => [run.runId, run]));
  const runBuckets = new Map();

  for (const testCase of filteredCases) {
    const runId = testCase.runId || 'run-unknown';
    if (!runBuckets.has(runId)) {
      const runRef = runLookup.get(runId);
      runBuckets.set(runId, {
        runId,
        startTime: testCase.runStartTime || (runRef ? runRef.startTime : null),
        label: runRef
          ? `${runRef.runId} | ${formatDateTimeForExport(runRef.startTime)}`
          : runId,
        shortLabel: formatShortTimeForPdf(runRef ? runRef.startTime : testCase.runStartTime),
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0,
        total: 0
      });
    }

    const bucket = runBuckets.get(runId);
    bucket.total += 1;
    if (bucket[testCase.status] !== undefined) {
      bucket[testCase.status] += 1;
    }
  }

  return Array.from(runBuckets.values())
    .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())
    .map((item) => ({
      ...item,
      passRate: item.total > 0
        ? (item.passed / Math.max(item.total - item.skipped, 1)) * 100
        : 0
    }));
}

function buildApiRowsForPdf(filteredCases) {
  const rows = [];

  for (const testCase of filteredCases) {
    const attempts = Array.isArray(testCase.attempts) ? testCase.attempts : [];
    for (let index = 0; index < attempts.length; index += 1) {
      const attempt = attempts[index];
      if (!attempt || !attempt.apiFailureReport) {
        continue;
      }

      const failedCalls = Array.isArray(attempt.apiFailureReport.failedApiCalls)
        ? attempt.apiFailureReport.failedApiCalls
        : [];
      if (failedCalls.length === 0) {
        continue;
      }

      for (const call of failedCalls) {
        const result = call.status === null || call.status === undefined
          ? `REQ_FAILED ${compactExportText(call.failureText || '', 90)}`.trim()
          : `HTTP ${call.status} ${compactExportText(call.statusText || '', 50)}`.trim();

        rows.push({
          runId: testCase.runId || '',
          testCase: testCase.testTitle || '',
          description: buildTestCaseDescription(testCase),
          module: getCaseModuleName(testCase),
          browser: testCase.projectName || '',
          attempt: index + 1,
          method: compactExportText(call.method || 'GET', 12),
          endpoint: compactExportText(call.url || '', 110),
          result,
          snippet: compactExportText(
            call.responseBodySnippet || call.requestBodySnippet || call.failureText || '',
            160
          )
        });
      }
    }
  }

  return rows;
}

function renderPdfTable(headers, rows, emptyMessage, options) {
  if (!rows.length) {
    return `<p class="empty">${escapeHtmlForPdf(emptyMessage)}</p>`;
  }

  const tableClass = options && options.tableClass ? ` class="${escapeHtmlForPdf(options.tableClass)}"` : '';
  const colGroupHtml = headers.some((header) => header.width)
    ? `<colgroup>${headers.map((header) => `<col${header.width ? ` style="width:${escapeHtmlForPdf(header.width)}"` : ''}>`).join('')}</colgroup>`
    : '';
  const headerHtml = headers
    .map((header) => `<th${header.className ? ` class="${escapeHtmlForPdf(header.className)}"` : ''}>${escapeHtmlForPdf(header.label)}</th>`)
    .join('');
  const bodyHtml = rows.map((row) => {
    const cells = headers
      .map((header) => {
        const cellClass = header.className ? ` class="${escapeHtmlForPdf(header.className)}"` : '';
        const cellValue = header.render
          ? header.render(row)
          : escapeHtmlForPdf(row[header.key]);
        return `<td${cellClass}>${cellValue}</td>`;
      })
      .join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <table${tableClass}>
      ${colGroupHtml}
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  `;
}

function renderPdfDonut(summary, slowSummary) {
  const segments = [
    { key: 'passed', label: 'Passed', value: summary.passed, color: '#3adb8f' },
    { key: 'failed', label: 'Failed', value: summary.failed, color: '#ff5f6d' },
    { key: 'skipped', label: 'Skipped', value: summary.skipped, color: '#f5b348' },
    { key: 'flaky', label: 'Flaky', value: summary.flaky, color: '#56a9ff' }
  ];

  const gradientParts = [];
  let cursor = 0;
  for (const segment of segments) {
    if (!segment.value) {
      continue;
    }
    const share = (segment.value / Math.max(summary.total, 1)) * 100;
    const nextCursor = cursor + share;
    gradientParts.push(`${segment.color} ${cursor.toFixed(2)}% ${nextCursor.toFixed(2)}%`);
    cursor = nextCursor;
  }

  const gradient = gradientParts.length > 0 ? gradientParts.join(', ') : '#12223a 0% 100%';
  const legendRows = segments.map((segment) => `
    <div class="pdf-legend-row">
      <span class="pdf-legend-dot" style="background:${segment.color}"></span>
      <span>${escapeHtmlForPdf(segment.label)}</span>
      <strong>${segment.value}</strong>
    </div>
  `).join('');
  const passRate = summary.passRate ? summary.passRate.toFixed(1) : '0.0';
  const thresholdSec = Math.round((slowSummary && slowSummary.thresholdMs ? slowSummary.thresholdMs : SLOW_DURATION_THRESHOLD_MS) / 1000);
  const slowAlert = slowSummary && slowSummary.total > 0
    ? `<p class="slow-warning-banner">Warning: ${slowSummary.total} case(s) exceeded ${thresholdSec}s threshold.</p>`
    : `<p class="slow-ok-banner">All cases within ${thresholdSec}s threshold.</p>`;

  return `
    <div class="pdf-donut-layout">
      <div class="pdf-donut-ring" style="background: conic-gradient(${gradient});">
        <div class="pdf-donut-center">
          <strong>${escapeHtmlForPdf(passRate)}</strong>
          <span>Pass Rate</span>
        </div>
      </div>
      <div class="pdf-donut-legend">
        ${legendRows}
      </div>
    </div>
    ${slowAlert}
  `;
}

function renderPdfTrendChart(trendData) {
  if (!trendData || !trendData.length) {
    return '<p class="empty-state">No trend data available.</p>';
  }

  const width = Math.max(520, trendData.length * 90);
  const height = 240;
  const margin = { left: 38, right: 22, top: 24, bottom: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxTotal = Math.max(...trendData.map((entry) => entry.total), 1);
  const step = trendData.length > 1 ? plotWidth / (trendData.length - 1) : plotWidth;
  const yPositionForRate = (rate) => margin.top + plotHeight - ((Math.max(0, Math.min(rate, 100)) / 100) * plotHeight);

  const gridLines = [0, 20, 40, 60, 80, 100].map((rate) => {
    const y = yPositionForRate(rate).toFixed(2);
    return `
      <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" class="trend-grid-line"></line>
      <text x="8" y="${Number(y) + 4}" class="trend-axis-label">${rate}%</text>
    `;
  }).join('');

  const bars = trendData.map((entry, index) => {
    const xCenter = trendData.length > 1
      ? margin.left + (index * step)
      : margin.left + plotWidth / 2;
    const barWidth = 18;
    const passHeight = ((entry.passed / maxTotal) * plotHeight).toFixed(2);
    const failHeight = (((entry.failed + entry.flaky) / maxTotal) * plotHeight).toFixed(2);
    const passY = (margin.top + plotHeight - Number(passHeight)).toFixed(2);
    const failY = (margin.top + plotHeight - Number(failHeight)).toFixed(2);

    return `
      <rect x="${(xCenter - barWidth - 4).toFixed(2)}" y="${passY}" width="${barWidth}" height="${passHeight}" class="trend-pass-bar"></rect>
      <rect x="${(xCenter + 4).toFixed(2)}" y="${failY}" width="${barWidth}" height="${failHeight}" class="trend-fail-bar"></rect>
      <text x="${xCenter.toFixed(2)}" y="${height - 18}" class="trend-x-label">${escapeHtmlForPdf(entry.shortLabel || entry.label)}</text>
    `;
  }).join('');

  const linePoints = trendData.map((entry, index) => {
    const xPoint = trendData.length > 1
      ? margin.left + (index * step)
      : margin.left + plotWidth / 2;
    const yPoint = yPositionForRate(entry.passRate);
    return `${xPoint.toFixed(2)},${yPoint.toFixed(2)}`;
  }).join(' ');

  const lineDots = trendData.map((entry, index) => {
    const xPoint = trendData.length > 1
      ? margin.left + (index * step)
      : margin.left + plotWidth / 2;
    const yPoint = yPositionForRate(entry.passRate);
    const tip = `${entry.label || ''} | Pass rate: ${entry.passRate ? entry.passRate.toFixed(1) : '0.0'}%`;
    return `
      <g>
        <circle cx="${xPoint.toFixed(2)}" cy="${yPoint.toFixed(2)}" r="4" class="trend-rate-dot"></circle>
        <title>${escapeHtmlForPdf(tip)}</title>
      </g>
    `;
  }).join('');

  return `
    <div class="pdf-trend-scroll">
      <svg class="trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Pass rate trend chart">
        ${gridLines}
        ${bars}
        <polyline points="${linePoints}" class="trend-rate-line"></polyline>
        ${lineDots}
      </svg>
    </div>
    <div class="trend-legend">
      <span><i class="legend-dot" style="background:#4fa8ff;"></i>Pass count</span>
      <span><i class="legend-dot" style="background:#ff6a74;"></i>Fail + flaky count</span>
      <span><i class="legend-dot" style="background:#8df6b2;"></i>Pass rate</span>
    </div>
  `;
}

function renderSlowCaseList(slowSummary) {
  if (!slowSummary || !Array.isArray(slowSummary.cases) || slowSummary.cases.length === 0) {
    return '<p class="slow-list-empty">No tests above the threshold.</p>';
  }

  const rows = slowSummary.cases.slice(0, 6).map((entry) => {
    const durationText = formatDurationSeconds(entry.durationMs);
    const runLabel = entry.runId ? `${escapeHtmlForPdf(entry.runId)} | ${escapeHtmlForPdf(formatDateTimeForExport(entry.runStartTime))}` : 'Unknown run';
    const title = escapeHtmlForPdf(entry.fullTitle || entry.testTitle);
    const module = escapeHtmlForPdf(entry.moduleName || 'Unknown module');
    return `
      <li>
        <strong>${durationText}</strong>
        <span>${module} · ${title}</span>
        <small>${runLabel}</small>
      </li>
    `;
  }).join('');

  return `<ul class="slow-list">${rows}</ul>`;
}

function buildPdfHtml(payload, filteredCases, context) {
  const summary = buildSummary(filteredCases);
  const contextLabels = buildExportContextLabels(payload, context);
  const slowSummary = payload.slowCaseSummary || {
    thresholdMs: payload.thresholdMs || SLOW_DURATION_THRESHOLD_MS,
    total: 0,
    cases: []
  };
  const trendData = buildTrendDataForPdf(filteredCases, payload);
  const moduleRows = buildModuleRowsForPdf(filteredCases).slice(0, 28).map((item) => ({
    module: item.module,
    total: item.total,
    passed: item.passed,
    failed: item.failed,
    flaky: item.flaky,
    skipped: item.skipped,
    passRate: `${item.passRate.toFixed(1)}%`,
    apiFailures: item.apiFailures
  }));
  const runRows = buildRunRowsForPdf(payload, filteredCases).slice(0, 24).map((item) => ({
    runId: item.runId,
    startTime: formatDateTimeForExport(item.startTime),
    total: item.total,
    passRate: `${item.passRate.toFixed(1)}%`,
    failedFlaky: item.failed + item.flaky,
    moduleCount: item.moduleCount,
    apiFailures: item.apiFailures
  }));
  const apiRows = buildApiRowsForPdf(filteredCases).slice(0, 140);
  const testRows = buildTestCaseRowsForPdf(filteredCases);
  const failedCaseRows = buildFailedCaseRowsForPdf(filteredCases);

  const contextList = [
    ['Generated At', formatDateTimeForExport(payload.generatedAt)],
    ['Current Run', contextLabels.currentRunLabel],
    ['Search', context.search || '-'],
    ['Module Filter', context.module || context.suite || 'all'],
    ['Browser Filter', context.browser || 'all'],
    ['Status Filter', context.statuses || 'all']
  ];

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Test Intelligence Report</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      color: #0f1f2e;
      background: #f4f8fd;
      font-size: 11px;
      line-height: 1.35;
    }
    .page {
      padding: 20px 22px 26px;
    }
    .header {
      border-radius: 12px;
      background: linear-gradient(120deg, #143c74, #1b5ca2, #2a83cb);
      color: #f4fbff;
      padding: 14px 16px;
      margin-bottom: 14px;
    }
    .header h1 {
      margin: 0 0 4px;
      font-size: 18px;
    }
    .header p {
      margin: 0;
      opacity: 0.95;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }
    .metric {
      border-radius: 10px;
      border: 1px solid #cde0f3;
      background: #ffffff;
      padding: 8px;
    }
    .metric p {
      margin: 0;
      color: #46627f;
      font-size: 10px;
    }
    .metric strong {
      display: block;
      margin-top: 3px;
      font-size: 16px;
      color: #10283f;
    }
    .context {
      border: 1px solid #cde0f3;
      border-radius: 10px;
      background: #ffffff;
      padding: 10px 12px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .context-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px 10px;
    }
    .context-grid div {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 6px;
    }
    .context-grid span {
      color: #48637d;
      font-weight: 600;
    }
    .section {
      margin-top: 12px;
      border: 1px solid #cde0f3;
      border-radius: 10px;
      background: #ffffff;
      padding: 10px 12px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .table-section {
      page-break-inside: auto;
    }
    .diagnostics-section {
      padding-top: 8px;
      padding-bottom: 8px;
    }
    .section h2 {
      margin: 0 0 8px;
      font-size: 13px;
      color: #13345a;
      break-after: avoid-page;
      page-break-after: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
    }
    thead {
      display: table-header-group;
    }
    tbody {
      display: table-row-group;
    }
    th,
    td {
      border: 1px solid #d8e7f6;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    th {
      background: #eef5fc;
      color: #214264;
      font-size: 10px;
      text-transform: uppercase;
    }
    td {
      color: #1a3652;
      white-space: pre-wrap;
      word-break: normal;
    }
    tr {
      page-break-inside: avoid;
    }
    .pdf-table-cases th,
    .pdf-table-cases td {
      font-size: 9.5px;
      line-height: 1.45;
    }
    .pdf-table-cases .col-description,
    .pdf-table-cases .col-result {
      white-space: normal;
    }
    .pdf-table-cases .col-description {
      font-weight: 600;
    }
    .pdf-table-cases .col-module,
    .pdf-table-cases .col-browser,
    .pdf-table-cases .col-status,
    .pdf-table-cases .col-attempts,
    .pdf-table-cases .col-duration,
    .pdf-table-cases .col-failed-apis {
      white-space: nowrap;
    }
    .pdf-status-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 9px;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      text-transform: capitalize;
    }
    .pdf-status-pill.status-passed {
      background: #1f8a3b;
    }
    .pdf-status-pill.status-failed {
      background: #c92f2f;
    }
    .pdf-status-pill.status-flaky {
      background: #56a9ff;
    }
    .pdf-status-pill.status-skipped {
      background: #5c6576;
    }
    .pdf-status-pill.status-not-started {
      background: #1f78c2;
    }
    .pdf-status-pill.status-hold {
      background: #d9822b;
    }
    .pdf-status-pill.status-unknown {
      background: #7a7a7a;
    }
    .pdf-table-diagnostics th,
    .pdf-table-diagnostics td,
    .pdf-table-api th,
    .pdf-table-api td {
      font-size: 8.8px;
      line-height: 1.45;
    }
    .pdf-table-diagnostics th,
    .pdf-table-diagnostics td {
      padding: 5px 6px;
    }
    .pdf-table-diagnostics tr {
      break-inside: auto;
      page-break-inside: auto;
    }
    .pdf-table-diagnostics tbody {
      page-break-inside: auto;
    }
    .pdf-table-diagnostics .col-description,
    .pdf-table-diagnostics .col-failure-category,
    .pdf-table-diagnostics .col-failed-element,
    .pdf-table-diagnostics .col-likely-source,
    .pdf-table-diagnostics .col-failure-location,
    .pdf-table-diagnostics .col-result,
    .pdf-table-diagnostics .col-last-error,
    .pdf-table-diagnostics .col-suggestions,
    .pdf-table-api .col-description,
    .pdf-table-api .col-endpoint,
    .pdf-table-api .col-result,
    .pdf-table-api .col-snippet {
      white-space: normal;
    }
    .pdf-table-diagnostics .col-run,
    .pdf-table-diagnostics .col-module,
    .pdf-table-diagnostics .col-browser,
    .pdf-table-diagnostics .col-status,
    .pdf-table-diagnostics .col-failed-apis,
    .pdf-table-api .col-run,
    .pdf-table-api .col-module,
    .pdf-table-api .col-browser,
    .pdf-table-api .col-attempt,
    .pdf-table-api .col-method {
      white-space: nowrap;
    }
    .pdf-table-diagnostics .col-suggestions {
      line-height: 1.6;
    }
    .pdf-chart-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 14px;
      margin-bottom: 18px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .chart-card {
      border: 1px solid #cde0f3;
      border-radius: 14px;
      background: #ffffff;
      padding: 14px 16px;
      box-shadow: 0 6px 18px rgba(17, 40, 80, 0.05);
    }
    .chart-head h2 {
      margin: 0;
      font-size: 14px;
      color: #13345a;
    }
    .chart-head p {
      margin: 4px 0 10px;
      font-size: 11px;
      color: #4e627f;
    }
    .pdf-donut-layout {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }
    .pdf-donut-ring {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 0 0 6px #f5f6f9;
    }
    .pdf-donut-center {
      text-align: center;
    }
    .pdf-donut-center strong {
      font-size: 22px;
      color: #10283f;
      display: block;
    }
    .pdf-donut-legend {
      display: grid;
      gap: 6px;
      font-size: 11px;
      color: #2b3a53;
    }
    .pdf-legend-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pdf-legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .slow-warning-banner,
    .slow-ok-banner {
      margin-top: 12px;
      padding: 8px 10px;
      border-radius: 10px;
      font-size: 11px;
    }
    .slow-warning-banner {
      background: #fde7e6;
      color: #b62333;
    }
    .slow-ok-banner {
      background: #e9f6f1;
      color: #156947;
    }
    .slow-highlight {
      border: 1px solid #cde0f3;
      border-radius: 12px;
      padding: 12px 14px;
      background: #ffffff;
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .slow-highlight h2 {
      margin: 0;
      font-size: 14px;
      color: #13345a;
    }
    .slow-highlight p {
      margin: 4px 0 10px;
      font-size: 10px;
      color: #4e627f;
    }
    .slow-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 6px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .slow-list li {
      padding: 6px 8px;
      border-radius: 8px;
      background: #f6f8fb;
      font-size: 11px;
      color: #14253b;
    }
    .slow-list li strong {
      color: #c72a2a;
      font-weight: 600;
      margin-right: 6px;
    }
    .slow-list li span {
      display: block;
      font-size: 10px;
      color: #3f4d63;
      margin-top: 2px;
    }
    .slow-list li small {
      display: block;
      font-size: 9px;
      color: #617092;
      margin-top: 2px;
    }
    .pdf-trend-scroll {
      overflow-x: auto;
      padding-bottom: 6px;
    }
    .trend-svg {
      width: 100%;
      height: auto;
    }
    .trend-grid-line {
      stroke: #dce7f0;
      stroke-width: 1;
    }
    .trend-rate-line {
      stroke: #8df6b2;
      stroke-width: 2.6;
      fill: none;
    }
    .trend-pass-bar {
      fill: #4fa8ff;
      opacity: 0.92;
    }
    .trend-fail-bar {
      fill: #ff6a74;
      opacity: 0.88;
    }
    .trend-x-label {
      font-size: 10px;
      fill: #1c2b3d;
      text-anchor: middle;
    }
    .trend-legend {
      display: flex;
      gap: 12px;
      font-size: 10px;
      color: #45607c;
      margin-top: 8px;
    }
    .trend-legend .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 4px;
    }
    .duration-cell {
      display: inline-block;
    }
    .duration-warning {
      color: #e77b1d;
      font-weight: 600;
    }
    .empty {
      margin: 0;
      color: #6b8198;
    }
    .note {
      margin-top: 6px;
      color: #5f7891;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Dos Test Intelligence Report</h1>
      <p>Professional QA execution report with status intelligence, module health, and API failure diagnostics.</p>
    </div>

    <section class="metrics">
      <article class="metric"><p>Total Tests</p><strong>${summary.total}</strong></article>
      <article class="metric"><p>Passed</p><strong>${summary.passed}</strong></article>
      <article class="metric"><p>Failed</p><strong>${summary.failed}</strong></article>
      <article class="metric"><p>Flaky</p><strong>${summary.flaky}</strong></article>
      <article class="metric"><p>Skipped</p><strong>${summary.skipped}</strong></article>
      <article class="metric"><p>Pass Rate</p><strong>${summary.passRate.toFixed(1)}%</strong></article>
    </section>

    <section class="context">
      <div class="context-grid">
        ${contextList.map(([key, value]) => `
          <div>
            <span>${escapeHtmlForPdf(key)}</span>
            <div>${escapeHtmlForPdf(value || '-')}</div>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="pdf-chart-grid">
      <article class="chart-card">
        <div class="chart-head">
          <h2>Test Results</h2>
          <p>Pass/fail/skipped/flaky distribution for filtered scope.</p>
        </div>
        ${renderPdfDonut(summary, slowSummary)}
      </article>

      <article class="chart-card">
        <div class="chart-head">
          <h2>Pass Rate Trend</h2>
          <p>Run-level pass rate with volume and trend insights.</p>
        </div>
        ${renderPdfTrendChart(trendData)}
      </article>
    </section>

    <section class="slow-highlight">
      <h2>Slow Case Highlights</h2>
      <p>Reporting the longest cases that exceeded ${Math.round((slowSummary.thresholdMs || SLOW_DURATION_THRESHOLD_MS) / 1000)} seconds.</p>
      ${renderSlowCaseList(slowSummary)}
    </section>

    <section class="section">
      <h2>Modules Run And Status Mix</h2>
      ${renderPdfTable([
        { key: 'module', label: 'Module' },
        { key: 'total', label: 'Total' },
        { key: 'passed', label: 'Passed' },
        { key: 'failed', label: 'Failed' },
        { key: 'flaky', label: 'Flaky' },
        { key: 'skipped', label: 'Skipped' },
        { key: 'passRate', label: 'Pass Rate' },
        { key: 'apiFailures', label: 'API Failures' }
      ], moduleRows, 'No module summary for current filters.')}
    </section>

    <section class="section">
      <h2>Run Health Overview</h2>
      ${renderPdfTable([
        { key: 'runId', label: 'Run' },
        { key: 'startTime', label: 'Start Time' },
        { key: 'total', label: 'Total' },
        { key: 'passRate', label: 'Pass Rate' },
        { key: 'failedFlaky', label: 'Failed + Flaky' },
        { key: 'moduleCount', label: 'Modules' },
        { key: 'apiFailures', label: 'API Failures' }
      ], runRows, 'No run summary for current filters.')}
    </section>

    <section class="section table-section">
      <h2>Test Cases Status And Result</h2>
      ${renderPdfTable([
        { key: 'runId', label: 'Run', width: '7%', className: 'col-run' },
        { key: 'description', label: 'Test Description', width: '34%', className: 'col-description' },
        { key: 'module', label: 'Module', width: '14%', className: 'col-module' },
        { key: 'browser', label: 'Browser', width: '9%', className: 'col-browser' },
        {
          key: 'status',
          label: 'Status',
          width: '6%',
          className: 'col-status',
          render: (row) => `<span class="pdf-status-pill status-${row.statusKey || 'unknown'}">${escapeHtmlForPdf(row.statusLabel || row.status)}</span>`
        },
        { key: 'result', label: 'Result', width: '18%', className: 'col-result' },
        { key: 'attempts', label: 'Attempts', width: '4%', className: 'col-attempts' },
        {
          key: 'duration',
          label: 'Duration',
          width: '4%',
          className: 'col-duration',
          render: (row) => `<span class="duration-cell ${row.durationClass || ''}">${escapeHtmlForPdf(row.duration)}</span>`
        },
        { key: 'failedApis', label: 'Failed APIs', width: '4%', className: 'col-failed-apis' }
      ], testRows, 'No test case rows for current filters.', { tableClass: 'pdf-table-cases' })}
      <p class="note">Rows shown: ${testRows.length}. Test description and result now show full content with wider cells for easier reading.</p>
    </section>

    <section class="section table-section diagnostics-section">
      <h2>Failed Test Case Diagnostics</h2>
      ${renderPdfTable([
        { key: 'runId', label: 'Run', width: '5%', className: 'col-run' },
        { key: 'description', label: 'Test Description', width: '11%', className: 'col-description' },
        { key: 'module', label: 'Module', width: '7%', className: 'col-module' },
        { key: 'browser', label: 'Browser', width: '5%', className: 'col-browser' },
        {
          key: 'status',
          label: 'Status',
          width: '5%',
          className: 'col-status',
          render: (row) => `<span class="pdf-status-pill status-${row.statusKey || 'unknown'}">${escapeHtmlForPdf(row.statusLabel || row.status)}</span>`
        },
        { key: 'failureCategory', label: 'Failure Category', width: '6%', className: 'col-failure-category' },
        { key: 'failedElement', label: 'Probable Failed Element', width: '9%', className: 'col-failed-element' },
        { key: 'likelySource', label: 'Likely Source', width: '6%', className: 'col-likely-source' },
        { key: 'failedApis', label: 'Failed APIs', width: '4%', className: 'col-failed-apis' },
        { key: 'failureLocation', label: 'Failure Location', width: '8%', className: 'col-failure-location' },
        { key: 'result', label: 'Result', width: '7%', className: 'col-result' },
        { key: 'lastError', label: 'Last Error', width: '6%', className: 'col-last-error' },
        { key: 'suggestions', label: 'Optimization Actions', width: '17%', className: 'col-suggestions' }
      ], failedCaseRows, 'No failed or flaky test cases for current filters.', { tableClass: 'pdf-table-diagnostics' })}
      <p class="note">Rows shown: ${failedCaseRows.length}. Includes full diagnosis, latest output logs, and optimization actions.</p>
    </section>

    <section class="section table-section">
      <h2>API Failed Responses</h2>
      ${renderPdfTable([
        { key: 'runId', label: 'Run', width: '6%', className: 'col-run' },
        { key: 'description', label: 'Test Description', width: '18%', className: 'col-description' },
        { key: 'module', label: 'Module', width: '10%', className: 'col-module' },
        { key: 'browser', label: 'Browser', width: '8%', className: 'col-browser' },
        { key: 'attempt', label: 'Attempt', width: '5%', className: 'col-attempt' },
        { key: 'method', label: 'Method', width: '6%', className: 'col-method' },
        { key: 'endpoint', label: 'Endpoint', width: '22%', className: 'col-endpoint' },
        { key: 'result', label: 'Result', width: '10%', className: 'col-result' },
        { key: 'snippet', label: 'Response Snippet', width: '15%', className: 'col-snippet' }
      ], apiRows, 'No failed API responses for current filters.', { tableClass: 'pdf-table-api' })}
      <p class="note">Rows shown: ${apiRows.length}. Include attachment-level API report for complete diagnostics.</p>
    </section>
  </div>
</body>
</html>
  `;
}

async function buildPdfBuffer(payload, filteredCases, context) {
  const chromium = tryLoadPlaywrightChromium();
  if (!chromium) {
    throw new Error('Playwright chromium is not available. Install dependencies and browsers before exporting PDF.');
  }

  const html = buildPdfHtml(payload, filteredCases, context);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '8mm',
        right: '6mm',
        bottom: '8mm',
        left: '6mm'
      }
    });
  } finally {
    await browser.close();
  }
}

function buildExportFileName(extension) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  const minute = String(now.getUTCMinutes()).padStart(2, '0');
  const second = String(now.getUTCSeconds()).padStart(2, '0');
  const normalizedExtension = cleanText(extension || 'xlsx').replace(/^\./, '') || 'xlsx';
  return `dashboard-report-${year}${month}${day}-${hour}${minute}${second}.${normalizedExtension}`;
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8'
  });
  response.end(body);
}

function sendFile(response, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const mimeType = getMimeType(filePath);
  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': mimeType
  });

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Failed to read file');
  });
  stream.pipe(response);
}

function resolveArtifactPath(fileQueryValue) {
  if (!fileQueryValue) {
    return '';
  }

  const normalizedRelative = path.normalize(fileQueryValue).replace(/^([/\\])+/, '');
  if (!normalizedRelative || normalizedRelative.includes('..')) {
    return '';
  }

  const resolvedPath = path.resolve(ROOT_DIR, normalizedRelative);
  const rootLower = ROOT_DIR.toLowerCase();
  if (!resolvedPath.toLowerCase().startsWith(rootLower)) {
    return '';
  }

  return resolvedPath;
}

async function requestHandler(request, response) {
  const requestUrl = new URL(request.url, `http://localhost:${PORT}`);
  const pathname = requestUrl.pathname;

  if (pathname === '/api/dashboard-data') {
    const payload = buildDashboardData();
    sendJson(response, 200, payload);
    return;
  }

  if (pathname === '/api/export-excel') {
    const payload = buildDashboardData();
    const { filteredCases, context } = filterCasesForExport(payload.cases || [], requestUrl.searchParams);

    let workbookBuffer;
    try {
      workbookBuffer = buildWorkbookBuffer(payload, filteredCases, context);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(`Excel export failed: ${error.message}`);
      return;
    }

    const fileName = buildExportFileName('xlsx');
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': MIME_TYPES['.xlsx'],
      'Content-Disposition': `attachment; filename=\"${fileName}\"`,
      'Content-Length': workbookBuffer.length
    });
    response.end(workbookBuffer);
    return;
  }

  if (pathname === '/api/export-pdf') {
    const payload = buildDashboardData();
    const { filteredCases, context } = filterCasesForExport(payload.cases || [], requestUrl.searchParams);

    let pdfBuffer;
    try {
      pdfBuffer = await buildPdfBuffer(payload, filteredCases, context);
    } catch (error) {
      const rawMessage = cleanText(error && error.message ? error.message : String(error || 'Unknown PDF error'));
      const normalizedMessage = rawMessage.split('\n').find(Boolean) || rawMessage || 'Unknown PDF error';
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(`PDF export failed: ${normalizedMessage}`);
      return;
    }

    const fileName = buildExportFileName('pdf');
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': MIME_TYPES['.pdf'],
      'Content-Disposition': `attachment; filename=\"${fileName}\"`,
      'Content-Length': pdfBuffer.length
    });
    response.end(pdfBuffer);
    return;
  }

  if (pathname === '/artifact') {
    const fileQueryValue = requestUrl.searchParams.get('file');
    const resolvedPath = resolveArtifactPath(fileQueryValue);
    if (!resolvedPath) {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Invalid artifact path');
      return;
    }
    sendFile(response, resolvedPath);
    return;
  }

  if (STATIC_FILES[pathname]) {
    sendFile(response, STATIC_FILES[pathname]);
    return;
  }

  if (pathname === '/favicon.ico') {
    response.writeHead(204);
    response.end();
    return;
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
}

const server = http.createServer((request, response) => {
  requestHandler(request, response).catch((error) => {
    if (response.writableEnded) {
      return;
    }
    if (!response.headersSent) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    response.end(`Internal server error: ${error.message}`);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    process.stdout.write(`Dashboard server running on http://localhost:${PORT}\n`);
  });
}

module.exports = {
  buildDashboardData
};
