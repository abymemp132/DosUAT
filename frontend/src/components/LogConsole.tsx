import React, { useEffect, useRef } from 'react';
import { Terminal, Copy, Check, Trash2 } from 'lucide-react';

interface LogConsoleProps {
  logs: string[];
  isRunning: boolean;
}

export const LogConsole: React.FC<LogConsoleProps> = ({ logs, isRunning }) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
      {/* Console Header */}
      <div className="bg-slate-900/80 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Live Execution Output Console
          </h3>
          {isRunning && (
            <span className="flex items-center gap-1.5 text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold animate-pulse ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Streaming Logs...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors disabled:opacity-50"
            title="Copy Logs to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="p-4 bg-slate-950 font-mono text-[11px] text-slate-300 h-64 overflow-y-auto space-y-1">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
            Console log stream is idle. Click "Run Pipeline Now" to execute tests and view live output.
          </div>
        ) : (
          logs.map((log, idx) => {
            const isError = log.includes('❌') || log.includes('ERR') || log.includes('Failed');
            const isSuccess = log.includes('✅') || log.includes('Passed');
            const isHeader = log.includes('===') || log.includes('🚀');

            return (
              <div
                key={idx}
                className={`leading-relaxed break-all ${
                  isError
                    ? 'text-rose-400 font-semibold'
                    : isSuccess
                    ? 'text-emerald-400 font-semibold'
                    : isHeader
                    ? 'text-indigo-400 font-bold'
                    : 'text-slate-300'
                }`}
              >
                {log}
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
