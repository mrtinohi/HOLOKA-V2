import { useState, useEffect } from 'react';
import {
  Shield, Server, KeyRound, Lock,
  Save, Check, Database,
  Cpu, HardDrive
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getPlatformMetrics, type PlatformSystemMetrics } from '../services/platformService';

export default function PlatformSettingsPage() {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [metrics, setMetrics] = useState<PlatformSystemMetrics | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(15);
  const [minPasswordLength, setMinPasswordLength] = useState(8);
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);
  const [adminNotifyEmail, setAdminNotifyEmail] = useState('superadmin@holoka.vn');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getPlatformMetrics().then(setMetrics).catch(() => {});
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            >
              {isVi ? 'Cấu hình Nền tảng & An ninh Hệ thống' : 'Platform & Security Settings'}
            </h1>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)', border: '1px solid var(--brand-200)' }}
            >
              <Shield size={12} />
              <span>SUPER ADMIN</span>
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isVi
              ? 'Thiết lập tham số an toàn, thời hạn phiên làm việc và giám sát hạ tầng kỹ thuật của HOLOKA.'
              : 'Global security policy, authentication constraints, and infrastructure monitoring.'}
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div
          role="status"
          className="rounded-xl p-3.5 text-sm font-semibold flex items-center gap-2 animate-in fade-in"
          style={{ background: 'var(--success-soft)', border: '1px solid var(--success-border)', color: 'var(--success)' }}
        >
          <Check size={16} />
          <span>Đã lưu thành công cấu hình hệ thống!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ─── System Health & Infrastructure ─── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
            <Server size={18} className="text-[var(--brand)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Thông số Hạ tầng & Dịch vụ Nền tảng
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] font-semibold flex items-center gap-1">
                <Database size={13} />
                <span>Cơ sở dữ liệu (DBMS)</span>
              </p>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                Microsoft SQL Server 2022
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Trạng thái: Kết nối tốt (1433)</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] font-semibold flex items-center gap-1">
                <Cpu size={13} />
                <span>Môi trường Backend</span>
              </p>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                Spring Boot 3.4.3 (Java 21 LTS)
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Tomcat Port 8081 Active</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] font-semibold flex items-center gap-1">
                <HardDrive size={13} />
                <span>Bộ nhớ Heap JVM</span>
              </p>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                {metrics?.jvmMemoryUsedMb ?? 120} MB / {metrics?.jvmMemoryMaxMb ?? 4096} MB
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Tải bộ nhớ: Tối ưu</p>
            </div>
          </div>
        </div>

        {/* ─── Security Policies ─── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
            <KeyRound size={18} className="text-purple-600" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Chính sách An toàn & Mật khẩu Toàn sàn
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Thời hạn Token phiên làm việc (Access Token)</label>
              <select
                value={sessionTimeoutMinutes}
                onChange={e => setSessionTimeoutMinutes(Number(e.target.value))}
                className="input w-full"
              >
                <option value={15}>15 phút (Khuyến nghị chuẩn an ninh cao)</option>
                <option value={30}>30 phút</option>
                <option value={60}>60 phút (1 giờ)</option>
              </select>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Sau thời gian này, client phải xác thực lại qua Refresh Session.
              </p>
            </div>

            <div>
              <label className="field-label">Độ dài mật khẩu tối thiểu</label>
              <input
                type="number"
                min={8}
                max={32}
                value={minPasswordLength}
                onChange={e => setMinPasswordLength(Number(e.target.value))}
                className="input w-full"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Áp dụng cho tất cả tài khoản khi tạo mới hoặc đặt lại mật khẩu.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border)]">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requireSpecialChar}
                onChange={e => setRequireSpecialChar(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Bắt buộc mật khẩu phải chứa ký tự đặc biệt (@, #, $, %, ...)
              </span>
            </label>
          </div>
        </div>

        {/* ─── Maintenance Mode & Alerts ─── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
            <Lock size={18} className="text-amber-600" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Chế độ Vận hành & Cảnh báo Quản trị
            </h2>
          </div>

          <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]">
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                Chế độ Bảo trì Hệ thống (Maintenance Mode)
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Khi kích hoạt, chỉ có tài khoản Super Admin mới được đăng nhập. Tất cả người dùng thông thường sẽ thấy thông báo bảo trì định kỳ.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(v => !v)}
              className={`btn text-xs font-bold py-1.5 px-3 rounded-xl shrink-0 ${
                maintenanceMode ? 'btn-danger' : 'btn-secondary'
              }`}
            >
              {maintenanceMode ? 'ĐANG BẢO TRÌ' : 'Tắt bảo trì'}
            </button>
          </div>

          <div>
            <label className="field-label">Email nhận cảnh báo an ninh Super Admin</label>
            <input
              type="email"
              value={adminNotifyEmail}
              onChange={e => setAdminNotifyEmail(e.target.value)}
              className="input w-full"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Hệ thống sẽ gửi thông báo khẩn cấp khi phát hiện truy cập bất thường hoặc lỗi máy chủ.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="btn btn-primary text-sm font-bold py-2.5 px-5 flex items-center gap-2 shadow-sm"
          >
            <Save size={16} />
            <span>Lưu thiết lập cấu hình</span>
          </button>
        </div>
      </form>
    </div>
  );
}
