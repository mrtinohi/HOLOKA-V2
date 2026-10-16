import { useState, useEffect } from 'react';
import {
  Building2, DoorOpen, Wrench, CreditCard,
  TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Clock, FileWarning, Users,
} from 'lucide-react';
import { getDashboardOverview, type OverviewData } from '../services/dashboardService';
import { useAuth } from '../contexts/AuthContext';

/* ────────── Stat Card ────────── */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  trend?: number;
  sub?: string;
  delay?: number;
}

function StatCard({ title, value, icon: Icon, gradient, trend, sub, delay = 0 }: StatCardProps) {
  return (
    <div
      className="card fade-in"
      style={{
        animationDelay: `${delay}s`,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: gradient }}
        >
          <Icon size={20} color="white" strokeWidth={2} />
        </div>
        {trend !== undefined && (
          <div
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
            style={{
              color: trend >= 0 ? '#10b981' : '#f43f5e',
              background: trend >= 0 ? 'rgba(16,185,129,0.10)' : 'rgba(244,63,94,0.10)',
            }}
          >
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold" style={{ color: '#0f172a', lineHeight: 1 }}>{value}</p>
        {sub && <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{sub}</p>}
      </div>

      <p className="text-sm font-medium" style={{ color: '#64748b' }}>{title}</p>
    </div>
  );
}

/* ────────── Action Item ────────── */
interface ActionItemProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  sub: string;
  tag: string;
  tagColor: string;
  tagBg: string;
}
function ActionItem({ icon: Icon, iconColor, iconBg, title, sub, tag, tagColor, tagBg }: ActionItemProps) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl transition-colors"
      style={{ cursor: 'default' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        <Icon size={15} color={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{sub}</p>
      </div>
      <span
        className="badge flex-shrink-0"
        style={{ background: tagBg, color: tagColor }}
      >
        {tag}
      </span>
    </div>
  );
}

/* ────────── Skeleton ────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[0,1,2,3].map(i => <div key={i} className="skeleton h-36 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 skeleton h-72 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    </div>
  );
}

/* ────────── Dashboard Page ────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const workspaceId = user!.workspaces[0].id;

  useEffect(() => {
    getDashboardOverview(workspaceId)
      .then(setData)
      .catch(err => {
        console.error(err);
        setError('Không thể tải dữ liệu dashboard. Kiểm tra backend đang chạy.');
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div
        className="flex items-center gap-3 p-5 rounded-2xl"
        style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e' }}
      >
        <AlertTriangle size={20} />
        <div>
          <p className="font-semibold">Lỗi tải dữ liệu</p>
          <p className="text-sm mt-0.5" style={{ color: '#fda4af' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  })();

  const allGood =
    data.outstandingPayments === 0 &&
    data.openMaintenance === 0 &&
    data.contractsExpiringSoon === 0 &&
    data.pendingTasks === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>
            {greeting}, <span style={{ color: '#6366f1' }}>{user?.fullName?.split(' ').at(-1) || 'bạn'}</span> 👋
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>
            Đây là tổng quan hoạt động của workspace hôm nay.
          </p>
        </div>
        <div
          className="px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{ background: '#f1f5f9', color: '#64748b' }}
        >
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Bất động sản"
          value={data.totalProperties}
          icon={Building2}
          gradient="linear-gradient(135deg, #6366f1, #818cf8)"
          sub={`${data.totalBuildings} tòa nhà`}
          delay={0.00}
        />
        <StatCard
          title="Tỷ lệ lấp đầy"
          value={`${data.occupancyRate}%`}
          icon={DoorOpen}
          gradient="linear-gradient(135deg, #10b981, #34d399)"
          trend={2.5}
          sub={`${data.occupiedRooms} / ${data.totalRooms} phòng`}
          delay={0.05}
        />
        <StatCard
          title="Doanh thu tháng"
          value={data.monthlyRevenue > 0 ? `${(data.monthlyRevenue / 1_000_000).toFixed(1)}M ₫` : '—'}
          icon={CreditCard}
          gradient="linear-gradient(135deg, #f59e0b, #fbbf24)"
          trend={data.monthlyRevenue > 0 ? 12 : undefined}
          sub={`${data.activeContracts} hợp đồng active`}
          delay={0.10}
        />
        <StatCard
          title="Bảo trì mở"
          value={data.openMaintenance}
          icon={Wrench}
          gradient={data.openMaintenance > 0
            ? 'linear-gradient(135deg, #f43f5e, #fb7185)'
            : 'linear-gradient(135deg, #6366f1, #818cf8)'
          }
          sub={data.openMaintenance > 0 ? 'Cần xử lý' : 'Không có vấn đề'}
          delay={0.15}
        />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Mini stats row */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Phòng trống',         value: data.availableRooms,        color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
            { label: 'Phòng bảo trì',       value: data.maintenanceRooms,      color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { label: 'Hóa đơn nợ',          value: data.outstandingPayments > 0 ? `${(data.outstandingPayments/1_000_000).toFixed(1)}M ₫` : '0', color: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
            { label: 'HĐ sắp hết hạn',      value: data.contractsExpiringSoon, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { label: 'Công việc chờ',        value: data.pendingTasks,          color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
            { label: 'Doanh thu NÀY THÁNG', value: data.monthlyExpense > 0 ? `${(data.monthlyExpense/1_000_000).toFixed(1)}M` : '—', color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
          ].map((item, i) => (
            <div
              key={item.label}
              className="card fade-in"
              style={{
                padding: '16px 18px',
                animationDelay: `${0.2 + i * 0.04}s`,
              }}
            >
              <p
                className="text-xl font-bold"
                style={{ color: item.color }}
              >
                {item.value}
              </p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#94a3b8' }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Action center */}
        <div
          className="card fade-in overflow-hidden flex flex-col"
          style={{ animationDelay: '0.22s' }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{ borderColor: '#f1f5f9' }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
              <h3 className="font-bold text-sm" style={{ color: '#0f172a' }}>Cần chú ý hôm nay</h3>
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>HOLOKA tự động phân tích ưu tiên</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {allGood ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.12)' }}
                >
                  <CheckCircle2 size={24} style={{ color: '#10b981' }} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm" style={{ color: '#0f172a' }}>Tất cả ổn!</p>
                  <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Không có mục nào cần xử lý.</p>
                </div>
              </div>
            ) : (
              <>
                {data.outstandingPayments > 0 && (
                  <ActionItem
                    icon={CreditCard}
                    iconColor="#f43f5e"
                    iconBg="rgba(244,63,94,0.12)"
                    title="Hóa đơn chưa thanh toán"
                    sub={`Tổng: ${data.outstandingPayments.toLocaleString('vi-VN')} ₫`}
                    tag="KHẨN"
                    tagColor="#f43f5e"
                    tagBg="rgba(244,63,94,0.12)"
                  />
                )}
                {data.openMaintenance > 0 && (
                  <ActionItem
                    icon={Wrench}
                    iconColor="#f43f5e"
                    iconBg="rgba(244,63,94,0.12)"
                    title={`${data.openMaintenance} bảo trì cần xử lý`}
                    sub="Ưu tiên cao, cần xem ngay"
                    tag="KHẨN"
                    tagColor="#f43f5e"
                    tagBg="rgba(244,63,94,0.12)"
                  />
                )}
                {data.contractsExpiringSoon > 0 && (
                  <ActionItem
                    icon={FileWarning}
                    iconColor="#f59e0b"
                    iconBg="rgba(245,158,11,0.12)"
                    title={`${data.contractsExpiringSoon} hợp đồng sắp hết hạn`}
                    sub="Trong vòng 30 ngày tới"
                    tag="Chú ý"
                    tagColor="#f59e0b"
                    tagBg="rgba(245,158,11,0.12)"
                  />
                )}
                {data.pendingTasks > 0 && (
                  <ActionItem
                    icon={Clock}
                    iconColor="#6366f1"
                    iconBg="rgba(99,102,241,0.12)"
                    title={`${data.pendingTasks} công việc chưa hoàn thành`}
                    sub="Chờ xử lý trong workspace"
                    tag="Đang chờ"
                    tagColor="#6366f1"
                    tagBg="rgba(99,102,241,0.12)"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats bottom bar */}
      <div
        className="card fade-in"
        style={{
          animationDelay: '0.30s',
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <Users size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
        <span className="text-sm font-medium" style={{ color: '#64748b' }}>
          Workspace <strong style={{ color: '#0f172a' }}>{user?.workspaces?.[0]?.name ?? '—'}</strong>&nbsp;·&nbsp;
          <strong style={{ color: '#6366f1' }}>{data.totalRooms}</strong> phòng quản lý&nbsp;·&nbsp;
          <strong style={{ color: '#10b981' }}>{data.activeContracts}</strong> hợp đồng đang hiệu lực&nbsp;·&nbsp;
          <strong style={{ color: '#f59e0b' }}>{data.availableRooms}</strong> phòng đang trống
        </span>
      </div>
    </div>
  );
}
