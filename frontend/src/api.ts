import axios from 'axios';

export const getStoredApiUrl = (): string => {
  const stored = localStorage.getItem('RAILWAY_API_URL');
  if (stored && stored.trim()) {
    return stored.trim().replace(/\/+$/, '');
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
};

export const setStoredApiUrl = (url: string): void => {
  if (url && url.trim()) {
    localStorage.setItem('RAILWAY_API_URL', url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('RAILWAY_API_URL');
  }
};

export const getApiInstance = () => {
  const baseURL = getStoredApiUrl();
  return axios.create({
    baseURL,
    timeout: 30000,
  });
};

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
  const res = await getApiInstance().get('/api/status');
  return res.data;
};

export const triggerPipeline = async () => {
  const res = await getApiInstance().post('/api/run-pipeline');
  return res.data;
};

export const fetchLatestReport = async (): Promise<LatestReportResponse> => {
  const res = await getApiInstance().get('/api/reports/latest');
  return res.data;
};

export const fetchLogs = async (): Promise<LogsResponse> => {
  const res = await getApiInstance().get('/api/logs');
  return res.data;
};

export const fetchAvailableReports = async (): Promise<AvailableReportsResponse> => {
  const res = await getApiInstance().get('/api/reports');
  const data = res.data;
  const baseUrl = getStoredApiUrl();
  if (baseUrl) {
    if (data.pdfs) {
      data.pdfs = data.pdfs.map((p: any) => ({ ...p, url: `${baseUrl}${p.url}` }));
    }
    if (data.htmls) {
      data.htmls = data.htmls.map((h: any) => ({ ...h, url: `${baseUrl}${h.url}` }));
    }
  }
  return data;
};
