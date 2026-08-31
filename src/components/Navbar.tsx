import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, Search, UserCheck, Shield, ChevronDown, Palette } from 'lucide-react';
import { BrandingModal } from './BrandingModal';
import { RolePermissionsModal } from './RolePermissionsModal';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  onSearch?: (query: string) => void;
  onMenuToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch, onMenuToggle }) => {
  const { user, logout, users } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [showPermsModal, setShowPermsModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <i className="fa-solid fa-bars text-lg"></i>
          </button>

          <div className="relative w-full hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('top.search_placeholder', 'Quick search file #, customer, phone...')}
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Admin Role & Permission Control */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowPermsModal(true)}
              title="Configure Role & User Access Permissions"
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition-all border border-indigo-500/20 shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden xl:inline">{t('top.permissions', 'Permissions')}</span>
            </button>
          )}

          {/* Admin Branding Customizer */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowBrandingModal(true)}
              title="Customize Logo, Head Text & Subtitle"
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center gap-1.5 transition-all border border-purple-500/20 shadow-sm"
            >
              <Palette className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden xl:inline">{t('top.branding', 'Edit Logo & Brand')}</span>
            </button>
          )}

          {/* Live status badge */}
          <div className="hidden 2xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t('top.live_status', 'Supabase Live')}</span>
          </div>

          {/* 1-Click Language Switcher (EN / বাংলা) */}
          <LanguageToggle />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? t('top.light_mode', 'Light Mode') : t('top.dark_mode', 'Dark Mode')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* User Dropdown & Role Switching */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-950/30 flex-shrink-0">
                {user?.name.charAt(0)}
              </div>
              <div className="hidden lg:block text-left max-w-[110px] xl:max-w-[150px]">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-400 capitalize truncate">{user?.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                      {user?.role}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {users.length} {users.length === 1 ? 'user' : 'users'} in system
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* Admin Branding Customizer Modal */}
      <BrandingModal
        isOpen={showBrandingModal}
        onClose={() => setShowBrandingModal(false)}
      />

      {/* Admin Role & Permissions Control Modal */}
      <RolePermissionsModal
        isOpen={showPermsModal}
        onClose={() => setShowPermsModal(false)}
      />
    </>
  );
};