import React from 'react';
import { CaseStatus } from '../types';

export const StatusBadge: React.FC<{ status: CaseStatus | string }> = ({ status }) => {
  const configs: Record<string, { bg: string; text: string; label: string; border: string }> = {
    new: { bg: 'bg-blue-500/10 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', label: 'New' },
    in_progress: { bg: 'bg-amber-500/10 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', label: 'In Progress' },
    visited: { bg: 'bg-purple-500/10 dark:bg-purple-950/60', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20', label: 'Visited' },
    broken_promise: { bg: 'bg-rose-500/10 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20', label: 'Broken Promise' },
    disputed: { bg: 'bg-orange-500/10 dark:bg-orange-950/60', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', label: 'Disputed' },
    legal: { bg: 'bg-red-500/10 dark:bg-red-950/60', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20', label: 'Legal Case' },
    untraceable: { bg: 'bg-slate-500/10 dark:bg-slate-800/60', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/20', label: 'Untraceable' },
    settled: { bg: 'bg-emerald-500/10 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', label: 'Settled' },
    closed: { bg: 'bg-zinc-500/10 dark:bg-zinc-900', text: 'text-zinc-500', border: 'border-zinc-700', label: 'Closed' },
  };

  const c = configs[status] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
};