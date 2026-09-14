import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { ControlPanel } from './components/ControlPanel';
import { TestTable } from './components/TestTable';
import { LogConsole } from './components/LogConsole';
import { ReportsModal } from './components/ReportsModal';
import {
  fetchStatus,
  fetchLatestReport,
  fetchLogs,
  triggerPipeline,
  StatusResponse,
  LatestReportResponse
} from './api';

export function App() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [report, setReport] = useState<LatestReportResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [statusRes, reportRes, logsRes] = await Promise.allSettled([
        fetchStatus(),
        fetchLatestReport(),
        fetchLogs()
      ]);

      if (statusRes.status === 'fulfilled') {
        setStatus(statusRes.value);
      }
      if (reportRes.status === 'fulfilled') {
        setReport(reportRes.value);
      }
      if (logsRes.status === 'fulfilled') {
        setLogs(logsRes.value.logs);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling loop (faster polling if pipeline is running)
  useEffect(() => {
    const intervalMs = status?.isRunning ? 3000 : 10000;
    const timer = setInterval(() => {
      loadData();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [status?.isRunning, loadData]);

  const handleTriggerRun = async () => {
    await triggerPipeline();
    await loadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar status={status} onRefresh={loadData} isRefreshing={isRefreshing} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Action Bar / Control Panel */}
        <ControlPanel
          status={status}
          onTriggerRun={handleTriggerRun}
          onOpenReportsModal={() => setIsReportsOpen(true)}
          lastUpdated={report?.timestamp || null}
        />

        {/* Metrics Cards */}
        <StatsCards summary={report?.summary || null} loading={!report && isRefreshing} />

        {/* Live Execution Logs */}
        <LogConsole logs={logs} isRunning={status?.isRunning || false} />

        {/* Searchable Test Cases Table */}
        <TestTable tests={report?.tests || []} loading={!report && isRefreshing} />
      </main>

      {/* Reports & PDF Downloads Modal */}
      <ReportsModal isOpen={isReportsOpen} onClose={() => setIsReportsOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        DosUAT Automation Hub &bull; Playwright E2E Runner &bull; Deployable on Railway & Netlify
      </footer>
    </div>
  );
}

export default App;
