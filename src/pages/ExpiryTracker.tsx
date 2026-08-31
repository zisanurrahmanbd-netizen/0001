import React from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { CalendarClock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ExpiryTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const cases = dataService.getCases(user || DEMO_USERS[0]);
  const banks = dataService.getBanks();

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 86400000);
  const thirtyDays = new Date(now.getTime() + 30 * 86400000);

  const matrix = banks.map(b => {
    const bankCases = cases.filter(c => c.bank_id === b.id);
    const active = bankCases.filter(c => !['settled', 'closed'].includes(c.status)).length;
    const expiring7 = bankCases.filter(c => {
      if (!c.expiry_date || ['settled', 'closed'].includes(c.status)) return false;
      const d = new Date(c.expiry_date);
      return d >= now && d <= sevenDays;
    }).length;
    const expiring30 = bankCases.filter(c => {
      if (!c.expiry_date || ['settled', 'closed'].includes(c.status)) return false;
      const d = new Date(c.expiry_date);
      return d > sevenDays && d <= thirtyDays;
    }).length;
    const expired = bankCases.filter(c => {
      if (!c.expiry_date || ['settled', 'closed'].includes(c.status)) return false;
      return new Date(c.expiry_date) < now;
    }).length;
    const settled = bankCases.filter(c => c.status === 'settled').length;

    return {
      bankName: b.name,
      active,
      expiring7,
      expiring30,
      expired,
      settled,
      total: bankCases.length
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('expiry.title', 'Portfolio Expiry Matrix & Allocation Tracker')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('expiry.subtitle', 'Monitor contract expiration buckets across partner banks and recovery mandates')}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{t('cases.bank_product', 'Partner Bank')}</th>
                <th className="py-3 px-4 text-center">{t('expiry.active', 'Active Pipeline')}</th>
                <th className="py-3 px-4 text-center text-amber-500">{t('expiry.expiring_7', 'Expiring ≤7 Days')}</th>
                <th className="py-3 px-4 text-center text-blue-500">{t('expiry.expiring_30', 'Expiring 8-30 Days')}</th>
                <th className="py-3 px-4 text-center text-rose-500">{t('expiry.expired', 'Expired Mandates')}</th>
                <th className="py-3 px-4 text-center text-emerald-500">{t('status.settled', 'Settled Accounts')}</th>
                <th className="py-3 px-4 text-right">{t('dash.total_allocated', 'Total Cases')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {matrix.map((row) => (
                <tr key={row.bankName} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {row.bankName}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                    {row.active}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {row.expiring7}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-blue-600 dark:text-blue-400">
                    {row.expiring30}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-rose-600 dark:text-rose-400">
                    {row.expired}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {row.settled}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {row.total}
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