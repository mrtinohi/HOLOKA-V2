import { useState, useEffect } from 'react';
import { BarChart3, FileText, TrendingUp, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardOverview, getDashboardCharts } from '../services/dashboardService';
import type { OverviewData } from '../services/dashboardService';
import { getProperties } from '../services/propertyService';
import type { Property } from '../services/propertyService';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function ReportsPage() {
  const { user } = useAuth();
  const wsId = user!.workspaces[0].id;
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'financial' | 'occupancy' | 'maintenance'>('financial');

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

  const tabs = [
    { key: 'financial',   label: '💰 Tài chính',  icon: TrendingUp },
    { key: 'occupancy',   label: '🏠 Lấp đầy',    icon: BarChart3 },
    { key: 'maintenance', label: '🔧 Bảo trì',    icon: FileText },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="fade-in flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Báo cáo</h1>
          <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>
            Báo cáo tổng hợp hiệu quả vận hành.
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
        >
          <Download size={16} /> Xuất PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap fade-in">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={activeTab === tab.key
              ? { background: '#6366f1', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }
              : { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Financial Report */}
      {activeTab === 'financial' && (
        <div className="space-y-5 fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />) : overview ? [
              { label: 'Doanh thu tháng', value: fmt(overview.monthlyRevenue), color: '#10b981', bg: '#ecfdf5' },
              { label: 'Chi phí tháng', value: fmt(overview.monthlyExpense), color: '#f59e0b', bg: '#fffbeb' },
              { label: 'Lợi nhuận', value: fmt(overview.monthlyRevenue - overview.monthlyExpense), color: '#6366f1', bg: '#f5f3ff' },
            ].map(s => (
              <div key={s.label} className="card p-6" style={{ borderLeft: `4px solid ${s.color}` }}>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-sm mt-1 font-medium" style={{ color: '#64748b' }}>{s.label}</p>
              </div>
            )) : null}
          </div>

          <div className="card p-6">
            <h3 className="font-bold mb-4" style={{ color: '#0f172a' }}>Hiệu suất theo Property</h3>
            {loading ? (
              <div className="skeleton h-40 rounded-xl" />
            ) : properties.length === 0 ? (
              <p className="text-sm" style={{ color: '#94a3b8' }}>Chưa có dữ liệu property.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      {['Property', 'Tổng phòng', 'Đang thuê', 'Trống', 'Tỷ lệ lấp đầy', 'Trạng thái'].map(h => (
                        <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((p) => {
                      const occ = p.totalRooms ? Math.round(((p.occupiedRooms ?? 0) / p.totalRooms) * 100) : 0;
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td className="py-3 font-medium" style={{ color: '#0f172a' }}>{p.name}</td>
                          <td className="py-3" style={{ color: '#64748b' }}>{p.totalRooms ?? 0}</td>
                          <td className="py-3" style={{ color: '#10b981' }}>{p.occupiedRooms ?? 0}</td>
                          <td className="py-3" style={{ color: '#f43f5e' }}>{(p.totalRooms ?? 0) - (p.occupiedRooms ?? 0)}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full" style={{ background: '#f1f5f9' }}>
                                <div className="h-1.5 rounded-full" style={{ width: `${occ}%`, background: occ >= 80 ? '#10b981' : occ >= 60 ? '#f59e0b' : '#f43f5e' }} />
                              </div>
                              <span className="text-sm font-semibold" style={{ color: occ >= 80 ? '#10b981' : occ >= 60 ? '#f59e0b' : '#f43f5e' }}>{occ}%</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {p.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Occupancy Report */}
      {activeTab === 'occupancy' && (
        <div className="space-y-5 fade-in">
          {loading ? (
            <div className="skeleton h-48 rounded-2xl" />
          ) : overview ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Tổng phòng', value: overview.totalRooms, color: '#6366f1' },
                  { label: 'Đang thuê', value: overview.occupiedRooms, color: '#10b981' },
                  { label: 'Trống', value: overview.availableRooms, color: '#f59e0b' },
                  { label: 'Đang bảo trì', value: overview.maintenanceRooms, color: '#f43f5e' },
                ].map(s => (
                  <div key={s.label} className="card p-5">
                    <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-sm mt-1" style={{ color: '#64748b' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="card p-6">
                <h3 className="font-bold mb-6" style={{ color: '#0f172a' }}>Phân bổ trạng thái phòng</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Đang thuê', count: overview.occupiedRooms, total: overview.totalRooms, color: '#10b981' },
                    { label: 'Trống', count: overview.availableRooms, total: overview.totalRooms, color: '#f59e0b' },
                    { label: 'Bảo trì', count: overview.maintenanceRooms, total: overview.totalRooms, color: '#f43f5e' },
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1.5 text-sm">
                        <span className="font-medium" style={{ color: '#374151' }}>{row.label}</span>
                        <span className="font-bold" style={{ color: row.color }}>{row.count} / {row.total} ({overview.totalRooms > 0 ? Math.round((row.count / overview.totalRooms) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full h-3 rounded-full" style={{ background: '#f1f5f9' }}>
                        <div
                          className="h-3 rounded-full transition-all"
                          style={{ width: `${overview.totalRooms > 0 ? (row.count / overview.totalRooms) * 100 : 0}%`, background: row.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl" style={{ background: '#f8fafc' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm" style={{ color: '#0f172a' }}>Tỷ lệ lấp đầy tổng</span>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: overview.occupancyRate >= 80 ? '#10b981' : overview.occupancyRate >= 60 ? '#f59e0b' : '#f43f5e' }}
                    >
                      {overview.occupancyRate.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                    {overview.occupancyRate >= 80 ? '✅ Đang ở mức tốt (>80%)' : overview.occupancyRate >= 60 ? '⚠️ Cần cải thiện (60-80%)' : '🔴 Thấp, cần hành động ngay (<60%)'}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Maintenance Report */}
      {activeTab === 'maintenance' && (
        <div className="space-y-5 fade-in">
          {loading ? (
            <div className="skeleton h-48 rounded-2xl" />
          ) : overview ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-6" style={{ borderLeft: '4px solid #f43f5e' }}>
                <p className="text-3xl font-bold" style={{ color: '#f43f5e' }}>{overview.openMaintenance}</p>
                <p className="text-sm mt-1 font-medium" style={{ color: '#64748b' }}>Yêu cầu đang mở</p>
              </div>
              <div className="card p-6" style={{ borderLeft: '4px solid #6366f1' }}>
                <p className="text-3xl font-bold" style={{ color: '#6366f1' }}>{overview.pendingTasks}</p>
                <p className="text-sm mt-1 font-medium" style={{ color: '#64748b' }}>Task đang chờ</p>
              </div>
              <div className="card p-6 sm:col-span-2">
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: overview.openMaintenance === 0 ? '#ecfdf5' : '#fef2f2', border: `1px solid ${overview.openMaintenance === 0 ? '#a7f3d0' : '#fca5a5'}` }}>
                  <span className="text-2xl">{overview.openMaintenance === 0 ? '✅' : '⚠️'}</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#0f172a' }}>
                      {overview.openMaintenance === 0 ? 'Không có yêu cầu bảo trì tồn đọng' : `${overview.openMaintenance} yêu cầu bảo trì chưa được xử lý`}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                      {overview.openMaintenance === 0 ? 'Hệ thống bảo trì đang vận hành tốt.' : 'Cần phân công và xử lý các yêu cầu này sớm.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
