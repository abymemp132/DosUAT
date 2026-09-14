import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, AlertTriangle, Filter } from 'lucide-react';
import { TestCase } from '../api';

interface TestTableProps {
  tests: TestCase[];
  loading: boolean;
}

export const TestTable: React.FC<TestTableProps> = ({ tests, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTests = tests.filter((test) => {
    const matchesSearch =
      test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (test.file && test.file.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'passed' && test.status === 'passed') ||
      (statusFilter === 'failed' && (test.status === 'failed' || test.status === 'timedOut')) ||
      (statusFilter === 'skipped' && test.status === 'skipped');

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            Passed
          </span>
        );
      case 'failed':
      case 'timedOut':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            {status === 'timedOut' ? 'Timed Out' : 'Failed'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            Skipped
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Test Suite Cases</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 font-mono">
              {filteredTests.length} / {tests.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Detailed specification status and execution timings</p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Status</option>
              <option value="passed" className="bg-slate-900 text-white">Passed Only</option>
              <option value="failed" className="bg-slate-900 text-white">Failed Only</option>
              <option value="skipped" className="bg-slate-900 text-white">Skipped</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading test cases...</div>
        ) : filteredTests.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No test cases found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or status filter</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Test Case Title</th>
                <th className="py-3.5 px-5">Spec File</th>
                <th className="py-3.5 px-5 text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTests.map((test, index) => (
                <tr key={index} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-5 whitespace-nowrap">{getStatusBadge(test.status)}</td>
                  <td className="py-3.5 px-5">
                    <div className="font-medium text-slate-200">{test.title}</div>
                    {test.error && (
                      <div className="mt-1.5 p-2 rounded-lg bg-rose-950/40 border border-rose-800/50 text-[11px] text-rose-300 font-mono overflow-x-auto max-w-xl">
                        {test.error}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                    {test.file || 'tests/suite'}
                  </td>
                  <td className="py-3.5 px-5 text-right text-slate-400 font-mono">
                    {(test.duration / 1000).toFixed(2)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
