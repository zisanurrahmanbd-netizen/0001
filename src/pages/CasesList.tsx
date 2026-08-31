import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { StatusBadge } from '../components/StatusBadge';
import { CaseFile, CaseStatus } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  ArrowUpDown, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Coins, 
  Calendar 
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface CasesListProps {
  onSelectCase: (caseId: number) => void;
  searchQuery?: string;
}

export const CasesList: React.FC<CasesListProps> = ({ onSelectCase, searchQuery = '' }) => {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { t } = useLanguage();
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>('');

  const banks = dataService.getBanks();
  const allCases = useMemo(() => {
    return user ? dataService.getCases(user) : [];
  }, [user]);

  const filteredCases = useMemo(() => {
    const q = (searchQuery || localSearch).toLowerCase().trim();
    return allCases.filter(c => {
      // Bank filter
      if (bankFilter !== 'all' && String(c.bank_id) !== bankFilter) return false;
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      // Search
      if (q) {
        const matchesFile = c.file_number.toLowerCase().includes(q);
        const matchesCust = c.customer_name.toLowerCase().includes(q);
        const matchesPhone = (c.customer_phone || '').includes(q);
        const matchesAcc = (c.account_number || '').toLowerCase().includes(q);
        if (!matchesFile && !matchesCust && !matchesPhone && !matchesAcc) return false;
      }
      return true;
    });
  }, [allCases, bankFilter, statusFilter, searchQuery, localSearch]);

  const handleExportCSV = () => {
    const data = filteredCases.map(c => ({
      'File No': c.file_number,
      'Bank': c.bank?.name || '',
      'Product': c.product?.name || '',
      'Account / Card': c.account_number || '',
      'Customer Name': c.customer_name,
      'Phone': c.customer_phone || '',
      'Present Address': c.customer_address_present || '',
      'Outstanding (BDT)': c.outstanding_amount,
      'Overdue (BDT)': c.overdue_amount,
      'Status': c.status,
      'Legal Status': c.legal_status || '',
      'Allocation Date': c.allocation_date || '',
      'Expiry Date': c.expiry_date || '',
      'Total Collected (BDT)': c.total_collected_amount
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cases');
    XLSX.writeFile(wb, `Recovery_Cases_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const statuses: { id: string; label: string }[] = [
    { id: 'all', label: 'All Statuses' },
    { id: 'new', label: 'New' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'visited', label: 'Visited' },
    { id: 'broken_promise', label: 'Broken Promise' },
    { id: 'disputed', label: 'Disputed' },
    { id: 'legal', label: 'Legal' },
    { id: 'untraceable', label: 'Untraceable' },
    { id: 'settled', label: 'Settled' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('cases.title', 'Bank & MNC Files')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Showing {filteredCases.length} {t('cases.subtitle', 'assigned institutional bank & corporate recovery files')}
          </p>
        </div>

        {can('export_excel') && (
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-2 transition-all shadow-sm border border-slate-700/50"
          >
            <Download className="w-4 h-4" />
            <span>{t('cases.export_excel', 'Export Excel (.XLSX)')}</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('cases.search', 'Search file, name, phone...')}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Bank Filter */}
          <div>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="all">All Partner Banks</option>
              {banks.map(b => (
                <option key={b.id} value={String(b.id)}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Case Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">File No / Account</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Bank & Product</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4">Address Visited</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">{t('cases.no_records', 'No case files found')}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('cases.no_records_hint', 'Import cases via Excel or adjust your filters')}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {filteredCases.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white font-mono">{c.file_number}</div>
                    <div className="text-[11px] text-slate-500">{c.account_number || 'N/A'}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{c.customer_name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{c.customer_phone || 'No phone'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{c.bank?.name}</div>
                    <div className="text-[10px] text-slate-400">{c.product?.name}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-bold text-slate-900 dark:text-white font-mono">
                      BDT {c.outstanding_amount.toLocaleString()}
                    </div>
                    {c.overdue_amount > 0 && (
                      <div className="text-[10px] text-rose-500 font-semibold">
                        OD: BDT {c.overdue_amount.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        c.present_address_visited ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        <MapPin className="w-3 h-3" /> Pres
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        c.permanent_address_visited ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        <MapPin className="w-3 h-3" /> Perm
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 text-xs">
                    {c.expiry_date || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectCase(c.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all"
                    >
                      Open Case
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};