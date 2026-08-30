import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { StatusBadge } from '../components/StatusBadge';
import { 
  FolderCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Coins, 
  Users, 
  TrendingUp, 
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Building2
} from 'lucide-react';

interface DashboardProps {
  onSelectCase: (caseId: number) => void;
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectCase, onNavigate }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      const data = dataService.getDashboardMetrics(user);
      setMetrics(data);
      setCases(dataService.getCases(user));
    }
  }, [user]);

  if (!metrics) return <div className="p-8 text-center text-slate-500">Loading dashboard metrics...</div>;

  const { summary, charts } = metrics;
  const expiringCases = cases.filter(c => c.expiry_date && !['settled', 'closed'].includes(c.status)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Operational Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-bank debt recovery tracking & agent telemetry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('imports')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <i className="fa-solid fa-file-excel"></i>
            <span>Import / Templates</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Portfolio</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              BDT {summary.total_outstanding.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">{summary.total_files}</span> cases assigned
            </div>
          </div>
        </div>

        {/* Total Recovered */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              BDT {summary.total_collected.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {summary.total_outstanding > 0 ? ((summary.total_collected / summary.total_outstanding) * 100).toFixed(1) : 0}%
              </span> recovery rate
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiring ≤7 Days</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {summary.expiring_soon_count}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Urgent bank contract expiry
            </div>
          </div>
        </div>

        {/* Field Agents Online */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Agents</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{summary.online_agents_count}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Live telemetry active
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid: Bank Breakdown & Urgent Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bank Allocation Portfolio */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-500" />
            <span>Bank Portfolio Distribution</span>
          </h3>

          <div className="space-y-4">
            {charts.files_by_bank.labels.map((bankName: string, i: number) => {
              const count = charts.files_by_bank.counts[i];
              const outstanding = charts.files_by_bank.outstandings[i];
              const pct = summary.total_outstanding > 0 ? ((outstanding / summary.total_outstanding) * 100).toFixed(0) : 0;
              return (
                <div key={bankName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{bankName}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">BDT {outstanding.toLocaleString()} ({count} cases)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : 'bg-purple-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Urgent Expiry Cases Table */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Urgent Expiry Cases Watchlist</span>
            </h3>
            <button
              onClick={() => onNavigate('cases')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="pb-3">File / Customer</th>
                  <th className="pb-3">Bank / Product</th>
                  <th className="pb-3 text-right">Outstanding</th>
                  <th className="pb-3">Expiry Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {expiringCases.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 font-medium">
                      <div className="text-slate-900 dark:text-white font-bold">{c.customer_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{c.file_number}</div>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      <div>{c.bank?.name || 'Bank'}</div>
                      <div className="text-[10px] text-slate-400">{c.product?.name}</div>
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      BDT {c.outstanding_amount.toLocaleString()}
                    </td>
                    <td className="py-3 text-amber-600 dark:text-amber-400 font-mono font-semibold">
                      {c.expiry_date || 'N/A'}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onSelectCase(c.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all text-xs"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};