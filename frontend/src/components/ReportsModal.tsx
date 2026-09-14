import React, { useEffect, useState } from 'react';
import { X, FileText, Download, ExternalLink, RefreshCcw } from 'lucide-react';
import { fetchAvailableReports, AvailableReportsResponse } from '../api';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<AvailableReportsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await fetchAvailableReports();
      setData(res);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Generated Test Reports</h3>
              <p className="text-xs text-slate-400">Download PDF reports & view static HTML dashboards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading reports...</div>
          ) : (
            <>
              {/* PDF Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  PDF Test Reports
                </h4>
                {data?.pdfs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No PDF reports generated yet. Run pipeline to generate one.</p>
                ) : (
                  <div className="space-y-2">
                    {data?.pdfs.map((pdf, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-rose-400" />
                          <span className="text-xs font-medium text-slate-200">{pdf.name}</span>
                        </div>
                        <a
                          href={pdf.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Static HTML Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  HTML Dashboards
                </h4>
                {data?.htmls.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No static HTML reports found.</p>
                ) : (
                  <div className="space-y-2">
                    {data?.htmls.map((html, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-medium text-slate-200">{html.name}</span>
                        </div>
                        <a
                          href={html.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-medium text-indigo-300 hover:text-indigo-200 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={loadReports}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reload Files</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
