import { Brain, TrendingUp, AlertTriangle, Lightbulb, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardOverview, getDashboardCharts } from '../services/dashboardService';
import type { OverviewData } from '../services/dashboardService';
import { getProperties } from '../services/propertyService';
import type { Property } from '../services/propertyService';

/* ── Insight Card ─────────────────────────────────────────────────────────── */
function InsightCard({ icon: Icon, title, message, color, bg }: {
  icon: React.ElementType;
  title: string;
  message: string;
  color: string;
  bg: string;
}) {
  return (
    <div
      className="fade-in rounded-2xl p-4 flex gap-4"
      style={{ background: bg, border: `1px solid ${color}20` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '20' }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{title}</p>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{message}</p>
      </div>
    </div>
  );
}

export default function IntelligencePage() {
  const { user } = useAuth();
  const wsId = user!.workspaces[0].id;
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardOverview(wsId),
      getProperties(wsId),
      getDashboardCharts(wsId).catch(() => null)
    ])
      .then(([ov, props, charts]) => {
        setOverview(ov);
        if (charts?.occupancy) {
          const occMap = new Map(charts.occupancy.map(o => [o.propertyId, o]));
          const merged = props.map(p => {
            const occ = occMap.get(p.id);
            return {
              ...p,
              totalRooms: occ ? occ.totalRooms : (p.totalRooms ?? 0),
              occupiedRooms: occ ? occ.occupiedRooms : (p.occupiedRooms ?? 0),
            };
          });
          setProperties(merged);
        } else {
          setProperties(props);
        }
      })
      .finally(() => setLoading(false));
  }, [wsId]);

  // Generate insights from real data
  const insights = overview ? [
    overview.occupancyRate < 80 && {
      icon: AlertTriangle,
      title: 'Tỷ lệ lấp đầy thấp',
      message: `Workspace đang có tỷ lệ lấp đầy ${overview.occupancyRate.toFixed(1)}%, dưới mức lý tưởng 80%. Có ${overview.availableRooms} phòng trống cần xử lý.`,
      color: '#f59e0b',
      bg: '#fffbeb',
    },
    overview.openMaintenance > 0 && {
      icon: AlertTriangle,
      title: `${overview.openMaintenance} yêu cầu bảo trì chưa xử lý`,
      message: 'Các yêu cầu bảo trì tồn đọng có thể ảnh hưởng đến trải nghiệm của khách thuê.',
      color: '#f43f5e',
      bg: '#fef2f2',
    },
    overview.contractsExpiringSoon > 0 && {
      icon: AlertTriangle,
      title: `${overview.contractsExpiringSoon} hợp đồng sắp hết hạn`,
      message: 'Cần liên hệ khách thuê để gia hạn hợp đồng, tránh để phòng bị trống.',
      color: '#6366f1',
      bg: '#f5f3ff',
    },
    overview.pendingTasks > 0 && {
      icon: Lightbulb,
      title: `${overview.pendingTasks} công việc đang chờ xử lý`,
      message: 'Phân công và ưu tiên xử lý các task để đảm bảo vận hành hiệu quả.',
      color: '#0284c7',
      bg: '#f0f9ff',
    },
  ].filter(Boolean) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="fade-in">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            <Brain size={20} color="white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Property Intelligence</h1>
        </div>
        <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>
          HOLOKA phân tích dữ liệu vận hành và phát hiện các vấn đề cần chú ý.
        </p>
      </div>

      {/* Overview Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-in">
          {[
            { label: 'Tỷ lệ lấp đầy', value: `${overview.occupancyRate.toFixed(1)}%`, color: overview.occupancyRate >= 80 ? '#10b981' : '#f59e0b', icon: TrendingUp },
            { label: 'Phòng trống', value: overview.availableRooms, color: '#f43f5e', icon: Building2 },
            { label: 'Bảo trì tồn đọng', value: overview.openMaintenance, color: '#f59e0b', icon: AlertTriangle },
            { label: 'HĐ sắp hết hạn', value: overview.contractsExpiringSoon, color: '#6366f1', icon: Lightbulb },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: s.color + '15' }}
                >
                  <s.icon size={17} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#94a3b8' }}>{s.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>🔍 Phân tích & Cảnh báo</h2>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
          ) : insights.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(16,185,129,0.1)' }}>
                <Brain size={22} style={{ color: '#10b981' }} />
              </div>
              <p className="font-semibold" style={{ color: '#0f172a' }}>Hệ thống đang vận hành tốt!</p>
              <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Không phát hiện vấn đề nào cần xử lý.</p>
            </div>
          ) : (
            (insights as Parameters<typeof InsightCard>[0][]).map((ins, i) => (
              <InsightCard key={i} {...ins} />
            ))
          )}
        </div>

        {/* Property Performance */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>📊 Hiệu suất Property</h2>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)
          ) : properties.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-sm" style={{ color: '#94a3b8' }}>Chưa có property nào.</p>
            </div>
          ) : (
            properties.slice(0, 6).map((prop, i) => {
              const occ = prop.totalRooms ? Math.round(((prop.occupiedRooms ?? 0) / prop.totalRooms) * 100) : 0;
              return (
                <div key={prop.id} className="card p-4 fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#0f172a' }}>{prop.name}</p>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>{prop.totalRooms || 0} phòng</p>
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: occ >= 80 ? '#10b981' : occ >= 60 ? '#f59e0b' : '#f43f5e' }}
                    >
                      {occ}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: '#f1f5f9' }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${occ}%`,
                        background: occ >= 80
                          ? 'linear-gradient(90deg,#10b981,#34d399)'
                          : occ >= 60
                          ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                          : 'linear-gradient(90deg,#f43f5e,#fb7185)',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-xs" style={{ color: '#94a3b8' }}>
                    <span>{prop.occupiedRooms ?? 0} đang thuê</span>
                    <span>{(prop.totalRooms ?? 0) - (prop.occupiedRooms ?? 0)} trống</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Coming Soon banner */}
      <div
        className="fade-in rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.15)' }}>
          <Lightbulb size={18} style={{ color: '#6366f1' }} />
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: '#6366f1' }}>Đang phát triển: Phân tích nâng cao</p>
          <p className="text-xs mt-0.5" style={{ color: '#8b5cf6' }}>Revenue trend, chi phí bất thường, vacancy heatmap sẽ ra mắt sớm.</p>
        </div>
      </div>
    </div>
  );
}
