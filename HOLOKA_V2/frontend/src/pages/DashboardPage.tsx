import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  DoorOpen, CreditCard,
  AlertTriangle, Plus,
  ArrowRight, Building2,
  Wrench, Wallet, TrendingUp, TrendingDown,
  CheckCircle2, Users, BookOpen, PhoneCall,
  ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import {
  getDashboardOverview,
  getDashboardCharts,
  type OverviewData,
  type ChartsData
} from '../services/dashboardService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AiIntelligenceHub from '../components/ui/AiIntelligenceHub';

/* ─── Skeleton Loading ─── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-12 w-80 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[0, 1, 2].map(i => (
          <div key={i} className="skeleton h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [data, setData] = useState<OverviewData | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAiHub, setShowAiHub] = useState(false);
  const [aiHubTab, setAiHubTab] = useState<'leakage' | 'simulator' | 'priority'>('leakage');

  const workspaceId = user?.workspaces?.[0]?.id ?? 1;
  const isVi = language === 'vi';

  useEffect(() => {
    const handleOpenHub = (e: any) => {
      setAiHubTab(e.detail?.tab || 'leakage');
      setShowAiHub(true);
    };
    window.addEventListener('open-ai-hub', handleOpenHub);
    return () => window.removeEventListener('open-ai-hub', handleOpenHub);
  }, []);

  useEffect(() => {
    Promise.all([
      getDashboardOverview(workspaceId),
      getDashboardCharts(workspaceId).catch(() => null)
    ])
      .then(([overview, chartsData]) => {
        setData(overview);
        setCharts(chartsData);
      })
      .catch(err => {
        console.error(err);
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-4">
        <AlertTriangle size={32} className="text-rose-600 flex-shrink-0" />
        <div>
          <p className="font-bold text-lg">Đã xảy ra sự cố</p>
          <p className="text-sm text-rose-700 mt-1">{error}</p>
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
    setAiHubTab(tab);
    setShowAiHub(true);
  };

  const netProfit = (data.monthlyRevenue || 0) - (data.monthlyExpense || 0);
  const totalBilled = (data.monthlyRevenue || 0) + (data.outstandingPayments || 0);
  const collectedPct = totalBilled > 0 ? Math.round(((data.monthlyRevenue || 0) / totalBilled) * 100) : 100;

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans text-left pb-12">

      {/* ─── 1. Header Trang: Chuyên nghiệp, Tự nhiên, Tinh tế ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {greeting}, <span className="text-blue-600 dark:text-blue-400">{user?.fullName || 'Quản lý'}</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Hệ thống: <strong className="text-slate-800 dark:text-slate-200">{user?.workspaces?.[0]?.name ?? 'An Nhiên Living'}</strong></span>
            <span>•</span>
            <span>{new Date().toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </p>
        </div>

        {/* Nút hành động chính */}
        <div className="flex items-center gap-3">
          <NavLink
            to="/properties"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>Thêm phòng / tòa nhà</span>
          </NavLink>
          <NavLink
            to="/finance"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Lập hóa đơn
          </NavLink>
        </div>
      </div>

      {/* ─── 2. Hàng Thẻ Chỉ Số Cốt Lõi (4 KPI Thẻ Tối Giản, Sạch Sẽ) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Tỷ lệ lấp đầy */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tỷ lệ phòng có khách
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center">
              <DoorOpen size={18} />
            </div>
          </div>
          <div className="my-3">
            <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {data.occupancyRate || 72}%
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              <strong className="text-emerald-600 dark:text-emerald-400">{data.occupiedRooms || 13}</strong> / {data.totalRooms || 18} phòng có khách ({data.availableRooms || 4} trống)
            </p>
          </div>
          <NavLink to="/rooms" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            <span>Quản lý phòng</span>
            <ArrowRight size={13} />
          </NavLink>
        </div>

        {/* KPI 2: Tiền phòng đã thu */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tiền phòng đã thu
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="my-3">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {data.monthlyRevenue > 0 ? `${(data.monthlyRevenue / 1_000_000).toFixed(1)} tr` : '0 đ'}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Đạt {collectedPct}% tổng số tiền cần thu kỳ này
            </p>
          </div>
          <NavLink to="/finance" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
            <span>Sổ thu tiền</span>
            <ArrowRight size={13} />
          </NavLink>
        </div>

        {/* KPI 3: Tiền nợ còn lại */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Tiền nợ chưa thu
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="my-3">
            <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
              {data.outstandingPayments > 0 ? `${(data.outstandingPayments / 1_000_000).toFixed(1)} tr` : '0 đ'}
            </p>
            <p className="text-xs font-medium text-rose-700 dark:text-rose-400 mt-1">
              3 khách đang chậm đóng tiền phòng
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAiWithTab('priority')}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 text-left cursor-pointer"
          >
            <span>Nhắc nợ khách</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* KPI 4: Lợi nhuận tạm tính */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Lợi nhuận ước tính
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
          <div className="my-3">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
              {netProfit > 0 ? `${(netProfit / 1_000_000).toFixed(1)} tr` : '0 đ'}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Sau khi trừ {(data.monthlyExpense / 1_000_000).toFixed(1)} tr chi phí sửa & điện nước
            </p>
          </div>
          <NavLink to="/reports" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            <span>Báo cáo lời / lỗ</span>
            <ArrowRight size={13} />
          </NavLink>
        </div>

      </div>

      {/* ─── 3. Hai Cột Chính: Việc Gấp & Trạng Thái Khu Nhà ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Cột Trái (7 phần): Việc cần xử lý hôm nay */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Việc cần xử lý hôm nay
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Các khoản nợ và hợp đồng cần chú ý
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openAiWithTab('priority')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="space-y-3">
            {/* Task 1 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    Nợ quá hạn
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Thu tiền phòng P.102 (chị Trần Thị Thu Trang)
                  </p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Số tiền: <strong className="text-rose-600 dark:text-rose-400">8.520.000 đ</strong> • Quá hạn 11 ngày
                </p>
              </div>

              <button
                type="button"
                onClick={() => openAiWithTab('priority')}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex-shrink-0 cursor-pointer shadow-xs transition-colors"
              >
                Gửi nhắc nợ
              </button>
            </div>

            {/* Task 2 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Sắp hết hạn
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Gia hạn hợp đồng phòng P.101 & P.201
                  </p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Hết hạn trong 17 và 25 ngày tới • Liên quan 16 triệu đ tiền thuê
                </p>
              </div>

              <NavLink
                to="/contracts"
                className="px-3.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold text-xs flex-shrink-0 text-center transition-colors"
              >
                Hỏi gia hạn
              </NavLink>
            </div>

            {/* Task 3 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    Báo hỏng
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Rò rỉ nước bồn rửa chén phòng 302
                  </p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Chưa phân công thợ sửa • Ước tính khoảng 450.000 đ
                </p>
              </div>

              <NavLink
                to="/maintenance"
                className="px-3.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold text-xs flex-shrink-0 text-center transition-colors"
              >
                Giao thợ sửa
              </NavLink>
            </div>
          </div>
        </div>

        {/* Cột Phải (5 phần): Tỷ lệ lấp đầy theo tòa nhà */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Tỷ lệ lấp đầy theo khu
              </h2>
            </div>

            <NavLink to="/properties" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Chi tiết →
            </NavLink>
          </div>

          <div className="space-y-3.5">
            {charts?.occupancy && charts.occupancy.length > 0 ? (
              charts.occupancy.map((prop) => {
                const rate = prop.totalRooms > 0 ? Math.round((prop.occupiedRooms / prop.totalRooms) * 100) : 0;
                return (
                  <div key={prop.propertyId} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                        {prop.name}
                      </span>
                      <span className="font-bold text-blue-700 dark:text-blue-300 text-xs">
                        {rate}%
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-blue-600 h-full transition-all" style={{ width: `${rate}%` }} />
                      <div className="bg-amber-400 h-full transition-all" style={{ width: `${100 - rate}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{prop.occupiedRooms} có khách</span>
                      <span>{prop.availableRooms} phòng trống</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Đang tải dữ liệu tòa nhà...
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ─── Modal Trợ Lý AI ─── */}
      <AiIntelligenceHub
        isOpen={showAiHub}
        onClose={() => setShowAiHub(false)}
        overview={data}
        initialTab={aiHubTab}
      />

    </div>
  );
}

