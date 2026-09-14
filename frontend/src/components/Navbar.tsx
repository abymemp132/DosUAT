import React from 'react';
import { Activity, RefreshCw, Server, Globe, ShieldCheck } from 'lucide-react';
import { StatusResponse } from '../api';

interface NavbarProps {
  status: StatusResponse | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ status, onRefresh, isRefreshing }) => {
  const getStatusBadge = () => {
    if (!status) return <span className="text-slate-400 bg-slate-800 px-3 py-1 rounded-full text-xs font-medium">Connecting...</span>;
    switch (status.status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Pipeline Running
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Passed (Exit 0)
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Failed (Exit {status.lastRunExitCode ?? 1})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Idle
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">DosUAT Test Control Hub</h1>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Playwright E2E Automation Pipeline Management</p>
          </div>
        </div>

        {/* Live Status & Host Info */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-md">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>Railway Backend</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-md">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Netlify App</span>
            </div>
          </div>

          {getStatusBadge()}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors flex items-center justify-center"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
