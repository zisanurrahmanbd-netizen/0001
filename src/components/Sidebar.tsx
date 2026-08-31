import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
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
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const { user } = useAuth();
  const { branding } = useBranding();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'agent'] },
    { id: 'cases', label: 'Bank & MNC Files', icon: Briefcase, roles: ['admin', 'manager', 'agent'] },
    { id: 'map', label: 'Live Agent Map', icon: MapPin, roles: ['admin', 'manager'] },
    { id: 'imports', label: 'Excel Templates & Import', icon: FileSpreadsheet, roles: ['admin'] },
    { id: 'contacts', label: 'Bank Contacts', icon: PhoneCall, roles: ['admin', 'manager', 'agent'] },
    { id: 'reports_perf', label: 'Agent Performance', icon: TrendingUp, roles: ['admin', 'manager'] },
    { id: 'reports_expiry', label: 'Expiry Tracker', icon: CalendarClock, roles: ['admin', 'manager'] },
    { id: 'reports_legal', label: 'Legal & Flagged Cases', icon: ShieldAlert, roles: ['admin', 'manager', 'agent'] },
    { id: 'team', label: 'Team Management', icon: Users, roles: ['admin'] },
  ];

  const allowedItems = navItems.filter(item => user && item.roles.includes(user.role));

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
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Dynamic Logo Brand Header */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-lg shadow-lg shadow-emerald-950/30 overflow-hidden flex-shrink-0">
              {branding.customLogoUrl ? (
                <img src={branding.customLogoUrl} alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : (
                <i className={`fa-solid ${branding.logoIcon || 'fa-vault'}`}></i>
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
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-8rem)]">
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
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
              <p className="text-[10px] text-slate-400 capitalize truncate">{user?.role} • {user?.employee_id || 'ID'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};