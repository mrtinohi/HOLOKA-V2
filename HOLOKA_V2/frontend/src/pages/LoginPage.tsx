import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../services/authService';
import { Loader2, Lock, Mail, Zap, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login: setAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await login({ email, password });
      setAuth(response.accessToken, response.user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)',
      }}
    >
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden">
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute', top: '-80px', left: '-80px',
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: '-60px', right: '-60px',
            width: '350px', height: '350px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Zap size={22} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-widest">HOLOKA</h1>
              <p className="text-xs" style={{ color: '#6366f1' }}>Property Intelligence</p>
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-5xl font-extrabold text-white leading-tight">
            Quản lý bất động sản<br />
            <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              thông minh hơn.
            </span>
          </h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '1.05rem' }}>
            Theo dõi tài sản, hợp đồng, doanh thu và bảo trì trong một nền tảng tích hợp, trực quan và mạnh mẽ.
          </p>

          {/* Feature bullets */}
          <div className="space-y-3 pt-2">
            {[
              'Báo cáo tài chính theo thời gian thực',
              'Cảnh báo hợp đồng & hóa đơn tự động',
              'Quản lý bảo trì & công việc có gán người phụ trách',
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)' }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: '#818cf8' }} />
                </div>
                <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div
          className="relative z-10 p-5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
            "HOLOKA giúp chúng tôi tiết kiệm hàng giờ mỗi tuần trong công việc quản lý và báo cáo."
          </p>
          <p className="mt-2 font-semibold" style={{ color: '#a5b4fc', fontSize: '0.85rem' }}>— Nguyễn Minh Tú, Chủ đầu tư</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div
          className="w-full max-w-md"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '24px',
            backdropFilter: 'blur(20px)',
            padding: '48px 44px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Zap size={15} color="white" />
            </div>
            <span className="text-white font-bold tracking-widest text-xl">HOLOKA</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Chào mừng trở lại</h2>
          <p className="mb-8" style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Đăng nhập vào tài khoản của bạn
          </p>

          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
              style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)', color: '#fda4af' }}
            >
              <span className="flex-shrink-0">⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium mb-2"
                style={{ color: '#94a3b8' }}
              >
                Địa chỉ Email
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}>
                  <Mail size={17} />
                </span>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '12px',
                    color: 'white',
                    padding: '12px 14px 12px 44px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.10)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium mb-2"
                style={{ color: '#94a3b8' }}
              >
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}>
                  <Lock size={17} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '12px',
                    color: 'white',
                    padding: '12px 44px 12px 44px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.10)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 font-semibold"
              style={{
                marginTop: '8px',
                padding: '13px',
                borderRadius: '12px',
                background: isLoading
                  ? 'rgba(99,102,241,0.5)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                transition: 'opacity 0.2s, transform 0.1s',
                boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
              }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              onMouseDown={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.transform = 'scale(0.99)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" />Đang đăng nhập...</>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs" style={{ color: '#334155' }}>
            © {new Date().getFullYear()} HOLOKA. Bảo lưu mọi quyền.
          </p>
        </div>
      </div>
    </div>
  );
}
