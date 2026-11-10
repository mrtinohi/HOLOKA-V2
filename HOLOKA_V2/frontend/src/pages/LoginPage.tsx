import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { login } from '../services/authService';
import { Loader2, Lock, Mail, Eye, EyeOff, ShieldCheck, Building2, Zap, ArrowRight, AlertCircle } from 'lucide-react';
import Logo from '../components/ui/Logo';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import ThemeToggle from '../components/ui/ThemeToggle';
import { errorMessage } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login: setAuth } = useAuth();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await login({ email: email.trim(), password });
      setAuth(response.accessToken, response.user);
      sessionStorage.setItem('holoka_just_logged_in', 'true');
      sessionStorage.removeItem('holoka_welcome_seen');
      if (response.user.platformAdmin) {
        navigate('/platform/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* ─── Left: brand panel (desktop) ─── */}
      <aside
        className="hidden lg:flex flex-col justify-between w-[46%] xl:w-[42%] p-10 relative overflow-hidden flex-shrink-0"
        style={{ background: 'linear-gradient(160deg, #0b1526 0%, #12203c 55%, #0a1526 100%)' }}
      >
        {/* Subtle grid + glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full opacity-25 blur-[120px]"
            style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-40 -right-24 w-[560px] h-[560px] rounded-full opacity-20 blur-[130px]"
            style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)' }}
          />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="[&_span]:!text-white [&_span:last-child]:!text-slate-400">
            <Logo size="lg" variant="horizontal" animate />
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.07] text-blue-200 border border-white/10 mb-6">
            {t('login.hero_badge')}
          </span>

          <h2
            className="text-4xl xl:text-[2.75rem] font-bold text-white leading-[1.15] tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('login.hero_title_1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
              {t('login.hero_title_2')}
            </span>
          </h2>

          <p className="text-[15px] leading-relaxed text-slate-300/90 mb-8">
            {t('login.hero_subtitle')}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Building2, title: t('login.feature_1_title'), desc: t('login.feature_1_desc') },
              { icon: Zap, title: t('login.feature_2_title'), desc: t('login.feature_2_desc') },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-4 rounded-2xl bg-white/[0.05] border border-white/10">
                <Icon size={18} className="text-blue-300 mb-2.5" />
                <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
                <p className="text-xs leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-8">
            {[
              { val: t('login.metric_1_val'), label: t('login.metric_1_label'), cls: 'text-white' },
              { val: t('login.metric_2_val'), label: t('login.metric_2_label'), cls: 'text-cyan-300' },
              { val: t('login.metric_3_val'), label: t('login.metric_3_label'), cls: 'text-emerald-300' },
            ].map(m => (
              <div key={m.label}>
                <p className={`text-xl font-bold ${m.cls}`} style={{ fontFamily: 'var(--font-display)' }}>{m.val}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{t('login.system_status')}</span>
        </div>
      </aside>

      {/* ─── Right: form ─── */}
      <main className="flex-1 flex flex-col relative">
        {/* Top controls */}
        <div className="flex items-center justify-end gap-2 p-4 sm:p-5">
          <ThemeToggle variant="icon" />
          <LanguageSwitcher />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pb-10">
          <div className="w-full max-w-[400px]">
            <div className="lg:hidden flex justify-center mb-8">
              <Logo size="lg" variant="vertical" animate />
            </div>

            <div className="mb-6">
              <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                {t('login.title')}
              </h1>
              <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
                {t('login.desc')}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-xl flex items-start gap-2 text-sm"
                style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
              >
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="field-label">{t('login.email_label')}</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@holoka.vn"
                    className="input pl-10 text-[15px]"
                    style={{ minHeight: 44 }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="field-label">{t('login.password_label')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="input pl-10 pr-11 text-[15px]"
                    style={{ minHeight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? (isVi ? 'Ẩn mật khẩu' : 'Hide password') : (isVi ? 'Hiện mật khẩu' : 'Show password')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 btn btn-ghost btn-icon"
                    style={{ minHeight: 32, width: 32 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full text-[15px]"
                style={{ minHeight: 46 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    {t('login.btn_loading')}
                  </>
                ) : (
                  <>
                    {t('login.btn_login')}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div
              className="mt-7 pt-5 flex items-center justify-center gap-1.5 text-[11px]"
              style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
              <span>{t('login.security')}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
