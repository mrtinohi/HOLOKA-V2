import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  DoorOpen, AlertTriangle, Plus, ArrowRight, Building2, Wallet, TrendingUp,
} from 'lucide-react';
import {
  getDashboardOverview, getDashboardCharts,
  type OverviewData, type ChartsData,
} from '../services/dashboardService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import StatCard from '../components/ui/StatCard';

const money = (n: number, isVi: boolean) =>
  n > 0 ? (isVi ? `${(n / 1_000_000).toFixed(1)} tr` : `${(n / 1_000_000).toFixed(1)}M ₫`) : (isVi ? '0 đ' : '0 ₫');

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <div className="skeleton h-8 w-72" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 skeleton h-80 rounded-2xl" />
        <div className="lg:col-span-5 skeleton h-80 rounded-2xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [data, setData] = useState<OverviewData | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const workspaceId = user?.workspaces?.[0]?.id ?? 1;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      getDashboardOverview(workspaceId),
      getDashboardCharts(workspaceId).catch(() => null),
    ])
      .then(([overview, chartsData]) => {
        if (!active) return;
        setData(overview);
        setCharts(chartsData);
      })
      .catch(() => {
        if (!active) return;
        setError(isVi ? 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.' : 'Failed to connect to server. Please try again.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workspaceId, isVi]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div
        className="flex items-start gap-4 rounded-2xl p-5"
        style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-border)' }}
      >
        <AlertTriangle size={22} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
        <div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isVi ? 'Đã xảy ra sự cố' : 'An error occurred'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return isVi ? 'Chào buổi sáng' : 'Good morning';
    if (h < 18) return isVi ? 'Chào buổi chiều' : 'Good afternoon';
    return isVi ? 'Chào buổi tối' : 'Good evening';
  })();

  const openAiWithTab = (tab: 'leakage' | 'simulator' | 'priority') => {
    window.dispatchEvent(new CustomEvent('open-ai-hub', { detail: { tab } }));
  };

  const netProfit = (data.monthlyRevenue || 0) - (data.monthlyExpense || 0);
  const totalBilled = (data.monthlyRevenue || 0) + (data.outstandingPayments || 0);
  const collectedPct = totalBilled > 0 ? Math.round(((data.monthlyRevenue || 0) / totalBilled) * 100) : 100;
  const today = new Date().toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-10">
      {/* ─── Page header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {greeting}, <span style={{ color: 'var(--brand-text)' }}>{user?.fullName || (isVi ? 'Quản lý' : 'Manager')}</span>
          </h1>
          <p className="text-sm mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1" style={{ color: 'var(--text-muted)' }}>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              {user?.workspaces?.[0]?.name ?? 'An Nhiên Living'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{today}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <NavLink to="/properties" className="btn btn-primary">
            <Plus size={16} />
            <span>{isVi ? 'Thêm tài sản' : 'Add Property'}</span>
          </NavLink>
          <NavLink to="/finance" className="btn btn-secondary">
            {isVi ? 'Lập hóa đơn' : 'Create Invoice'}
          </NavLink>
        </div>
      </div>

      {/* ─── KPI row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={isVi ? 'Tỷ lệ lấp đầy' : 'Occupancy Rate'}
          value={`${Math.round(data.occupancyRate || 0)}%`}
          icon={DoorOpen}
          tone="brand"
          hint={`${data.occupiedRooms || 0}/${data.totalRooms || 0} ${isVi ? 'phòng có khách · ' : 'occupied · '}${data.availableRooms || 0} ${isVi ? 'trống' : 'vacant'}`}
          footer={
            <NavLink to="/rooms" className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--brand-text)' }}>
              {isVi ? 'Quản lý phòng' : 'Manage rooms'} <ArrowRight size={12} />
            </NavLink>
          }
        />

        <StatCard
          title={isVi ? 'Tiền phòng đã thu' : 'Collected Rent'}
          value={money(data.monthlyRevenue, isVi)}
          icon={TrendingUp}
          tone="success"
          hint={isVi ? `Đạt ${collectedPct}% tổng phải thu kỳ này` : `${collectedPct}% of expected collected`}
          footer={
            <NavLink to="/finance" className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--success)' }}>
              {isVi ? 'Sổ thu tiền' : 'Cashbook'} <ArrowRight size={12} />
            </NavLink>
          }
        />

        <StatCard
          title={isVi ? 'Tiền nợ chưa thu' : 'Overdue Rent'}
          value={money(data.outstandingPayments, isVi)}
          icon={AlertTriangle}
          tone={data.outstandingPayments > 0 ? 'danger' : 'neutral'}
          hint={data.outstandingPayments > 0
            ? (isVi ? 'Cần liên hệ nhắc khách thanh toán' : 'Tenants need payment reminder')
            : (isVi ? 'Không có khoản nợ tồn đọng' : 'No overdue payments')}
          footer={
            <button
              type="button"
              onClick={() => openAiWithTab('priority')}
              className="text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
              style={{ color: data.outstandingPayments > 0 ? 'var(--danger)' : 'var(--text-muted)' }}
            >
              {isVi ? 'Nhắc nợ khách' : 'Remind tenants'} <ArrowRight size={12} />
            </button>
          }
        />

        <StatCard
          title={isVi ? 'Lợi nhuận ước tính' : 'Estimated Profit'}
          value={money(netProfit, isVi)}
          icon={Wallet}
          tone={netProfit > 0 ? 'brand' : 'danger'}
          hint={isVi
            ? `Sau khi trừ ${(data.monthlyExpense / 1_000_000).toFixed(1)} tr chi phí`
            : `After ${(data.monthlyExpense / 1_000_000).toFixed(1)}M expenses`}
          footer={
            <NavLink to="/reports" className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--brand-text)' }}>
              {isVi ? 'Báo cáo lời / lỗ' : 'P&L Report'} <ArrowRight size={12} />
            </NavLink>
          }
        />
      </div>

      {/* ─── Main two-column ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Action queue */}
        <section className="lg:col-span-7 card p-5">
          <div className="flex items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--warning-soft)', border: '1px solid var(--warning-border)', color: 'var(--warning)' }}
              >
                <AlertTriangle size={16} />
              </div>
              <div className="min-w-0">
                <h2 className="section-title">
                  {isVi ? 'Việc cần xử lý hôm nay' : 'Action Items Today'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {isVi ? 'Các khoản nợ và hợp đồng cần chú ý' : 'Overdue invoices and contracts needing attention'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openAiWithTab('priority')}
              className="text-xs font-semibold shrink-0 cursor-pointer"
              style={{ color: 'var(--brand-text)' }}
            >
              {isVi ? 'Xem tất cả' : 'View all'}
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {[
              {
                tag: isVi ? 'Nợ quá hạn' : 'Overdue',
                tone: 'danger' as const,
                title: isVi ? 'Thu tiền phòng P.102 (chị Trần Thị Thu Trang)' : 'Collect rent Room 102 (Ms. Tran Thi Thu Trang)',
                meta: isVi
                  ? <>Số tiền: <strong style={{ color: 'var(--danger)' }}>8.520.000 đ</strong> · Quá hạn 11 ngày</>
                  : <>Amount: <strong style={{ color: 'var(--danger)' }}>8,520,000 ₫</strong> · Overdue 11 days</>,
                label: isVi ? 'Gửi nhắc nợ' : 'Send Reminder',
                to: undefined,
                onClick: () => openAiWithTab('priority'),
              },
              {
                tag: isVi ? 'Sắp hết hạn' : 'Expiring soon',
                tone: 'warning' as const,
                title: isVi ? 'Gia hạn hợp đồng phòng P.101 & P.201' : 'Renew lease Room 101 & 201',
                meta: isVi
                  ? <>Hết hạn trong 17 và 25 ngày tới · 16 triệu đ tiền thuê</>
                  : <>Expires in 17 & 25 days · 16M ₫ monthly rent</>,
                label: isVi ? 'Hỏi gia hạn' : 'Ask Renewal',
                to: '/contracts',
                onClick: undefined,
              },
              {
                tag: isVi ? 'Báo hỏng' : 'Issue reported',
                tone: 'neutral' as const,
                title: isVi ? 'Rò rỉ nước bồn rửa chén phòng 302' : 'Kitchen sink leak Room 302',
                meta: isVi
                  ? <>Chưa phân công thợ · Ước tính 450.000 đ</>
                  : <>Unassigned technician · Est. 450,000 ₫</>,
                label: isVi ? 'Giao thợ sửa' : 'Assign Repair',
                to: '/maintenance',
                onClick: undefined,
              },
            ].map(item => (
              <div
                key={item.title}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl"
                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge badge-${item.tone}`}>{item.tag}</span>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.meta}</p>
                </div>

                {item.to ? (
                  <NavLink to={item.to} className="btn btn-secondary shrink-0">{item.label}</NavLink>
                ) : (
                  <button type="button" onClick={item.onClick} className="btn btn-primary shrink-0">
                    {item.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Occupancy by property */}
        <section className="lg:col-span-5 card p-5">
          <div className="flex items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-200)', color: 'var(--brand-text)' }}
              >
                <Building2 size={16} />
              </div>
              <h2 className="section-title truncate">
                {isVi ? 'Tỷ lệ lấp đầy theo khu' : 'Occupancy by Property'}
              </h2>
            </div>
            <NavLink to="/properties" className="text-xs font-semibold shrink-0" style={{ color: 'var(--brand-text)' }}>
              {isVi ? 'Chi tiết' : 'Details'}
            </NavLink>
          </div>

          <div className="mt-4 space-y-3">
            {charts?.occupancy?.length ? charts.occupancy.map(prop => {
              const rate = prop.totalRooms > 0
                ? Math.round((prop.occupiedRooms / prop.totalRooms) * 100)
                : 0;
              return (
                <div
                  key={prop.propertyId}
                  className="p-3.5 rounded-xl space-y-2"
                  style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{prop.name}</span>
                    <span className="font-bold tabular-nums shrink-0" style={{ color: 'var(--brand-text)' }}>{rate}%</span>
                  </div>

                  <div
                    className="w-full h-2 rounded-full overflow-hidden flex"
                    role="progressbar"
                    aria-valuenow={rate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Occupancy ${prop.name}`}
                    style={{ background: 'var(--border)' }}
                  >
                    <div className="h-full transition-all" style={{ width: `${rate}%`, background: 'var(--brand)' }} />
                    <div className="h-full transition-all" style={{ width: `${100 - rate}%`, background: 'var(--warning)' }} />
                  </div>

                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{prop.occupiedRooms} {isVi ? 'có khách' : 'occupied'}</span>
                    <span>{prop.availableRooms} {isVi ? 'trống' : 'vacant'}</span>
                  </div>
                </div>
              );
            }) : (
              <p className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                {isVi ? 'Chưa có dữ liệu tòa nhà.' : 'No property data available.'}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
