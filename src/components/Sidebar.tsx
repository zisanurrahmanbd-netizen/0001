import React, { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useBranding } from "../context/BrandingContext";
import { usePermissions, PermissionKey } from "../context/PermissionsContext";
import { useLanguage } from "../context/LanguageContext";
import { dataService } from "../services/dataService";
import { 
  LayoutDashboard, 
  Briefcase, 
  MapPin, 
  FileSpreadsheet, 
  Users, 
  PhoneCall, 
  ShieldAlert, 
  TrendingUp, 
  CalendarClock,
  AlertTriangle,
  UserPlus
} from "lucide-react";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const { user, users } = useAuth();
  const { branding } = useBranding();
  const { can } = usePermissions();
  const { t } = useLanguage();

  // Real-time detection of agents mentioned in files whose user accounts are not created yet
  const unregisteredAgents = useMemo(() => {
    return dataService.getUnregisteredAgents(users);
  }, [users, currentPage]);

  // Real-time detection of collectors mentioned in files who are missing from Bank Contacts
  const missingCollectors = useMemo(() => {
    return dataService.getMissingCollectorContacts();
  }, [currentPage]);

  const navItems: { id: string; label: string; icon: any; perm: PermissionKey; badge?: number }[] = [
    { id: "dashboard", label: t("nav.dashboard", "Dashboard"), icon: LayoutDashboard, perm: "view_dashboard" },
    { id: "cases", label: t("nav.cases", "Bank & MNC Files"), icon: Briefcase, perm: "view_cases" },
    { id: "map", label: t("nav.map", "Live Agent Map"), icon: MapPin, perm: "view_map" },
    { id: "imports", label: t("nav.imports", "Excel Templates & Import"), icon: FileSpreadsheet, perm: "view_imports" },
    { 
      id: "contacts", 
      label: t("nav.contacts", "Bank Contacts"), 
      icon: PhoneCall, 
      perm: "view_contacts",
      badge: missingCollectors.length > 0 ? missingCollectors.length : undefined
    },
    { id: "reports_perf", label: t("nav.reports_perf", "Agent Performance"), icon: TrendingUp, perm: "view_reports_perf" },
    { id: "reports_expiry", label: t("nav.reports_expiry", "Expiry Tracker"), icon: CalendarClock, perm: "view_reports_expiry" },
    { id: "reports_legal", label: t("nav.reports_legal", "Legal & Flagged Cases"), icon: ShieldAlert, perm: "view_reports_legal" },
    { 
      id: "team", 
      label: t("nav.team", "Team Management"), 
      icon: Users, 
      perm: "view_team",
      badge: unregisteredAgents.length > 0 ? unregisteredAgents.length : undefined
    },
  ];

  const allowedItems = navItems.filter(item => user && can(item.perm));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Dynamic Logo Brand Header */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-lg shadow-lg shadow-emerald-950/30 overflow-hidden flex-shrink-0">
              {branding.customLogoUrl ? (
                <img src={branding.customLogoUrl} alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <i className={`fa-solid ${branding.logoIcon || "fa-vault"}`}></i>
              )}
            </div>
            <div className="overflow-hidden">
              <h1 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight tracking-tight truncate">
                {branding.headerText}
              </h1>
              <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">
                {branding.underText}
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-10rem)]">
            {allowedItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-sm animate-pulse">
                      ! {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Unregistered Agents Alert Notification in Sidebar */}
            {unregisteredAgents.length > 0 && user?.role === "admin" && (
              <div 
                onClick={() => { onNavigate("team"); onClose(); }}
                className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer space-y-1.5"
                title="Click to register missing agent accounts"
              >
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-extrabold text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse flex-shrink-0" />
                    <span>Unregistered Agents</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[9px]">
                    {unregisteredAgents.length} pending
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {unregisteredAgents.map(a => a.name).join(", ")} found in recovery files. Click to create accounts.
                </p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 pt-0.5">
                  <UserPlus className="w-3 h-3" />
                  <span>Create Agent Accounts →</span>
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* User Card at Bottom */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize truncate">{user?.role} • {user?.employee_id || "ID"}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};