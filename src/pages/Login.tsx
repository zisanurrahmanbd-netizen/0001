import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Sun, Moon, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, switchUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [email, setEmail] = useState('admin@recovery.local');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = login(email, password);
    if (!ok) {
      setError('Invalid credentials. You can use any demo password (e.g. password123).');
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    switchUser(demoEmail);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100 relative">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold hover:border-slate-700 transition-all shadow-md"
        >
          {theme === 'dark' ? (
            <span className="inline-flex items-center gap-1.5 text-amber-300">
              <Sun className="w-4 h-4" />
              <span>Light Mode</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-indigo-400">
              <Moon className="w-4 h-4" />
              <span>Dark Mode</span>
            </span>
          )}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-2xl mb-4 shadow-xl shadow-emerald-950/60">
            <i className="fa-solid fa-vault"></i>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Bank Recovery Tracking</h2>
          <p className="text-sm text-slate-400 mt-1">Multi-Bank Loan & Credit Card File Tracking System</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/80">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@recovery.local"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/70 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/70 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/30" />
                <span className="text-xs text-slate-400">Remember this device</span>
              </label>
              <span className="text-xs text-slate-500 font-mono">Demo Mode</span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 mt-2"
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              1-Click Demo Personas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@recovery.local')}
                className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 hover:bg-purple-900/60 text-purple-300 text-xs font-medium text-center transition-all flex flex-col items-center gap-0.5"
              >
                <span className="font-bold text-[11px] uppercase">Admin</span>
                <span className="text-[10px] text-purple-400/80">admin@...</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('manager.dhaka@recovery.local')}
                className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 hover:bg-blue-900/60 text-blue-300 text-xs font-medium text-center transition-all flex flex-col items-center gap-0.5"
              >
                <span className="font-bold text-[11px] uppercase">Manager</span>
                <span className="text-[10px] text-blue-400/80">dhaka@...</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('agent.rahim@recovery.local')}
                className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-medium text-center transition-all flex flex-col items-center gap-0.5"
              >
                <span className="font-bold text-[11px] uppercase">Field Agent</span>
                <span className="text-[10px] text-emerald-400/80">rahim@...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};