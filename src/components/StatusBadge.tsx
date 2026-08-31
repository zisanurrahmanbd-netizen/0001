import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CaseStatus } from '../types';

export const StatusBadge: React.FC<{ status: CaseStatus | string }> = ({ status }) => {
  const { t } = useLanguage();

  const configs: Record<string, { bg: string; text: string; label: string; border: string }> = {
    new: { bg: 'bg-blue-500/10 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', label: t('status.new', 'New') },
    in_progress: { bg: 'bg-amber-500/10 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', label: t('status.in_progress', 'In Progress') },
    visited: { bg: 'bg-purple-500/10 dark:bg-purple-950/60', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20', label: t('status.visited', 'Visited') },
    broken_promise: { bg: 'bg-rose-500/10 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20', label: t('status.broken_promise', 'Broken Promise') },
    disputed: { bg: 'bg-orange-500/10 dark:bg-orange-950/60', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', label: t('status.disputed', 'Disputed') },
    legal: { bg: 'bg-red-500/10 dark:bg-red-950/60', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20', label: t('status.legal', 'Legal Case') },
    untraceable: { bg: 'bg-slate-500/10 dark:bg-slate-800/60', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/20', label: t('status.untraceable', 'Untraceable') },
    settled: { bg: 'bg-emerald-500/10 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', label: t('status.settled', 'Settled') },
    closed: { bg: 'bg-zinc-500/10 dark:bg-zinc-900', text: 'text-zinc-500', border: 'border-zinc-700', label: t('status.closed', 'Closed') },

    // Bank Credit / Loan Classifications
    df: { bg: 'bg-red-500/10 dark:bg-red-950/60', text: 'text-red-600 dark:text-red-400 font-black', border: 'border-red-500/30', label: 'DF (Doubtful)' },
    bl: { bg: 'bg-rose-600/15 dark:bg-rose-950/80', text: 'text-rose-600 dark:text-rose-300 font-black', border: 'border-rose-500/40', label: 'BL (Bad & Loss)' },
    ss: { bg: 'bg-amber-500/10 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400 font-bold', border: 'border-amber-500/30', label: 'SS (Substandard)' },
    sma: { bg: 'bg-yellow-500/10 dark:bg-yellow-950/60', text: 'text-yellow-600 dark:text-yellow-400 font-bold', border: 'border-yellow-500/30', label: 'SMA' },
    std: { bg: 'bg-emerald-500/10 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400 font-bold', border: 'border-emerald-500/30', label: 'STD (Standard)' },
    uc: { bg: 'bg-blue-500/10 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400 font-bold', border: 'border-blue-500/30', label: 'UC' },
    npl: { bg: 'bg-red-600/15 dark:bg-red-950/80', text: 'text-red-600 dark:text-red-300 font-black', border: 'border-red-500/40', label: 'NPL' },
  };

  const statusKey = String(status || '').toLowerCase().trim();
  const c = configs[statusKey] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300 font-bold', border: 'border-slate-300 dark:border-slate-700', label: String(status) };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
};