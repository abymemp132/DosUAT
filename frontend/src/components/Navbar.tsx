import React, { useState } from 'react';
import { Activity, RefreshCw, Server, Globe, Settings, Check, X, Link2 } from 'lucide-react';
import { StatusResponse, getStoredApiUrl, setStoredApiUrl } from '../api';

interface NavbarProps {
  status: StatusResponse | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ status, onRefresh, isRefreshing }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getStoredApiUrl());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredApiUrl(apiUrlInput);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsSettingsOpen(false);
      onRefresh();
    }, 1000);
  };

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
    <>
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 px-6 py-4">
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 text-xs bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition-all"
              title="Configure Railway Backend API URL"
            >
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Backend URL</span>
              <Settings className="w-3.5 h-3.5 text-slate-400" />
            </button>

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

      {/* Backend API URL Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Railway Backend API URL</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Paste your deployed Railway app domain URL below (e.g. <code className="text-indigo-300">https://your-app.up.railway.app</code>). This connects Netlify UI directly to Railway!
            </p>

            <form onSubmit={handleSaveApiUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Railway Backend URL
                </label>
                <input
                  type="url"
                  placeholder="https://dosuat-production-xxxx.up.railway.app"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              {savedSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Saved! Connecting to Railway Backend...</span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
