import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../context/PermissionsContext";
import { useLanguage } from "../context/LanguageContext";
import { dataService } from "../services/dataService";
import { StatusBadge } from "../components/StatusBadge";
import { CaseFile, CaseStatus } from "../types";
import { 
  Search, 
  Download, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Trash2, 
  CheckSquare, 
  Square, 
  AlertTriangle,
  UserCheck,
  UserX
} from "lucide-react";
import * as XLSX from "xlsx";

interface CasesListProps {
  onSelectCase: (caseId: number) => void;
  searchQuery?: string;
}

export const CasesList: React.FC<CasesListProps> = ({ onSelectCase, searchQuery = "" }) => {
  const { user, users } = useAuth();
  const { can } = usePermissions();
  const { t } = useLanguage();
  const [bankFilter, setBankFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [localSearch, setLocalSearch] = useState<string>("" );
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setDataVersion(v => v + 1);
    });
    return unsub;
  }, []);

  const banks = dataService.getBanks();
  const allCases = useMemo(() => user ? dataService.getCases(user) : [], [user, dataVersion]);

  const filteredCases = useMemo(() => {
    const q = (searchQuery || localSearch).toLowerCase().trim();
    return allCases.filter(c => {
      if (bankFilter !== "all" && String(c.bank_id) !== bankFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (q) {
        const matchesFile = c.file_number.toLowerCase().includes(q);
        const matchesCust = c.customer_name.toLowerCase().includes(q);
        const matchesPhone = (c.customer_phone || "").includes(q);
        const matchesAcc = (c.account_number || "").toLowerCase().includes(q);
        const matchesAgent = (c.agent_name || "").toLowerCase().includes(q);
        if (!matchesFile && !matchesCust && !matchesPhone && !matchesAcc && !matchesAgent) return false;
      }
      return true;
    });
  }, [allCases, bankFilter, statusFilter, searchQuery, localSearch]);

  const allFilteredIds = filteredCases.map(c => c.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id));
  const someSelected = allFilteredIds.some(id => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allFilteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allFilteredIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const toggleOne = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    dataService.deleteCases(Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
    setLocalSearch(prev => prev + "");
  };

  const handleExportCSV = () => {
    const casesToExport = selectedIds.size > 0 
      ? filteredCases.filter(c => selectedIds.has(c.id)) 
      : filteredCases;

    const data = casesToExport.map(c => ({
      "File No": c.file_number,
      "Bank": c.bank?.name || "",
      "Product": c.product?.name || "",
      "Account / Card": c.account_number || "",
      "Customer Name": c.customer_name,
      "Phone": c.customer_phone || "",
      "Agent Name": c.agent_name || c.agent?.name || "Unassigned",
      "Present Address": c.customer_address_present || "",
      "Outstanding (BDT)": c.outstanding_amount,
      "Overdue (BDT)": c.overdue_amount,
      "Status": c.status,
      "Legal Status": c.legal_status || "",
      "Allocation Date": c.allocation_date || "",
      "Expiry Date": c.expiry_date || "",
      "Total Collected (BDT)": c.total_collected_amount
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cases");
    XLSX.writeFile(wb, `Recovery_Cases_Export_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const statuses = [
    { id: "all", label: "All Statuses" },
    { id: "new", label: "New" },
    { id: "in_progress", label: "In Progress" },
    { id: "visited", label: "Visited" },
    { id: "broken_promise", label: "Broken Promise" },
    { id: "disputed", label: "Disputed" },
    { id: "legal", label: "Legal" },
    { id: "untraceable", label: "Untraceable" },
    { id: "settled", label: "Settled" },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t("cases.title", "Bank & MNC Files")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Showing {filteredCases.length} {t("cases.subtitle", "assigned recovery files")}
            {selectedIds.size > 0 && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                ✓ {selectedIds.size} files selected
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bulk Delete Button */}
          {selectedIds.size > 0 && can("manage_team_users") && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          )}

          {can("export_excel") && (
            <button 
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-2 transition-all shadow-sm border border-slate-700/50"
            >
              <Download className="w-4 h-4" />
              <span>{selectedIds.size > 0 ? `Export Selected (${selectedIds.size})` : t("cases.export_excel", "Export Excel (.XLSX)")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={t("cases.search", "Search file, name, phone, agent...")} 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" 
            />
          </div>
          <select 
            value={bankFilter} 
            onChange={(e) => setBankFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="all">All Partner Banks</option>
            {banks.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
          </select>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Case Table with Checkboxes & Agent Name Column */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                {/* Select All Checkbox Header */}
                {can("manage_team_users") && (
                  <th className="py-3 px-4 w-10">
                    <button 
                      onClick={toggleSelectAll} 
                      title={allSelected ? "Deselect All" : "Select All"}
                      className="flex items-center justify-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : someSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                )}
                <th className="py-3 px-4">File No / Account</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Bank & Product</th>
                <th className="py-3 px-4">Assigned Agent</th>
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
                  <td colSpan={can("manage_team_users") ? 10 : 9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">{t("cases.no_records", "No case files found")}</p>
                        <p className="text-xs text-slate-400 mt-1">{t("cases.no_records_hint", "Import cases via Excel or adjust your filters")}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {filteredCases.map(c => {
                const isSelected = selectedIds.has(c.id);
                const displayAgent = c.agent_name || c.agent?.name;
                const hasAccount = displayAgent && users.some(u => 
                  u.name.trim().toLowerCase() === displayAgent.trim().toLowerCase() ||
                  (u.employee_id && u.employee_id.trim().toLowerCase() === displayAgent.trim().toLowerCase())
                );

                return (
                  <tr 
                    key={c.id} 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${isSelected ? "bg-blue-50/70 dark:bg-blue-950/30" : ""}`}
                  >
                    {/* Row Selection Checkbox */}
                    {can("manage_team_users") && (
                      <td className="py-3.5 px-4">
                        <button 
                          onClick={() => toggleOne(c.id)} 
                          className="flex items-center justify-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-slate-500" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white font-mono">{c.file_number}</div>
                      <div className="text-[11px] text-slate-500">{c.account_number || "N/A"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{c.customer_name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.customer_phone || "No phone"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{c.bank?.name}</div>
                      <div className="text-[10px] text-slate-400">{c.product?.name}</div>
                    </td>
                    {/* Agent Name column */}
                    <td className="py-3.5 px-4">
                      {displayAgent ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                            hasAccount 
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}>
                            {hasAccount ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            <span>{displayAgent}</span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                      )}
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
                          c.present_address_visited ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        }`}>
                          <MapPin className="w-3 h-3" /> Pres
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          c.permanent_address_visited ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        }`}>
                          <MapPin className="w-3 h-3" /> Perm
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.legal_status && c.legal_status !== "Normal Recovery" ? c.legal_status : c.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 text-xs">
                      {c.expiry_date || "N/A"}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Confirm Bulk Delete</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  You are about to permanently delete <strong className="text-rose-500">{selectedIds.size} case file{selectedIds.size > 1 ? "s" : ""}</strong> from the system database. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete {selectedIds.size} Files</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};