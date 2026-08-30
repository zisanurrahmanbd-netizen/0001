import React, { useState } from 'react';
import { useBranding, DEFAULT_BRANDING, BrandingConfig } from '../context/BrandingContext';
import { Sparkles, Palette, Save, RotateCcw, X, Image, Type } from 'lucide-react';

interface BrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_ICONS = [
  { class: 'fa-vault', label: 'Vault' },
  { class: 'fa-building-columns', label: 'Bank' },
  { class: 'fa-shield-halved', label: 'Security' },
  { class: 'fa-landmark', label: 'Landmark' },
  { class: 'fa-coins', label: 'Coins' },
  { class: 'fa-scale-balanced', label: 'Legal' },
  { class: 'fa-briefcase', label: 'Briefcase' },
  { class: 'fa-chart-pie', label: 'Analytics' },
];

export const BrandingModal: React.FC<BrandingModalProps> = ({ isOpen, onClose }) => {
  const { branding, updateBranding, resetBranding } = useBranding();
  const [form, setForm] = useState<BrandingConfig>({ ...branding });
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding(form);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 500);
  };

  const handleReset = () => {
    if (confirm('Reset system branding and logo back to defaults?')) {
      resetBranding();
      setForm(DEFAULT_BRANDING);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Brand & Logo Customizer (Admin)
              </h3>
              <p className="text-[11px] text-slate-500">
                Customize system name, logo icon/image, and subtitles across the app
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Header Preview</span>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-950/30 overflow-hidden">
              {form.customLogoUrl ? (
                <img src={form.customLogoUrl} alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : (
                <i className={`fa-solid ${form.logoIcon}`}></i>
              )}
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight leading-none">
                {form.headerText || 'RecoveryPRO'}
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {form.underText || 'Bank Telemetry V2'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Logo / Icon Selection */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Select Preset Logo Icon</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_ICONS.map(icon => (
                <button
                  type="button"
                  key={icon.class}
                  onClick={() => setForm({ ...form, logoIcon: icon.class, customLogoUrl: '' })}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    form.logoIcon === icon.class && !form.customLogoUrl
                      ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <i className={`fa-solid ${icon.class} text-base`}></i>
                  <span className="text-[10px]">{icon.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Custom Image URL */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-emerald-500" />
              <span>Or Custom Logo Image URL (Optional)</span>
            </label>
            <input
              type="url"
              value={form.customLogoUrl}
              onChange={(e) => setForm({ ...form, customLogoUrl: e.target.value })}
              placeholder="https://example.com/your-company-logo.png"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 font-medium"
            />
          </div>

          {/* Sidebar / Top Header Texts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Main Header Text (Sidebar / App Title)
              </label>
              <input
                type="text"
                required
                value={form.headerText}
                onChange={(e) => setForm({ ...form, headerText: e.target.value })}
                placeholder="e.g. RecoveryPRO, Delta Recovery Agency"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Header Under Text (Subtitle)
              </label>
              <input
                type="text"
                required
                value={form.underText}
                onChange={(e) => setForm({ ...form, underText: e.target.value })}
                placeholder="e.g. Bank Telemetry V2, Debt Recovery System"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 font-medium"
              />
            </div>
          </div>

          {/* Login Screen Texts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Login Page Title
              </label>
              <input
                type="text"
                required
                value={form.loginTitle}
                onChange={(e) => setForm({ ...form, loginTitle: e.target.value })}
                placeholder="e.g. Bank Recovery Tracking"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Login Page Under Text
              </label>
              <input
                type="text"
                required
                value={form.loginSubtitle}
                onChange={(e) => setForm({ ...form, loginSubtitle: e.target.value })}
                placeholder="e.g. Multi-Bank Loan & Credit Card File Tracking System"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 font-medium"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl text-slate-500 hover:text-rose-500 font-bold text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <Save className="w-4 h-4" />
                <span>{saveSuccess ? 'Saved!' : 'Apply Branding'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};