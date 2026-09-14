import axios from 'axios';

// Configurable API base URL (VITE_API_BASE_URL can be set in Netlify dashboard)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export interface StatusResponse {
  status: 'idle' | 'running' | 'completed' | 'failed';
  startTime: string | null;
  endTime: string | null;
  lastRunExitCode: number | null;
  isRunning: boolean;
}

export interface SummaryStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  durationSeconds: number;
}

export interface TestCase {
  title: string;
  file?: string;
  status: 'passed' | 'failed' | 'timedOut' | 'skipped';
  duration: number;
  error?: string | null;
}

export interface LatestReportResponse {
  summary: SummaryStats;
  tests: TestCase[];
  timestamp: string;
}

export interface LogsResponse {
  logs: string[];
}

export interface AvailableReportsResponse {
  pdfs: Array<{ name: string; url: string }>;
  htmls: Array<{ name: string; url: string }>;
}

export const fetchStatus = async (): Promise<StatusResponse> => {
  const res = await api.get('/api/status');
  return res.data;
};

export const triggerPipeline = async () => {
  const res = await api.post('/api/run-pipeline');
  return res.data;
};

export const fetchLatestReport = async (): Promise<LatestReportResponse> => {
  const res = await api.get('/api/reports/latest');
  return res.data;
};

export const fetchLogs = async (): Promise<LogsResponse> => {
  const res = await api.get('/api/logs');
  return res.data;
};

export const fetchAvailableReports = async (): Promise<AvailableReportsResponse> => {
  const res = await api.get('/api/reports');
  return res.data;
};
