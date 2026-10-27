import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { login } from '../services/authService';
import {
  Loader2, Lock, Mail, Eye, EyeOff, ShieldCheck,
  Zap, Building2, Sparkles, ArrowRight
} from 'lucide-react';
import Logo from '../components/ui/Logo';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login: setAuth } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleQuickFill = () => {
    setEmail('admin@holoka.vn');
    setPassword('Abcd1234@');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await login({ email, password });
      setAuth(response.accessToken, response.user);
      sessionStorage.setItem('holoka_just_logged_in', 'true');
      sessionStorage.removeItem('holoka_welcome_seen');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        (t('login.error_invalid') !== 'login.error_invalid'
          ? t('login.error_invalid')
          : 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-[#090d16] text-slate-100 overflow-hidden relative">
      {/* ─── Top-Right Floating Language Switcher ─── */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher variant="pill" theme="dark" />
      </div>

      {/* ─── Ambient Multi-Color Background Aurora Mesh ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[25%] -left-[10%] w-[650px] h-[650px] rounded-full opacity-30 filter blur-[120px]"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, #4338ca 60%, transparent 80%)' }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[750px] h-[750px] rounded-full opacity-25 filter blur-[140px]"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, #8b5cf6 60%, transparent 80%)' }}
        />
        <div
          className="absolute top-[40%] left-[35%] w-[500px] h-[500px] rounded-full opacity-15 filter blur-[100px]"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
        />

        {/* Subtle Architectural Grid Lines - reduced opacity */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* LEFT PANEL: Flagship Brand Showcase & Live Features */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col justify-between w-7/12 p-14 relative z-10 border-r border-white/5">
        {/* Brand Header */}
        <div>
          <Logo size="lg" variant="horizontal" animate={true} />
        </div>

        {/* Core Value Proposition & Live Cards */}
        <div className="max-w-xl my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-bold mb-6 tracking-wide">
            <Sparkles size={14} className="text-cyan-400" />
            {t('login.hero_badge')}
          </div>

          <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight mb-5 font-display">
            {t('login.hero_title_1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-cyan-300 to-violet-300">
              {t('login.hero_title_2')}
            </span>
          </h2>

          <p className="text-slate-300 text-[15px] leading-relaxed mb-8">
            {t('login.hero_subtitle')}
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md hover:border-indigo-500/30 transition-all duration-300 text-left">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Building2 size={18} />
              </div>
              <h4 className="font-bold text-sm text-slate-200 mb-1">{t('login.feature_1_title')}</h4>
              <p className="text-xs text-slate-400">{t('login.feature_1_desc')}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md hover:border-cyan-500/30 transition-all duration-300 text-left">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                <Zap size={18} />
              </div>
              <h4 className="font-bold text-sm text-slate-200 mb-1">{t('login.feature_2_title')}</h4>
              <p className="text-xs text-slate-400">{t('login.feature_2_desc')}</p>
            </div>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-8">
            <div className="text-left">
              <p className="text-2xl font-black text-white font-display">{t('login.metric_1_val')}</p>
              <p className="text-xs text-slate-400">{t('login.metric_1_label')}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-left">
              <p className="text-2xl font-black text-cyan-400 font-display">{t('login.metric_2_val')}</p>
              <p className="text-xs text-slate-400">{t('login.metric_2_label')}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-left">
              <p className="text-2xl font-black text-emerald-400 font-display">{t('login.metric_3_val')}</p>
              <p className="text-xs text-slate-400">{t('login.metric_3_label')}</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span>{t('login.system_status')}</span>
          </div>
          <span>© {new Date().getFullYear()} HOLOKA SaaS</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* RIGHT PANEL: High-End Glassmorphism Login Form       */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo View */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="lg" variant="vertical" animate={true} />
          </div>

          {/* Glass Form Card */}
          <div
            className="rounded-3xl p-8 sm:p-10 border relative overflow-hidden backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255,255,255,0.15)',
            }}
          >
            {/* Ambient Corner Accent */}
            <div
              className="absolute -top-16 -right-16 w-36 h-36 rounded-full opacity-30 filter blur-2xl pointer-events-none"
              style={{ background: '#6366f1' }}
            />

            {/* Form Title */}
            <div className="mb-6 text-left">
              <h3 className="text-2xl font-black text-white font-display tracking-tight">
                {t('login.title')}
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                {t('login.desc')}
              </p>
            </div>

            {/* Quick Demo Fill Bar */}
            <div
              onClick={handleQuickFill}
              className="mb-6 p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all duration-200 cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center text-cyan-300">
                  <Sparkles size={14} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-indigo-200 group-hover:text-white transition-colors">
                    {t('login.demo_badge')}
                  </p>
                  <p className="text-[11px] text-slate-400">admin@holoka.vn • Abcd1234@</p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-400 group-hover:text-cyan-300 flex items-center gap-1">
                {t('login.demo_fill')} <ArrowRight size={13} />
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-semibold flex items-center gap-2 text-left"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-bold text-slate-200 mb-2"
                >
                  {t('login.email_label')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Mail size={18} />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@holoka.vn"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-slate-500 text-base focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/25 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-bold text-slate-200"
                  >
                    {t('login.password_label')}
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock size={18} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-slate-500 text-base focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/25 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-4 px-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(37,99,235,0.5)] hover:shadow-[0_6px_28px_rgba(37,99,235,0.7)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>{t('login.btn_loading')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('login.btn_login')}</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Enterprise Security Badge */}
            <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>{t('login.security')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
