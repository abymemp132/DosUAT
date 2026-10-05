import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const repoRoot = path.resolve(__dirname, "..");
const reportsDir = path.join(repoRoot, "reports");

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Root health & welcome check
app.get("/", (_req, res) => {
  res.json({
    name: "DosUAT Automation Control API",
    status: "online",
    health: "/api/health",
    timestamp: new Date().toISOString()
  });
});

// Serve static test reports & assets
app.use("/reports", express.static(reportsDir));
app.use("/playwright-report", express.static(path.join(repoRoot, "playwright-report")));

interface PipelineState {
  status: "idle" | "running" | "completed" | "failed";
  startTime: string | null;
  endTime: string | null;
  lastRunExitCode: number | null;
  logs: string[];
}

const state: PipelineState = {
  status: "idle",
  startTime: null,
  endTime: null,
  lastRunExitCode: null,
  logs: []
};

let activeChildProcess: ChildProcess | null = null;

function appendLog(message: string) {
  const time = new Date().toISOString();
  const formatted = `[${time}] ${message}`;
  state.logs.push(formatted);
  if (state.logs.length > 2000) {
    state.logs.shift();
  }
}

function runPipeline(): boolean {
  if (state.status === "running") {
    return false;
  }

  state.status = "running";
  state.startTime = new Date().toISOString();
  state.endTime = null;
  state.logs = [];
  appendLog("🚀 Starting Playwright test pipeline...");

  const isWindows = process.platform === "win32";
  const npmCmd = isWindows ? "npm.cmd" : "npm";

  const child = spawn(npmCmd, ["run", "pipeline"], {
    cwd: repoRoot,
    env: { ...process.env, CI: "true", TEST_ENV: process.env.TEST_ENV || "UAT" },
    shell: true
  });

  activeChildProcess = child;

  child.stdout?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n");
    lines.forEach((line) => {
      if (line.trim()) appendLog(line.trim());
    });
  });

  child.stderr?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n");
    lines.forEach((line) => {
      if (line.trim()) appendLog(`[STDERR] ${line.trim()}`);
    });
  });

  child.on("close", (code) => {
    activeChildProcess = null;
    state.endTime = new Date().toISOString();
    state.lastRunExitCode = code;
    if (code === 0) {
      state.status = "completed";
      appendLog("✅ Pipeline completed successfully!");
    } else {
      state.status = "failed";
      appendLog(`❌ Pipeline failed with exit code ${code}`);
    }
  });

  child.on("error", (err) => {
    activeChildProcess = null;
    state.status = "failed";
    state.endTime = new Date().toISOString();
    appendLog(`❌ Failed to start process: ${err.message}`);
  });

  return true;
}

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get current pipeline status
app.get("/api/status", (_req, res) => {
  res.json({
    status: state.status,
    startTime: state.startTime,
    endTime: state.endTime,
    lastRunExitCode: state.lastRunExitCode,
    isRunning: state.status === "running"
  });
});

// Trigger pipeline manually
app.post("/api/run-pipeline", (_req, res) => {
  const started = runPipeline();
  if (started) {
    res.json({ success: true, message: "Pipeline run initiated." });
  } else {
    res.status(400).json({ success: false, message: "Pipeline is already running." });
  }
});

// Get pipeline execution logs
app.get("/api/logs", (_req, res) => {
  res.json({ logs: state.logs });
});

// Get latest test execution results JSON
app.get("/api/reports/latest", (_req, res) => {
  try {
    const resultsPath = path.join(reportsDir, "results.json");
    let jsonPathToRead = resultsPath;

    if (!fs.existsSync(resultsPath)) {
      // Find latest playwright-*.json
      if (fs.existsSync(reportsDir)) {
        const files = fs.readdirSync(reportsDir);
        const reportFiles = files
          .filter((f) => f.startsWith("playwright-") && f.endsWith(".json"))
          .map((f) => ({
            name: f,
            time: fs.statSync(path.join(reportsDir, f)).mtimeMs
          }))
          .sort((a, b) => b.time - a.time);

        if (reportFiles.length > 0) {
          jsonPathToRead = path.join(reportsDir, reportFiles[0].name);
        }
      }
    }

    if (!fs.existsSync(jsonPathToRead)) {
      return res.status(404).json({ error: "No test reports found yet." });
    }

    const rawData = fs.readFileSync(jsonPathToRead, "utf-8");
    const parsed = JSON.parse(rawData);

    // Calculate metrics
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let durationMs = 0;
    const suitesList: any[] = [];

    if (parsed.suites && Array.isArray(parsed.suites)) {
      const processSuite = (suite: any, parentTitle = "") => {
        const title = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;
        if (suite.specs && Array.isArray(suite.specs)) {
          suite.specs.forEach((spec: any) => {
            if (spec.tests && Array.isArray(spec.tests)) {
              spec.tests.forEach((test: any) => {
                total++;
                const lastResult = test.results?.[test.results.length - 1];
                const status = lastResult?.status || "skipped";
                if (status === "passed") passed++;
                else if (status === "failed" || status === "timedOut") failed++;
                else skipped++;

                durationMs += lastResult?.duration || 0;

                suitesList.push({
                  title: spec.title,
                  file: spec.file || suite.file,
                  status,
                  duration: lastResult?.duration || 0,
                  error: lastResult?.error?.message || null
                });
              });
            }
          });
        }
        if (suite.suites && Array.isArray(suite.suites)) {
          suite.suites.forEach((subSuite: any) => processSuite(subSuite, title));
        }
      };

      parsed.suites.forEach((s: any) => processSuite(s));
    } else if (parsed.stats) {
      total = parsed.stats.expected + parsed.stats.unexpected + parsed.stats.skipped;
      passed = parsed.stats.expected;
      failed = parsed.stats.unexpected;
      skipped = parsed.stats.skipped;
      durationMs = parsed.stats.duration || 0;
    }

    res.json({
      summary: {
        total,
        passed,
        failed,
        skipped,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        durationSeconds: Math.round(durationMs / 1000)
      },
      tests: suitesList,
      rawStats: parsed.stats || null,
      timestamp: fs.statSync(jsonPathToRead).mtime
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to parse test report", details: err.message });
  }
});

// List all generated PDF reports & files
app.get("/api/reports", (_req, res) => {
  try {
    if (!fs.existsSync(reportsDir)) {
      return res.json({ reports: [] });
    }
    const files = fs.readdirSync(reportsDir);
    const pdfs = files.filter((f) => f.endsWith(".pdf"));
    const htmls = files.filter((f) => f.endsWith(".html"));

    res.json({
      pdfs: pdfs.map((f) => ({ name: f, url: `/reports/${f}` })),
      htmls: htmls.map((f) => ({ name: f, url: `/reports/${f}` }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setup Cron Schedule (Daily run at 03:03 AM IST -> 09:33 PM UTC previous day, or custom env CRON_SCHEDULE)
const cronSchedule = process.env.CRON_SCHEDULE || "33 21 * * *";
if (cron.validate(cronSchedule)) {
  cron.schedule(cronSchedule, () => {
    appendLog(`⏰ Scheduled Cron triggered at (${cronSchedule})`);
    runPipeline();
  });
  console.log(`[Cron] Scheduled pipeline with expression: "${cronSchedule}"`);
} else {
  console.error(`[Cron] Invalid cron expression: "${cronSchedule}"`);
}

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`📊 Reports static path: http://localhost:${PORT}/reports`);
});
