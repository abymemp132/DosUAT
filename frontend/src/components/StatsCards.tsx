import React from 'react';
import { CheckCircle2, XCircle, BarChart3, Clock, Percent } from 'lucide-react';
import { SummaryStats } from '../api';

interface StatsCardsProps {
  summary: SummaryStats | null;
  loading: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ summary, loading }) => {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel p-5 rounded-2xl animate-pulse h-28 border border-slate-800" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Test Cases',
      value: summary.total,
      icon: BarChart3,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      badge: 'Full Suite'
    },
    {
      title: 'Passed Tests',
      value: summary.passed,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      badge: `${summary.passed} Specs`
    },
    {
      title: 'Failed Tests',
      value: summary.failed,
      icon: XCircle,
      color: summary.failed > 0 ? 'text-rose-400' : 'text-slate-400',
      bgColor: summary.failed > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-800/50 border-slate-700/50',
      badge: summary.failed > 0 ? 'Action Needed' : 'Clean'
    },
    {
      title: 'Pass Rate %',
      value: `${summary.passRate}%`,
      icon: Percent,
      color: summary.passRate >= 90 ? 'text-cyan-400' : summary.passRate >= 75 ? 'text-amber-400' : 'text-rose-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      badge: `${summary.durationSeconds}s Duration`
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`glass-panel p-5 rounded-2xl border transition-all duration-300 hover:translate-y-[-2px] ${card.bgColor}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
              <div className={`p-2 rounded-xl bg-slate-900/60 border border-slate-800 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold text-white tracking-tight">{card.value}</div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300">
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
