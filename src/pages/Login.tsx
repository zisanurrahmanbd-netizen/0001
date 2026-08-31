import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';
import { useBranding } from '../context/BrandingContext';
import {
  Lock, Mail, Eye, EyeOff, ArrowRight,
  Sun, Moon, ShieldCheck, KeyRound, RefreshCw, CheckCircle2
} from 'lucide-react';

// EmailJS config — set your own service/template IDs in EmailJS dashboard
// Template variables used: {{to_email}}, {{otp_code}}, {{app_name}}, {{expires_minutes}}
const EMAILJS_SERVICE_ID  = 'service_recovery_otp';   // <- replace with your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'template_otp';           // <- replace with your EmailJS template ID
const EMAILJS_PUBLIC_KEY  = 'YOUR_EMAILJS_PUBLIC_KEY'; // <- replace with your EmailJS public key

async function sendOtpEmail(toEmail: string, code: string, appName: string): Promise<boolean> {
  try {
    // Dynamic import so it doesn't block if not configured yet
    const emailjs = await import('@emailjs/browser');
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: toEmail,
        otp_code: code,
        app_name: appName,
        expires_minutes: '10',
      },
      EMAILJS_PUBLIC_KEY
    );
    return true;
  } catch (err) {
    console.error('EmailJS send error:', err);
    return false;
  }
}

type Step = 'credentials' | 'otp';

export const Login: React.FC = () => {
  const { login, verifyOtp, generateOtp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { branding } = useBranding();
  const { t } = useLanguage();

  // ── Credentials step ─────────────────────────────────────────────────────
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── OTP step ──────────────────────────────────────────────────────────────
  const [step, setStep]             = useState<Step>('credentials');
  const [otpEmail, setOtpEmail]     = useState('');
  const [otpCode, setOtpCode]       = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent]       = useState(false);
  const [otpDevMode, setOtpDevMode] = useState(''); // shows code if EmailJS not configured

  // ── Shared ────────────────────────────────────────────────────────────────
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Step 1: Credentials submit ──────────────────────────────────────────
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = login(email.trim(), password);
    setLoading(false);

    if (res.result === 'ok') {
      // Trusted device — logged in directly
      return;
    }
    if (res.result === 'otp_required') {
      // New device — need OTP
      setOtpEmail(email.trim().toLowerCase());
      await handleSendOtp(email.trim().toLowerCase());
      setStep('otp');
      return;
    }
    setError(res.error || 'Login failed.');
  };

  // ─── Send OTP (called automatically after credential check) ──────────────
  const handleSendOtp = async (targetEmail: string) => {
    setOtpSending(true);
    setOtpSent(false);
    const code = generateOtp(targetEmail);

    const emailJsConfigured = EMAILJS_PUBLIC_KEY !== 'YOUR_EMAILJS_PUBLIC_KEY';
    if (emailJsConfigured) {
      const ok = await sendOtpEmail(targetEmail, code, branding.headerText || 'Recovery System');
      if (!ok) {
        // Fallback: show code on screen (development mode)
        setOtpDevMode(code);
      }
    } else {
      // EmailJS not configured yet — show code on screen for admin setup
      setOtpDevMode(code);
    }

    setOtpSending(false);
    setOtpSent(true);
  };

  // ─── Step 2: OTP submit ──────────────────────────────────────────────────
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = verifyOtp(otpEmail, otpCode.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'OTP verification failed.');
      return;
    }
    // Logged in — AuthContext sets user, App re-renders
  };

  const handleResendOtp = async () => {
    setOtpCode('');
    setOtpDevMode('');
    setError('');
    await handleSendOtp(otpEmail);
  };

  const handleBackToLogin = () => {
    setStep('credentials');
    setOtpCode('');
    setOtpDevMode('');
    setError('');
  };

  // ─── UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative transition-colors duration-300">
      {/* Top right controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <LanguageToggle />
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
        >
          {theme === 'dark' ? (
            <span className="inline-flex items-center gap-1.5 text-amber-500">
              <Sun className="w-4 h-4" />
              <span className="hidden sm:inline">{t('top.light_mode', 'Light Mode')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-indigo-600">
              <Moon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('top.dark_mode', 'Dark Mode')}</span>
            </span>
          )}
        </button>
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white text-2xl mb-4 shadow-xl shadow-emerald-600/30 overflow-hidden">
            {branding.customLogoUrl ? (
              <img src={branding.customLogoUrl} alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
            ) : (
              <i className={`fa-solid ${branding.logoIcon || 'fa-vault'}`}></i>
            )}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {step === 'otp'
              ? t('login.otp_title', '2-Step Verification')
              : (branding.loginTitle || t('login.signin_title', branding.headerText))}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {step === 'otp'
              ? t('login.otp_subtitle', 'Enter the 6-digit code sent to your email')
              : (branding.loginSubtitle || t('login.signin_subtitle', branding.underText))}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/80 transition-colors">

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: Credentials ─────────────────────────────────────── */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  {t('login.email', 'Email Address')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  {t('login.password', 'Password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-emerald-500" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? t('login.checking', 'Checking...') : t('login.submit', 'Sign In')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Security note */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {t('login.security_note', 'First-time login requires email verification. A one-time code will be sent to your registered email.')}
                </p>
              </div>
            </form>
          )}

          {/* ── STEP 2: OTP Verification ─────────────────────────────────── */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              {/* Sent to indicator */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {otpSending ? t('login.otp_sending', 'Sending code...') : (otpSent ? t('login.otp_sent', 'Code sent!') : '')}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('login.otp_sent_to', 'Sent to')}: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{otpEmail}</span>
                  </p>
                </div>
                {otpSent && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto flex-shrink-0" />}
              </div>

              {/* Dev-mode OTP display (when EmailJS not configured) */}
              {otpDevMode && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50">
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">
                    ⚙️ EmailJS Not Configured — Dev Mode
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Your OTP code: <span className="font-mono font-extrabold text-lg text-amber-700 dark:text-amber-200 tracking-[0.3em]">{otpDevMode}</span>
                  </p>
                  <p className="text-[10px] text-amber-500 mt-1">Configure EmailJS to send real codes to Gmail.</p>
                </div>
              )}

              {/* OTP Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  {t('login.otp_label', '6-Digit Verification Code')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xl font-mono font-bold tracking-[0.4em] text-slate-900 dark:text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-center"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">{t('login.otp_expires', 'Code expires in 10 minutes.')}</p>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? t('login.verifying', 'Verifying...') : t('login.verify_otp', 'Verify & Sign In')}</span>
              </button>

              {/* Resend & back */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpSending}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  {t('login.resend_otp', 'Resend Code')}
                </button>
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
                >
                  ← {t('login.back_to_login', 'Back to Login')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-6">
          {t('login.secure_footer', 'Secured with 2-step email verification • Authorized personnel only')}
        </p>
      </div>
    </div>
  );
};