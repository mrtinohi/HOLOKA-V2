import { useState, useEffect } from 'react';
import { TrendingUp, Building2, Wrench, Download, BarChart3, Receipt, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getDashboardOverview, getDashboardCharts, type OverviewData } from '../services/dashboardService';
import { getProperties, type Property } from '../services/propertyService';
import StatCard from '../components/ui/StatCard';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

type Tab = 'financial' | 'occupancy' | 'maintenance';

export default function ReportsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const wsId = user!.workspaces[0].id;

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('financial');

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'financial',   label: isVi ? 'Tài chính' : 'Financial',   icon: TrendingUp },
    { key: 'occupancy',   label: isVi ? 'Lấp đầy' : 'Occupancy',     icon: BarChart3 },
    { key: 'maintenance', label: isVi ? 'Bảo trì' : 'Maintenance',   icon: Wrench },
  ];

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getDashboardOverview(wsId),
      getProperties(wsId),
      getDashboardCharts(wsId).catch(() => null),
    ])
      .then(([ov, props, charts]) => {
        if (!active) return;
        setOverview(ov);
        if (charts?.occupancy) {
          const occMap = new Map(charts.occupancy.map(o => [o.propertyId, o]));
          setProperties(props.map(p => {
            const occ = occMap.get(p.id);
            return {
              ...p,
              totalRooms: occ ? occ.totalRooms : (p.totalRooms ?? 0),
              occupiedRooms: occ ? occ.occupiedRooms : (p.occupiedRooms ?? 0),
            };
          }));
        } else {
          setProperties(props);
        }
      })
      .catch(() => { if (active) setError(isVi ? 'Không tải được dữ liệu báo cáo.' : 'Failed to load report data.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [wsId, isVi]);

  const occColor = (rate: number) =>
    rate >= 80 ? 'var(--success)' : rate >= 60 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {isVi ? 'Báo cáo tổng hợp' : 'Summary Reports'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isVi ? 'Đánh giá hiệu quả vận hành theo tài chính, lấp đầy và bảo trì.' : 'Evaluate operational performance across finance, occupancy, and maintenance.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap no-print">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-hub', { detail: { tab: 'simulator' } }))}
            className="btn btn-outline inline-flex items-center gap-1.5 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(59, 130, 246, 0.08))',
              borderColor: 'rgba(245, 158, 11, 0.35)',
            }}
          >
            <Sparkles size={15} className="text-amber-500 animate-pulse" />
            <span className="font-semibold text-xs sm:text-sm">
              {isVi ? 'Mô phỏng tài chính (AI)' : 'AI Financial Simulator'}
            </span>
          </button>
          <button type="button" onClick={() => window.print()} className="btn btn-secondary">
            <Download size={16} />
            {isVi ? 'Xuất PDF' : 'Export PDF'}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl px-3.5 py-2.5 text-sm" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div
        className="inline-flex items-center p-1 rounded-xl no-print"
        style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
        role="tablist"
      >
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              style={active
                ? { background: 'var(--surface)', color: 'var(--brand-text)', boxShadow: 'var(--shadow-sm)' }
                : { color: 'var(--text-muted)' }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Financial ─── */}
      {activeTab === 'financial' && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
          ) : overview && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title={isVi ? 'Doanh thu tháng' : 'Monthly Revenue'}
                value={fmt(overview.monthlyRevenue)}
                icon={TrendingUp}
                tone="success"
              />
              <StatCard
                title={isVi ? 'Chi phí tháng' : 'Monthly Expenses'}
                value={fmt(overview.monthlyExpense)}
                icon={Receipt}
                tone="warning"
              />
              <StatCard
                title={isVi ? 'Lợi nhuận ròng' : 'Net Profit'}
                value={fmt(overview.monthlyRevenue - overview.monthlyExpense)}
                icon={TrendingUp}
                tone={overview.monthlyRevenue - overview.monthlyExpense >= 0 ? 'brand' : 'danger'}
              />
            </div>
          )}

          <section className="card overflow-hidden">
            <header className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="section-title">{isVi ? 'Hiệu suất theo bất động sản' : 'Performance by Property'}</h2>
            </header>

            {loading ? (
              <div className="p-5"><div className="skeleton h-40 rounded-xl" /></div>
            ) : properties.length === 0 ? (
              <p className="p-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                {isVi ? 'Chưa có dữ liệu bất động sản.' : 'No property records found.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      {[
                        isVi ? 'Bất động sản' : 'Property',
                        isVi ? 'Tổng phòng' : 'Total Units',
                        isVi ? 'Đang thuê' : 'Occupied',
                        isVi ? 'Trống' : 'Vacant',
                        isVi ? 'Tỷ lệ lấp đầy' : 'Occupancy Rate',
                        isVi ? 'Trạng thái' : 'Status',
                      ].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map(p => {
                      const totalRooms = p.totalRooms ?? 0;
                      const occupied = p.occupiedRooms ?? 0;
                      const rate = totalRooms ? Math.round((occupied / totalRooms) * 100) : 0;
                      return (
                        <tr key={p.id}>
                          <td className="font-medium">{p.name}</td>
                          <td className="tabular-nums" style={{ color: 'var(--text-muted)' }}>{totalRooms}</td>
                          <td className="tabular-nums" style={{ color: 'var(--success)' }}>{occupied}</td>
                          <td className="tabular-nums" style={{ color: 'var(--danger)' }}>{totalRooms - occupied}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-20 h-1.5 rounded-full overflow-hidden"
                                style={{ background: 'var(--border)' }}
                                role="progressbar"
                                aria-valuenow={rate}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <div className="h-full rounded-full" style={{ width: `${rate}%`, background: occColor(rate) }} />
                              </div>
                              <span className="text-sm font-semibold tabular-nums" style={{ color: occColor(rate) }}>{rate}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${p.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                              {p.status === 'ACTIVE' ? (isVi ? 'Hoạt động' : 'Active') : (isVi ? 'Tạm dừng' : 'Paused')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ─── Occupancy ─── */}
      {activeTab === 'occupancy' && (
        <div className="space-y-4">
          {loading ? (
            <div className="skeleton h-48 rounded-2xl" />
          ) : overview && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title={isVi ? 'Tổng phòng' : 'Total Rooms'} value={overview.totalRooms} icon={Building2} tone="brand" />
                <StatCard title={isVi ? 'Đang thuê' : 'Occupied'} value={overview.occupiedRooms} icon={Building2} tone="success" />
                <StatCard title={isVi ? 'Trống' : 'Vacant'} value={overview.availableRooms} icon={Building2} tone="warning" />
                <StatCard title={isVi ? 'Đang bảo trì' : 'Under Maintenance'} value={overview.maintenanceRooms} icon={Wrench} tone="danger" />
              </div>

              <section className="card p-5">
                <h2 className="section-title mb-4">{isVi ? 'Phân bổ trạng thái phòng' : 'Room Status Distribution'}</h2>
                <div className="space-y-4">
                  {[
                    { label: isVi ? 'Đang thuê' : 'Occupied', count: overview.occupiedRooms, color: 'var(--success)' },
                    { label: isVi ? 'Trống' : 'Vacant', count: overview.availableRooms, color: 'var(--warning)' },
                    { label: isVi ? 'Bảo trì' : 'Maintenance', count: overview.maintenanceRooms, color: 'var(--danger)' },
                  ].map(row => {
                    const pct = overview.totalRooms > 0 ? Math.round((row.count / overview.totalRooms) * 100) : 0;
                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between mb-1.5 text-sm">
                          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                          <span className="font-semibold tabular-nums" style={{ color: row.color }}>
                            {row.count} / {overview.totalRooms} ({pct}%)
                          </span>
                        </div>
                        <div
                          className="w-full h-2.5 rounded-full overflow-hidden"
                          style={{ background: 'var(--border)' }}
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={row.label}
                        >
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: row.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  className="mt-5 p-4 rounded-xl flex items-center justify-between gap-4"
                  style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Tỷ lệ lấp đầy tổng' : 'Overall Occupancy Rate'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {overview.occupancyRate >= 80
                        ? (isVi ? 'Đang ở mức tốt' : 'Healthy occupancy rate')
                        : overview.occupancyRate >= 60
                        ? (isVi ? 'Cần cải thiện' : 'Needs attention')
                        : (isVi ? 'Thấp — cần hành động ngay' : 'Low — immediate action required')}
                    </p>
                  </div>
                  <span className="text-2xl font-bold tabular-nums" style={{ color: occColor(overview.occupancyRate) }}>
                    {overview.occupancyRate.toFixed(1)}%
                  </span>
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {/* ─── Maintenance ─── */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          {loading ? (
            <div className="skeleton h-48 rounded-2xl" />
          ) : overview && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                  title={isVi ? 'Yêu cầu đang mở' : 'Open Requests'}
                  value={overview.openMaintenance}
                  icon={Wrench}
                  tone={overview.openMaintenance > 0 ? 'danger' : 'success'}
                />
                <StatCard
                  title={isVi ? 'Công việc đang chờ' : 'Pending Tasks'}
                  value={overview.pendingTasks}
                  icon={Receipt}
                  tone="brand"
                />
              </div>

              <div
                className="card p-5 flex items-start gap-3.5"
                style={{
                  background: overview.openMaintenance === 0 ? 'var(--success-soft)' : 'var(--warning-soft)',
                  borderColor: overview.openMaintenance === 0 ? 'var(--success-border)' : 'var(--warning-border)',
                }}
              >
                <Wrench
                  size={20}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: overview.openMaintenance === 0 ? 'var(--success)' : 'var(--warning)' }}
                />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {overview.openMaintenance === 0
                      ? (isVi ? 'Không có yêu cầu bảo trì tồn đọng' : 'No pending maintenance issues')
                      : (isVi ? `${overview.openMaintenance} yêu cầu bảo trì chưa được xử lý` : `${overview.openMaintenance} unresolved maintenance requests`)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {overview.openMaintenance === 0
                      ? (isVi ? 'Hệ thống thiết bị và phòng ốc đang vận hành tốt.' : 'All facilities are functioning smoothly.')
                      : (isVi ? 'Cần phân công kỹ thuật và xử lý các yêu cầu này sớm.' : 'Prioritize dispatching technicians to resolve pending items.')}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
