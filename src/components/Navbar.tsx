import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, Search, UserCheck, Shield, ChevronDown } from 'lucide-react';

interface NavbarProps {
  onSearch?: (query: string) => void;
  onMenuToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch, onMenuToggle }) => {
  const { user, logout, switchUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
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
            placeholder="Quick search file #, customer, phone..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Live status badge */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Supabase Live</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Light / Dark Mode"
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* User Dropdown & Role Switching */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-950/30">
              {user?.name.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>{user?.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  user?.role === 'admin' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300' :
                  user?.role === 'manager' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300' :
                  'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                }`}>
                  {user?.role}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{user?.email}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Switch Persona (Demo)</p>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.email);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all ${
                      user?.id === u.id
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{u.name}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">({u.role})</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-1">
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-semibold transition-all"
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
  );
};