import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Building2, X, Bell, FileText, CreditCard, Wrench, CheckSquare, Calendar,
  CheckCircle2, ArrowRight, ShieldCheck, DoorOpen
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getDashboardOverview, type OverviewData } from '../../services/dashboardService';
import { listNotifications, type NotificationView, type NotificationType } from '../../services/notificationService';

interface WelcomeAiGreetingProps {
  onDone: () => void;
}

const iconMap: Record<NotificationType, React.ElementType> = {
  CONTRACT: FileText,
  PAYMENT: CreditCard,
  MAINTENANCE: Wrench,
  TASK: CheckSquare,
  SYSTEM: Bell,
};

export default function WelcomeAiGreeting({ onDone }: WelcomeAiGreetingProps) {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [isClosing, setIsClosing] = useState(false);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [notifications, setNotifications] = useState<NotificationView[]>([]);

  const isVi = language === 'vi';
  const rawName = user?.fullName || (isVi ? 'Quản trị viên' : 'Admin');
  const firstName = rawName.split(' ').pop() || rawName;
  const workspaceId = user?.workspaces?.[0]?.id ?? 1;

  // Format today's date
  const todayFormatted = useMemo(() => {
    try {
      const now = new Date();
      if (isVi) {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return `${days[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;
      } else {
        return now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {
      return '';
    }
  }, [isVi]);

  // Fetch real data on mount
  useEffect(() => {
    let active = true;
    Promise.all([
      getDashboardOverview(workspaceId).catch(() => null),
      listNotifications(workspaceId, { active: true, size: 4 }).catch(() => null),
    ]).then(([ov, notifs]) => {
      if (!active) return;
      if (ov) setOverview(ov);
      if (notifs?.items) setNotifications(notifs.items);
    });

    return () => {
      active = false;
    };
  }, [workspaceId]);

  // Handle closing popup cleanly
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onDone();
    }, 200);
  }, [isClosing, onDone]);

  // Helper format currency
  const formatMoney = (amount?: number) => {
    if (!amount) return '0 đ';
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)} tr đ`;
    }
    return `${amount.toLocaleString('vi-VN')} đ`;
  };

  return (
    <>
      {/* Backdrop with click-to-close */}
      <div
        className="fixed inset-0 z-[199] bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200"
        style={{ opacity: isClosing ? 0 : 1 }}
        onClick={handleClose}
      />

      {/* Main Dialog Container */}
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-xl transition-all duration-200"
          style={{
            transform: isClosing ? 'scale(0.96) translateY(10px)' : 'scale(1) translateY(0)',
            opacity: isClosing ? 0 : 1,
          }}
        >
          {/* Executive Daily Briefing Card */}
          <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-2xl">
            
            {/* ─── Elegant Header ─── */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/90 flex items-start justify-between">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                      <Calendar size={12} />
                      {todayFormatted}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
                    {isVi ? `Chào ${firstName}, đây là điểm tin hôm nay` : `Good day, ${firstName}`}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isVi
                      ? 'Tổng hợp nhanh số liệu và công việc cần xử lý tại cơ sở của bạn.'
                      : 'Summary of property metrics and critical tasks for today.'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isVi ? 'Đóng cửa sổ' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            {/* ─── 4 Metric Cards Grid ─── */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-5">
                
                {/* 1. Tiền chưa thu */}
                <div className="p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
                  <div className="flex items-center justify-between text-xs font-semibold text-rose-700 dark:text-rose-400">
                    <span>{isVi ? 'Tiền chưa thu' : 'Unpaid Invoices'}</span>
                    <CreditCard size={15} />
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight">
                    {formatMoney(overview?.outstandingPayments)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isVi ? 'Hóa đơn quá hạn cần thu' : 'Overdue invoices'}
                  </p>
                </div>

                {/* 2. Hợp đồng sắp hết */}
                <div className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <span>{isVi ? 'Hợp đồng đến hạn' : 'Expiring Leases'}</span>
                    <FileText size={15} />
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight">
                    {overview?.contractsExpiringSoon ?? 0} {isVi ? 'hợp đồng' : 'leases'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isVi ? 'Trong vòng 30 ngày tới' : 'Within 30 days'}
                  </p>
                </div>

                {/* 3. Sự cố bảo trì */}
                <div className="p-3.5 rounded-xl border border-blue-200/80 dark:border-indigo-900/40 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-indigo-400">
                    <span>{isVi ? 'Bảo trì & Sự cố' : 'Maintenance'}</span>
                    <Wrench size={15} />
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight">
                    {overview?.openMaintenance ?? 0} {isVi ? 'yêu cầu' : 'requests'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {overview?.openMaintenance && overview.openMaintenance > 0
                      ? (isVi ? 'Đang chờ kỹ thuật' : 'Pending dispatch')
                      : (isVi ? 'Thiết bị hoạt động tốt' : 'Normal')}
                  </p>
                </div>

                {/* 4. Phòng trống */}
                <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <span>{isVi ? 'Phòng đang trống' : 'Vacant Units'}</span>
                    <DoorOpen size={15} />
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight">
                    {overview?.availableRooms ?? 0} {isVi ? 'phòng' : 'units'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isVi ? 'Sẵn sàng đón khách mới' : 'Ready for occupancy'}
                  </p>
                </div>
              </div>

              {/* ─── Recent Notifications & Tasks ─── */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {isVi ? 'Cập nhật hệ thống gần nhất' : 'Recent Updates'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {notifications.length} {isVi ? 'thông báo' : 'items'}
                  </span>
                </div>

                <div className="space-y-2">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 3).map(notif => {
                      const Icon = iconMap[notif.type] || Bell;
                      const isUrgent = notif.category === 'URGENT';
                      return (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                            isUrgent
                              ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                              : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isUrgent
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300'
                                : 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* All-Good State */
                    <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                          {isVi ? 'Hệ thống vận hành bình thường' : 'All systems operational'}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          {isVi
                            ? 'Không có hóa đơn quá hạn hay sự cố khẩn cấp cần giải quyết hôm nay.'
                            : 'No urgent maintenance or unpaid invoice alerts.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Actions Bar ─── */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isVi ? 'Bắt đầu làm việc' : 'Go to Dashboard'}</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {isVi ? 'Đóng' : 'Dismiss'}
                </button>
              </div>

            </div>

            {/* ─── Clean Status Footer ─── */}
            <div className="px-6 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{isVi ? 'Hệ thống HOLOKA đã kết nối thời gian thực' : 'HOLOKA Realtime Connected'}</span>
              </div>
              <span className="text-[11px] text-slate-400">
                <ShieldCheck size={14} className="inline mr-1" />
                Bảo mật B2B
              </span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}


