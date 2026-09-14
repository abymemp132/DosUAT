import React, { useState } from 'react';
import { Play, Loader2, Clock, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { StatusResponse } from '../api';

interface ControlPanelProps {
  status: StatusResponse | null;
  onTriggerRun: () => Promise<void>;
  onOpenReportsModal: () => void;
  lastUpdated: string | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  status,
  onTriggerRun,
  onOpenReportsModal,
  lastUpdated
}) => {
  const [triggering, setTriggering] = useState(false);

  const handleTrigger = async () => {
    try {
      setTriggering(true);
      await onTriggerRun();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to trigger test pipeline run.');
    } finally {
      setTriggering(false);
    }
  };

  const isRunning = status?.isRunning || false;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-6">
      {/* Left Column: Primary Action & Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          onClick={handleTrigger}
          disabled={isRunning || triggering}
          className={`flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg ${
            isRunning || triggering
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isRunning || triggering ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              <span>Pipeline Running...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current text-white" />
              <span>Run Pipeline Now</span>
            </>
          )}
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Schedule: Daily Cron @ 07:21 AM IST</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5">
            {lastUpdated ? `Last run report updated: ${new Date(lastUpdated).toLocaleString()}` : 'No run recorded yet'}
          </span>
        </div>
      </div>

      {/* Right Column: Quick Links & PDF Reports */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onOpenReportsModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all"
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>View Reports & PDFs</span>
        </button>

        <a
          href="/reports/dashboard-static/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-all"
        >
          <span>Open Full HTML Dashboard</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
