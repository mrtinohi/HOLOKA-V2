import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  DoorOpen, CreditCard,
  AlertTriangle, Sparkles, Plus,
  ShieldAlert, Sliders, Zap, ArrowRight,
  ChevronRight, Building, Building2, FileText,
  Wrench, Wallet, TrendingUp, TrendingDown,
  CheckCircle2
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

/* ────────── Skeleton ────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-12 w-80 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="skeleton h-36 rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-44 rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 skeleton h-80 rounded-3xl" />
        <div className="lg:col-span-5 skeleton h-80 rounded-3xl" />
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
      <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-center gap-4">
        <AlertTriangle size={32} className="text-rose-600 flex-shrink-0" />
        <div>
          <p className="font-extrabold text-lg">Đã xảy ra sự cố</p>
          <p className="text-base text-rose-700 mt-1">{error}</p>
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
    <div className="space-y-7 text-slate-800 font-sans text-left pb-12">

      {/* ─── 1. Tiêu đề trang & Khu vực làm việc ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {greeting}, <span className="text-blue-700">{user?.fullName || 'Quản Trị Viên'}</span> 👋
          </h1>
          <p className="text-base font-medium text-slate-600 mt-1.5 flex items-center gap-2 flex-wrap">
            <span>Khu vực quản lý: <strong className="text-slate-900">{user?.workspaces?.[0]?.name ?? 'Hệ Thống Bất Động Sản An Nhiên'}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">
              {new Date().toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NavLink
            to="/properties"
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>{isVi ? 'Thêm Bất động sản / Phòng' : 'Add Property / Room'}</span>
          </NavLink>
        </div>
      </div>

      {/* ─── 2. TỔNG QUAN TÀI CHÍNH & DÒNG TIỀN (4 Thẻ Lớn) ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Wallet size={20} className="text-blue-600" />
            <span>{isVi ? 'Tài Chính & Dòng Tiền Tháng Này' : 'Monthly Financial Overview'}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {isVi ? 'Cập nhật theo thời gian thực' : 'Real-time sync'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Doanh thu đã thu */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                {isVi ? 'Tiền Đã Thu' : 'Collected Revenue'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="my-2">
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                {data.monthlyRevenue > 0 ? `${(data.monthlyRevenue / 1_000_000).toFixed(1)} tr` : '0 đ'}
              </p>
              <p className="text-xs font-bold text-slate-500 mt-1">
                {isVi ? `Đạt ${collectedPct}% tổng số tiền cần thu` : `${collectedPct}% collected`}
              </p>
            </div>
            <NavLink
              to="/finance"
              className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              <span>{isVi ? 'Xem sổ thu chi' : 'View finance'}</span>
              <ChevronRight size={14} />
            </NavLink>
          </div>

          {/* Card 2: Tiền nợ chưa thu (Đỏ cảnh báo) */}
          <div className="p-5 rounded-3xl bg-white border-2 border-rose-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-700 uppercase tracking-wider">
                {isVi ? 'Tiền Nợ Chưa Thu' : 'Overdue Arrears'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="my-2">
              <p className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                {data.outstandingPayments > 0 ? `${(data.outstandingPayments / 1_000_000).toFixed(1)} tr` : '0 đ'}
              </p>
              <p className="text-xs font-bold text-rose-700 mt-1">
                {isVi ? 'Có 3 khách chậm đóng tiền' : '3 tenants overdue'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAiWithTab('priority')}
              className="pt-2.5 border-t border-rose-100 flex items-center justify-between text-xs font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
            >
              <span>{isVi ? 'Gửi nhắc nợ ngay' : 'Send reminders'}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Card 3: Chi phí vận hành */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                {isVi ? 'Chi Phí Vận Hành' : 'Operating Expenses'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <TrendingDown size={18} />
              </div>
            </div>
            <div className="my-2">
              <p className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
                {data.monthlyExpense > 0 ? `${(data.monthlyExpense / 1_000_000).toFixed(1)} tr` : '0 đ'}
              </p>
              <p className="text-xs font-bold text-slate-500 mt-1">
                {isVi ? 'Sửa chữa, dịch vụ chung' : 'Repairs & Utilities'}
              </p>
            </div>
            <NavLink
              to="/finance"
              className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              <span>{isVi ? 'Xem chi tiết phí' : 'View expenses'}</span>
              <ChevronRight size={14} />
            </NavLink>
          </div>

          {/* Card 4: Lợi nhuận ròng tạm tính */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                {isVi ? 'Lợi Nhuận Thuần' : 'Net Profit'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <CreditCard size={18} />
              </div>
            </div>
            <div className="my-2">
              <p className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
                {netProfit > 0 ? `${(netProfit / 1_000_000).toFixed(1)} tr` : '0 đ'}
              </p>
              <p className="text-xs font-bold text-slate-500 mt-1">
                {isVi ? 'Đã trừ chi phí vận hành' : 'After monthly expenses'}
              </p>
            </div>
            <NavLink
              to="/reports"
              className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              <span>{isVi ? 'Báo cáo lãi / lỗ' : 'Financial reports'}</span>
              <ChevronRight size={14} />
            </NavLink>
          </div>

        </div>
      </div>

      {/* ─── 3. BẢNG TỔNG QUAN TOÀN BỘ SỐ LIỆU HỆ THỐNG (4 Cụm Chi Tiết) ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Building2 size={20} className="text-indigo-600" />
            <span>{isVi ? 'Tổng Quan Toàn Bộ Tài Sản & Vận Hành' : 'Portfolio & Operational Statistics'}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {isVi ? 'Chi tiết phòng, hợp đồng & bảo trì' : 'Full system metrics'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Group 1: Bất động sản & Tòa nhà */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Building size={17} />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {isVi ? 'Khu Nhà & Tòa Nhà' : 'Properties & Buildings'}
                </h3>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">{isVi ? 'Số khu bất động sản:' : 'Properties:'}</span>
                  <strong className="text-slate-900 font-extrabold text-base">{data.totalProperties} {isVi ? 'khu' : ''}</strong>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">{isVi ? 'Tổng số tòa nhà:' : 'Buildings:'}</span>
                  <strong className="text-slate-900 font-extrabold text-base">{data.totalBuildings} {isVi ? 'tòa' : ''}</strong>
                </div>
              </div>
            </div>
            <NavLink
              to="/properties"
              className="mt-3 pt-2 border-t border-slate-100 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-between"
            >
              <span>{isVi ? 'Xem danh sách khu nhà' : 'View properties'}</span>
              <ChevronRight size={14} />
            </NavLink>
          </div>

          {/* Group 2: Tình trạng phòng ốc */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <DoorOpen size={17} />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {isVi ? 'Tình Trạng Phòng Ốc' : 'Room Availability'}
                </h3>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600">{isVi ? 'Tổng số phòng:' : 'Total rooms:'}</span>
                  <strong className="text-slate-900 font-extrabold">{data.totalRooms} {isVi ? 'phòng' : ''}</strong>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {isVi ? 'Đang có khách:' : 'Occupied:'}
                  </span>
                  <strong className="text-emerald-700 font-extrabold">{data.occupiedRooms}</strong>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {isVi ? 'Phòng trống:' : 'Vacant:'}
                  </span>
                  <strong className="text-blue-700 font-extrabold">{data.availableRooms}</strong>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {isVi ? 'Đang bảo trì:' : 'Maintenance:'}
                  </span>
                  <strong className="text-amber-700 font-extrabold">{data.maintenanceRooms}</strong>
                </div>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">{isVi ? 'Lấp đầy:' : 'Occupancy:'}</span>
              <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                {data.occupancyRate}%
              </span>
            </div>
          </div>

          {/* Group 3: Hợp đồng & Khách thuê */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <FileText size={17} />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {isVi ? 'Hợp Đồng Thuê' : 'Lease Contracts'}
                </h3>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">{isVi ? 'Đang hiệu lực:' : 'Active leases:'}</span>
                  <strong className="text-purple-700 font-extrabold text-base">{data.activeContracts} {isVi ? 'hợp đồng' : ''}</strong>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {isVi ? 'Sắp hết hạn (30 ngày):' : 'Expiring soon:'}
                  </span>
                  <strong className="text-amber-700 font-extrabold text-base">{data.contractsExpiringSoon}</strong>
                </div>
              </div>
            </div>
            <NavLink
              to="/contracts"
              className="mt-3 pt-2 border-t border-slate-100 text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center justify-between"
            >
              <span>{isVi ? 'Xem chi tiết hợp đồng' : 'View contracts'}</span>
              <ChevronRight size={14} />
            </NavLink>
          </div>

          {/* Group 4: Vận hành & Công việc */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Wrench size={17} />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {isVi ? 'Vận Hành & Sự Cố' : 'Maintenance & Tasks'}
                </h3>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">{isVi ? 'Sự cố đang xử lý:' : 'Active repairs:'}</span>
                  <strong className="text-amber-700 font-extrabold text-base">{data.openMaintenance} {isVi ? 'vụ việc' : ''}</strong>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">{isVi ? 'Công việc cần làm:' : 'Pending tasks:'}</span>
                  <strong className="text-blue-700 font-extrabold text-base">{data.pendingTasks} {isVi ? 'nhiệm vụ' : ''}</strong>
                </div>
              </div>
            </div>
            <NavLink
              to="/maintenance"
              className="mt-3 pt-2 border-t border-slate-100 text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center justify-between"
            >
              <span>{isVi ? 'Xử lý sự cố ngay' : 'Handle maintenance'}</span>
              <ChevronRight size={14} />
            </NavLink>
          </div>

        </div>
      </div>

      {/* ─── 4. TRỢ LÝ AI HỖ TRỢ CHỦ NHÀ (3 Lựa Chọn To Bản) ─── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 border-2 border-blue-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles size={18} />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {isVi ? 'Trợ Lý AI HOLOKA Phân Tích & Hỗ Trợ Hôm Nay' : 'HOLOKA AI Landlord Assistant'}
            </h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 self-start sm:self-auto">
            {isVi ? 'Phân tích tự động' : 'Automatic Analysis'}
          </span>
        </div>

        <p className="text-sm sm:text-base text-slate-600 font-medium">
          {isVi
            ? 'Hệ thống đã rà soát toàn bộ số liệu của bạn. Hãy chọn một mục bạn muốn kiểm tra:'
            : 'AI analyzed your entire portfolio. Select an action to view detailed guidance:'}
        </p>

        {/* 3 Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          
          {/* Action 1: Xem thất thoát */}
          <button
            type="button"
            onClick={() => openAiWithTab('leakage')}
            className="p-4.5 rounded-2xl bg-white border-2 border-rose-200 hover:border-rose-400 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold flex-shrink-0">
                <ShieldAlert size={18} />
              </div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-rose-700 transition-colors">
                {isVi ? '1. Xem nguy cơ thất thoát tiền' : '1. Profit Leakage'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {isVi
                ? 'Đang mất ~36.6 triệu/tháng do 4 phòng trống lâu ngày và tiền nợ đọng.'
                : 'Losing ~36.6M/mo from vacancies & arrears.'}
            </p>
            <span className="text-xs font-bold text-rose-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>{isVi ? 'Xem cách xử lý thất thoát' : 'View analysis'}</span>
              <ArrowRight size={14} />
            </span>
          </button>

          {/* Action 2: Tính toán lợi nhuận */}
          <button
            type="button"
            onClick={() => openAiWithTab('simulator')}
            className="p-4.5 rounded-2xl bg-white border-2 border-emerald-200 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                <Sliders size={18} />
              </div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                {isVi ? '2. Thử tính lời / lỗ (Mô phỏng)' : '2. Profit Calculator'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {isVi
                ? 'Kéo thử thanh giá thuê hoặc sửa phòng để xem tiền lời tăng bao nhiêu.'
                : 'Simulate rent increase or renovations to see profit impact.'}
            </p>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>{isVi ? 'Thử tính toán tiền lời ngay' : 'Try calculator'}</span>
              <ArrowRight size={14} />
            </span>
          </button>

          {/* Action 3: Việc quan trọng cần làm */}
          <button
            type="button"
            onClick={() => openAiWithTab('priority')}
            className="p-4.5 rounded-2xl bg-white border-2 border-blue-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                <Zap size={18} />
              </div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-blue-700 transition-colors">
                {isVi ? '3. Việc gấp cần làm hôm nay' : '3. Priority Actions'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {isVi
                ? 'AI đã sắp xếp sẵn việc nào thu được tiền nhiều nhất để làm trước.'
                : 'Ranked actions to recover capital fastest today.'}
            </p>
            <span className="text-xs font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>{isVi ? 'Xem danh sách việc ưu tiên' : 'View actions'}</span>
              <ArrowRight size={14} />
            </span>
          </button>

        </div>
      </div>

      {/* ─── 5. TÌNH TRẠNG LẤP ĐẦY TỪNG KHU & TIẾN ĐỘ THU TIỀN (Charts Data) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Khối Trái (7 phần): Tỉ lệ lấp đầy thực tế từng khu bất động sản */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Building size={17} />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {isVi ? 'Chi Tiết Từng Khu Nhà & Tỷ Lệ Lấp Đầy' : 'Property Occupancy Breakdown'}
              </h3>
            </div>
            <NavLink
              to="/properties"
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              {isVi ? 'Xem tất cả →' : 'View all →'}
            </NavLink>
          </div>

          <div className="space-y-4">
            {charts?.occupancy && charts.occupancy.length > 0 ? (
              charts.occupancy.map((prop) => {
                const rate = prop.totalRooms > 0 ? Math.round((prop.occupiedRooms / prop.totalRooms) * 100) : 0;
                return (
                  <div key={prop.propertyId} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                          {prop.name}
                        </h4>
                      </div>
                      <span className="font-black text-sm text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {rate}% {isVi ? 'lấp đầy' : 'occupied'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${rate}%` }}
                        title={`${prop.occupiedRooms} phòng có khách`}
                      />
                      <div
                        className="bg-blue-400 h-full transition-all duration-500"
                        style={{ width: `${100 - rate}%` }}
                        title={`${prop.availableRooms} phòng trống`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-0.5">
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        {prop.occupiedRooms} {isVi ? 'phòng có khách' : 'occupied'}
                      </span>
                      <span className="text-blue-700 flex items-center gap-1">
                        <DoorOpen size={13} />
                        {prop.availableRooms} {isVi ? 'phòng trống' : 'vacant'}
                      </span>
                      <span className="text-slate-500">
                        {isVi ? 'Tổng' : 'Total'}: {prop.totalRooms} {isVi ? 'phòng' : 'rooms'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-500 text-sm">
                {isVi ? 'Đang tải dữ liệu từng khu nhà...' : 'Loading property data...'}
              </div>
            )}
          </div>
        </div>

        {/* Khối Phải (5 phần): Cân đối thu nợ & Tiền phòng */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CreditCard size={17} />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {isVi ? 'Tỷ Lệ Thu Tiền Phòng' : 'Payment Collection Status'}
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {isVi ? 'Kỳ này' : 'Current period'}
              </span>
            </div>

            <div className="space-y-4 text-left">
              {/* Progress bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-emerald-700">
                    {isVi ? 'Đã thu:' : 'Paid:'} {(data.monthlyRevenue / 1_000_000).toFixed(1)} tr ({collectedPct}%)
                  </span>
                  <span className="text-rose-700">
                    {isVi ? 'Chưa thu:' : 'Unpaid:'} {(data.outstandingPayments / 1_000_000).toFixed(1)} tr ({100 - collectedPct}%)
                  </span>
                </div>

                <div className="w-full bg-rose-200 h-3 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${collectedPct}%` }}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{ width: `${100 - collectedPct}%` }}
                  />
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  {isVi
                    ? 'Tổng tiền phòng cần thu trong kỳ: '
                    : 'Total billed amount: '}
                  <strong className="text-slate-900">
                    {(totalBilled / 1_000_000).toFixed(1)} triệu VNĐ
                  </strong>
                </p>
              </div>

              {/* Summary highlights */}
              <div className="space-y-2 pt-1 text-sm">
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    {isVi ? 'Hợp đồng đã đóng đủ:' : 'Tenants fully paid:'}
                  </span>
                  <strong className="font-black text-emerald-700">10 khách</strong>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 flex items-center justify-between">
                  <span className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle size={16} className="text-rose-600" />
                    {isVi ? 'Khách còn nợ tiền:' : 'Tenants with arrears:'}
                  </span>
                  <strong className="font-black text-rose-700">3 khách</strong>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openAiWithTab('priority')}
            className="w-full mt-4 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm text-center transition-colors block cursor-pointer shadow-sm"
          >
            {isVi ? 'Mở danh sách nhắc nợ 3 khách →' : 'Send reminders to 3 tenants →'}
          </button>
        </div>

      </div>

      {/* ─── 6. VIỆC CẦN XỬ LÝ GẤP HÔM NAY ─── */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle size={17} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isVi ? 'Việc Cần Xử Lý Gấp Hôm Nay' : 'Immediate Actions Needed'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isVi ? 'Các việc ảnh hưởng trực tiếp đến dòng tiền & vận hành' : 'Tasks impacting cash flow and operations'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAiWithTab('priority')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            {isVi ? 'Xem toàn bộ việc →' : 'View all →'}
          </button>
        </div>

        <div className="space-y-3">
          {/* Việc 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-rose-100 text-rose-700">
                  GẤP NHẤT
                </span>
                <p className="text-base font-extrabold text-slate-900">
                  Thu tiền phòng P.102 (chị Trần Thị Thu Trang)
                </p>
              </div>
              <p className="text-sm text-slate-600 font-medium">
                Đang nợ <strong className="text-rose-600">8.520.000 đ</strong> (Đã quá hạn 11 ngày)
              </p>
            </div>

            <button
              type="button"
              onClick={() => openAiWithTab('priority')}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex-shrink-0 cursor-pointer shadow-sm"
            >
              {isVi ? 'Gửi nhắc nợ' : 'Send notice'}
            </button>
          </div>

          {/* Việc 2 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-800">
                  SẮP HẾT HẠN
                </span>
                <p className="text-base font-extrabold text-slate-900">
                  Gia hạn hợp đồng phòng P.101 & P.201
                </p>
              </div>
              <p className="text-sm text-slate-600 font-medium">
                Hợp đồng sẽ hết hạn trong 17 và 25 ngày tới (Liên quan 16 triệu đ tiền thuê)
              </p>
            </div>

            <button
              type="button"
              onClick={() => openAiWithTab('priority')}
              className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm flex-shrink-0 cursor-pointer"
            >
              {isVi ? 'Hỏi gia hạn' : 'Renew'}
            </button>
          </div>

          {/* Việc 3 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-100 text-blue-800">
                  SỬA CHỮA
                </span>
                <p className="text-base font-extrabold text-slate-900">
                  Rò rỉ nước bồn rửa chén phòng 302 Thảo Điền
                </p>
              </div>
              <p className="text-sm text-slate-600 font-medium">
                Chưa phân công thợ sửa (Ước tính khoảng 450.000 đ)
              </p>
            </div>

            <NavLink
              to="/maintenance"
              className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm flex-shrink-0 text-center"
            >
              {isVi ? 'Giao cho thợ' : 'Assign'}
            </NavLink>
          </div>
        </div>
      </div>

      {/* ─── Modal Trợ Lý AI (Light Mode, To Bản) ─── */}
      <AiIntelligenceHub
        isOpen={showAiHub}
        onClose={() => setShowAiHub(false)}
        overview={data}
        initialTab={aiHubTab}
      />

    </div>
  );
}
