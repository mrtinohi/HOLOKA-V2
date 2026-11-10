import { Brain, TrendingUp, AlertTriangle, Lightbulb, Building2, ArrowUpRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getDashboardOverview, getDashboardCharts, type OverviewData } from '../services/dashboardService';
import { getProperties, type Property } from '../services/propertyService';
import StatCard from '../components/ui/StatCard';

type Insight = {
  icon: React.ElementType;
  title: string;
  message: string;
  tone: 'danger' | 'warning' | 'brand' | 'info';
};

const TONE: Record<Insight['tone'], { fg: string; bg: string; border: string }> = {
  danger:  { fg: 'var(--danger)',  bg: 'var(--danger-soft)',  border: 'var(--danger-border)' },
  warning: { fg: 'var(--warning)', bg: 'var(--warning-soft)', border: 'var(--warning-border)' },
  brand:   { fg: 'var(--brand)',   bg: 'var(--brand-soft)',   border: 'var(--brand-200)' },
  info:    { fg: 'var(--info)',    bg: 'var(--info-soft)',    border: 'var(--info-border)' },
};

function InsightCard({ insight }: { insight: Insight }) {
  const tone = TONE[insight.tone];
  const Icon = insight.icon;
  return (
    <div
      className="fade-in rounded-xl p-4 flex gap-3.5"
      style={{ background: tone.bg, border: `1px solid ${tone.border}` }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--surface)', color: tone.fg, border: `1px solid ${tone.border}` }}
      >
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{insight.title}</p>
        <p className="text-sm mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight.message}</p>
      </div>
    </div>
  );
}

export default function IntelligencePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const wsId = user!.workspaces[0].id;

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      .catch(() => { if (active) setError(isVi ? 'Không tải được dữ liệu phân tích.' : 'Failed to load intelligence data.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [wsId, isVi]);

  const insights: Insight[] = overview
    ? ([
        overview.occupancyRate < 80 && {
          icon: AlertTriangle,
          title: isVi ? 'Tỷ lệ lấp đầy thấp' : 'Low Occupancy Rate',
          message: isVi
            ? `Tỷ lệ lấp đầy hiện là ${overview.occupancyRate.toFixed(1)}%, dưới mức lý tưởng 80%. Có ${overview.availableRooms} phòng trống cần xử lý.`
            : `Occupancy rate is ${overview.occupancyRate.toFixed(1)}%, below the 80% benchmark. ${overview.availableRooms} vacant units require attention.`,
          tone: 'warning' as const,
        },
        overview.openMaintenance > 0 && {
          icon: AlertTriangle,
          title: isVi ? `${overview.openMaintenance} yêu cầu bảo trì chưa xử lý` : `${overview.openMaintenance} Unresolved Repairs`,
          message: isVi
            ? 'Yêu cầu bảo trì tồn đọng có thể ảnh hưởng đến trải nghiệm khách thuê.'
            : 'Unresolved maintenance tickets may reduce tenant satisfaction.',
          tone: 'danger' as const,
        },
        overview.contractsExpiringSoon > 0 && {
          icon: AlertTriangle,
          title: isVi ? `${overview.contractsExpiringSoon} hợp đồng sắp hết hạn` : `${overview.contractsExpiringSoon} Expiring Leases`,
          message: isVi
            ? 'Liên hệ khách thuê để gia hạn, tránh để phòng trống ngoài kế hoạch.'
            : 'Contact tenants for renewal to avoid unexpected vacancy downtime.',
          tone: 'brand' as const,
        },
        overview.pendingTasks > 0 && {
          icon: Lightbulb,
          title: isVi ? `${overview.pendingTasks} công việc đang chờ xử lý` : `${overview.pendingTasks} Pending Tasks`,
          message: isVi
            ? 'Phân công và ưu tiên xử lý để đảm bảo vận hành trơn tru.'
            : 'Assign staff checklist to maintain smooth operations.',
          tone: 'info' as const,
        },
      ].filter(Boolean) as Insight[])
    : [];

  const occColor = (rate: number) =>
    rate >= 80 ? 'var(--success)' : rate >= 60 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-200)', color: 'var(--brand-text)' }}
            >
              <Brain size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {isVi ? 'Phân tích dự báo' : 'Operations Intelligence'}
            </h1>
          </div>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            {isVi ? 'HOLOKA phân tích dữ liệu vận hành và phát hiện các điểm cần chú ý.' : 'HOLOKA analyzes real-time operations data and detects priority bottlenecks.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-ai-hub', { detail: { tab: 'leakage' } }))}
          className="btn btn-primary inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles size={16} />
          <span>{isVi ? 'Mở Trung tâm Phân tích AI' : 'Open AI Intelligence Hub'}</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl px-3.5 py-2.5 text-sm" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* KPI */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title={isVi ? 'Tỷ lệ lấp đầy' : 'Occupancy Rate'} value={`${overview.occupancyRate.toFixed(1)}%`} icon={TrendingUp} tone={overview.occupancyRate >= 80 ? 'success' : 'warning'} />
          <StatCard title={isVi ? 'Phòng trống' : 'Vacant Units'} value={overview.availableRooms} icon={Building2} tone={overview.availableRooms > 0 ? 'danger' : 'success'} />
          <StatCard title={isVi ? 'Bảo trì tồn đọng' : 'Pending Repairs'} value={overview.openMaintenance} icon={AlertTriangle} tone={overview.openMaintenance > 0 ? 'warning' : 'success'} />
          <StatCard title={isVi ? 'HĐ sắp hết hạn' : 'Expiring Leases'} value={overview.contractsExpiringSoon} icon={Lightbulb} tone="brand" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Insights */}
        <section className="space-y-3">
          <h2 className="section-title">{isVi ? 'Phân tích & cảnh báo' : 'Insights & Alerts'}</h2>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
          ) : insights.length === 0 ? (
            <div className="card p-8 text-center">
              <span
                className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'var(--success-soft)', border: '1px solid var(--success-border)', color: 'var(--success)' }}
              >
                <Brain size={20} />
              </span>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {isVi ? 'Hệ thống đang vận hành tốt' : 'Operations Running Smoothly'}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {isVi ? 'Không phát hiện vấn đề nào cần xử lý.' : 'No critical bottlenecks detected.'}
              </p>
            </div>
          ) : (
            insights.map(insight => <InsightCard key={insight.title} insight={insight} />)
          )}
        </section>

        {/* Property performance */}
        <section className="space-y-3">
          <h2 className="section-title">{isVi ? 'Hiệu suất theo bất động sản' : 'Performance by Property'}</h2>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
          ) : properties.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {isVi ? 'Chưa có bất động sản nào.' : 'No property records available.'}
              </p>
            </div>
          ) : (
            properties.slice(0, 6).map(p => {
              const totalRooms = p.totalRooms ?? 0;
              const occupied = p.occupiedRooms ?? 0;
              const occ = totalRooms ? Math.round((occupied / totalRooms) * 100) : 0;
              return (
                <div key={p.id} className="card p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {totalRooms} {isVi ? 'phòng' : 'units'}
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums" style={{ color: occColor(occ) }}>{occ}%</span>
                  </div>

                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--border)' }}
                    role="progressbar"
                    aria-valuenow={occ}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Tỷ lệ lấp đầy ${p.name}`}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${occ}%`, background: occColor(occ) }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{occupied} {isVi ? 'đang thuê' : 'occupied'}</span>
                    <span>{totalRooms - occupied} {isVi ? 'trống' : 'vacant'}</span>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* AI banner */}
      <div
        className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-200)' }}
      >
        <div className="flex items-start gap-3">
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--surface)', color: 'var(--brand-text)', border: '1px solid var(--brand-200)' }}
          >
            <Lightbulb size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>
              {isVi ? 'Cần kế hoạch hành động chi tiết?' : 'Need an Action Plan?'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {isVi
                ? 'Trợ lý HOLOKA AI tổng hợp số liệu và đề xuất việc cần làm theo mức ưu tiên.'
                : 'HOLOKA AI aggregates real-time metrics and recommends prioritized daily actions.'}
            </p>
          </div>
        </div>
        <NavLink to="/ai" className="btn btn-primary shrink-0">
          <span>{isVi ? 'Mở trợ lý AI' : 'Open AI Assistant'}</span>
          <ArrowUpRight size={15} />
        </NavLink>
      </div>
    </div>
  );
}
