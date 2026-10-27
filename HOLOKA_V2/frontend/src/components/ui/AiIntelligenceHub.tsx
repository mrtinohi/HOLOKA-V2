import { useState, useMemo } from 'react';
import {
  Sparkles, TrendingUp,
  ArrowRight, Sliders, ShieldAlert,
  RefreshCw, X, TrendingDown, Info,
  Check
} from 'lucide-react';
import type { OverviewData } from '../../services/dashboardService';
import { useLanguage } from '../../contexts/LanguageContext';

interface AiIntelligenceHubProps {
  isOpen: boolean;
  onClose: () => void;
  overview: OverviewData;
  initialTab?: 'leakage' | 'simulator' | 'priority';
}

type TabType = 'leakage' | 'simulator' | 'priority';

export default function AiIntelligenceHub({
  isOpen,
  onClose,
  overview,
  initialTab = 'leakage',
}: AiIntelligenceHubProps) {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // ────────── Simulator State (What-If Engine) ──────────
  const [rentPriceChange, setRentPriceChange] = useState<number>(5); // % change
  const [targetOccupancy, setTargetOccupancy] = useState<number>(90); // % target
  const [marketingBudget, setMarketingBudget] = useState<number>(2000000); // 2 triệu VND
  const [renovationCost, setRenovationCost] = useState<number>(0); // 0 or investment
  const [actionDone, setActionDone] = useState<{ [key: string]: boolean }>({});

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat(isVi ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(n);

  // ────────── 1. Profit Leakage Analytics ──────────
  const leakageData = useMemo(() => {
    const vacancyLostMonthly = overview.availableRooms * 7000000;
    const debtAtRisk = overview.outstandingPayments;
    const totalPotentialLeakage = vacancyLostMonthly + Math.round(debtAtRisk * 0.35);

    return {
      vacancyLostMonthly,
      debtAtRisk,
      totalPotentialLeakage,
      items: [
        {
          id: 'leak_vacant',
          title: isVi ? 'Tiền bị lãng phí do để phòng trống kéo dài' : 'Revenue loss from vacant units',
          severity: 'QUAN TRỌNG',
          severityColor: '#d97706',
          severityBg: '#fef3c7',
          amount: vacancyLostMonthly,
          sub: isVi
            ? `Hiện đang có 4 phòng chưa có khách thuê. Mỗi ngày để trống làm mất đi khoảng ~940.000 đ.`
            : `4 units vacant. Losing approx ~940,000 VND daily.`,
          rootCause: isVi
            ? 'Nguyên nhân: Giá thuê phòng hiện tại có thể đang cao hơn khu vực xung quanh khoảng 5% hoặc chưa tiếp thị đăng tin tới khách thuê mới.'
            : 'Root cause: Rent price 5% higher than surrounding area or lacking online listings.',
          suggestion: isVi
            ? 'Cách xử lý: Áp dụng ưu đãi giảm nhẹ tháng đầu để khách vào ở ngay, hoặc chi khoảng 1.5 - 2 triệu để đẩy tin đăng tìm khách nhanh.'
            : 'Action: Offer a move-in discount or run targeted rental ads.',
        },
        {
          id: 'leak_debt',
          title: isVi ? 'Nguy cơ mất tiền từ các khoản nợ tiền nhà trễ hạn' : 'Risk from overdue unpaid rent',
          severity: 'GẤP',
          severityColor: '#dc2626',
          severityBg: '#fee2e2',
          amount: debtAtRisk,
          sub: isVi
            ? `Tổng tiền khách chưa đóng: ${fmtMoney(debtAtRisk)}. Trong đó phòng P.102 (chị Trang) nợ 8.520.000 đ đã trễ 11 ngày; phòng P.201 nợ 2.650.000 đ.`
            : `Total unpaid rent: ${fmtMoney(debtAtRisk)}. Unit 102 owes 8.52M VND (11 days overdue).`,
          rootCause: isVi
            ? 'Nguyên nhân: Khách quên hoặc cố tình chậm đóng tiền, chưa nhận được thông báo nhắc nợ có mã QR chuyển khoản nhanh.'
            : 'Root cause: Tenants overdue without automated QR payment reminders.',
          suggestion: isVi
            ? 'Cách xử lý: Bấm nút gửi tin nhắn nhắc nợ kèm mã VietQR chuyển khoản ngay để khách đóng tiền trước khi thâm hụt vào tiền cọc.'
            : 'Action: Send automated VietQR reminder before deposit is depleted.',
        },
        {
          id: 'leak_repair',
          title: isVi ? 'Cảnh báo: Tiền sửa chữa đường nước tăng bất thường' : 'Repair expense anomaly warning',
          severity: 'LƯU Ý',
          severityColor: '#2563eb',
          severityBg: '#dbeafe',
          amount: 280000,
          sub: isVi
            ? 'Sự cố rò rỉ bồn rửa chén ở phòng 302 (Thảo Điền) đã bị sửa đi sửa lại 2 lần trong 45 ngày qua.'
            : 'Sink leak in Unit 302 recurring twice within 45 days.',
          rootCause: isVi
            ? 'Nguyên nhân: Thợ chỉ vá tạm bợ mà không thay ống mới, dẫn đến tốn tiền công sửa nhiều lần.'
            : 'Root cause: Patch repairs instead of replacing aging pipe trap.',
          suggestion: isVi
            ? 'Cách xử lý: Yêu cầu thợ thay mới toàn bộ cụm ống xi-phông inox (khoảng 450.000 đ) dùng bền 5-10 năm, tránh làm hư trần nhà bên dưới.'
            : 'Action: Replace entire trap assembly with stainless steel to prevent ceiling damage.',
        },
      ],
    };
  }, [overview, isVi]);

  // ────────── 2. Simulator Calculations ──────────
  const simResults = useMemo(() => {
    const currentRooms = overview.totalRooms || 18;
    const currentBaseRent = 7500000;
    const currentRevenue = overview.monthlyRevenue || 85850000;
    const currentExpense = (overview.monthlyExpense || 300000) + 12000000;
    const currentNetProfit = currentRevenue - currentExpense;

    const newRent = currentBaseRent * (1 + rentPriceChange / 100);
    const newOccupiedRooms = Math.round((currentRooms * targetOccupancy) / 100);
    const projectedRevenue = newOccupiedRooms * newRent;

    const projectedExpense = currentExpense + marketingBudget + (renovationCost > 0 ? renovationCost / 12 : 0);
    const projectedNetProfit = projectedRevenue - projectedExpense;

    const profitDifference = projectedNetProfit - currentNetProfit;
    const profitGrowthPercent = currentNetProfit > 0 ? (profitDifference / currentNetProfit) * 100 : 0;

    const paybackMonths =
      renovationCost > 0 && profitDifference > 0
        ? (renovationCost / profitDifference).toFixed(1)
        : null;

    let verdict = '';
    let verdictColor = '';
    if (profitDifference > 5000000) {
      verdict = isVi
        ? '✅ Phương án này rất tốt! Dự kiến giúp bạn kiếm thêm tiền lời đáng kể mỗi tháng.'
        : 'Highly optimal scenario with strong profit growth.';
      verdictColor = '#059669';
    } else if (profitDifference > 0) {
      verdict = isVi
        ? 'ℹ️ Phương án này an toàn. Tiền lời tăng nhẹ, phù hợp giữ ổn định lâu dài.'
        : 'Safe scenario with moderate incremental gains.';
      verdictColor = '#2563eb';
    } else {
      verdict = isVi
        ? '⚠️ Cẩn thận: Phương án này có thể làm bạn giảm tiền lời do chi phí bỏ ra quá nhiều.'
        : 'Warning: Increased budget yields lower net profit.';
      verdictColor = '#dc2626';
    }

    return {
      currentRevenue,
      currentNetProfit,
      projectedRevenue,
      projectedExpense,
      projectedNetProfit,
      profitDifference,
      profitGrowthPercent,
      newOccupiedRooms,
      paybackMonths,
      verdict,
      verdictColor,
    };
  }, [overview, rentPriceChange, targetOccupancy, marketingBudget, renovationCost, isVi]);

  // ────────── 3. Priority Actions ──────────
  const priorityActions = useMemo(() => [
    {
      id: 'act_1',
      priorityBadge: isVi ? 'VIỆC GẤP SỐ 1' : 'PRIORITY 1',
      badgeColor: '#dc2626',
      badgeBg: '#fee2e2',
      title: isVi ? 'Thu tiền nợ phòng 102 (chị Trần Thị Thu Trang)' : 'Collect overdue rent Unit 102',
      moneyAtRisk: 8520000,
      reason: isVi ? 'Đã trễ 11 ngày. Nếu không nhắc sớm, tiền nợ sẽ vượt quá tiền đặt cọc của khách.' : '11 days overdue. Debt risks exceeding deposit.',
      who: isVi ? 'Chủ nhà hoặc Kế toán' : 'Owner or Accountant',
      actionBtn: isVi ? 'Bấm để gửi tin nhắn nhắc nợ (kèm mã QR)' : 'Send QR payment reminder',
    },
    {
      id: 'act_2',
      priorityBadge: isVi ? 'VIỆC QUAN TRỌNG SỐ 2' : 'PRIORITY 2',
      badgeColor: '#d97706',
      badgeBg: '#fef3c7',
      title: isVi ? 'Hỏi gia hạn 2 hợp đồng sắp hết hạn (P.101 & P.201)' : 'Renew expiring leases (Units 101 & 201)',
      moneyAtRisk: 16000000,
      reason: isVi ? 'Hợp đồng sẽ hết hạn sau 17 và 25 ngày nữa. Cần hỏi sớm để nếu khách chuyển đi thì kịp tìm người mới, tránh để trống.' : 'Expiring in 17 & 25 days. Inquire now to prevent vacancy.',
      who: isVi ? 'Quản lý tòa nhà' : 'Property Manager',
      actionBtn: isVi ? 'Tạo phụ lục gia hạn hợp đồng giữ giá cũ' : 'Create renewal agreement',
    },
    {
      id: 'act_3',
      priorityBadge: isVi ? 'CẦN LÀM TRONG TUẦN' : 'PRIORITY 3',
      badgeColor: '#2563eb',
      badgeBg: '#dbeafe',
      title: isVi ? 'Tìm khách cho 4 phòng đang trống (P.202, B201, 301, 301-BT)' : 'Fill 4 vacant units',
      moneyAtRisk: 28000000,
      reason: isVi ? 'Phòng P.202 đã để trống 21 ngày, mỗi ngày trôi qua mất gần 300.000 đ tiền thuê.' : 'Unit 202 vacant for 21 days, burning ~300k VND daily.',
      who: isVi ? 'Người phụ trách đăng tin' : 'Leasing Staff',
      actionBtn: isVi ? 'Đăng tin tìm khách với ưu đãi dọn vào ngay' : 'Post rental listing with promo',
    },
  ], [isVi]);

  const handleExecuteAction = (id: string) => {
    setActionDone(prev => ({ ...prev, [id]: true }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Main Dialog (Light Mode, Senior-Friendly, High Contrast) */}
      <div
        className="relative w-full max-w-4xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-800 z-10 my-auto flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {isVi ? 'Trợ Lý AI HOLOKA — Hỗ Trợ Chủ Nhà' : 'HOLOKA AI Landlord Assistant'}
              </h2>
              <p className="text-sm font-medium text-slate-600 mt-0.5">
                {isVi
                  ? 'Phát hiện thất thoát tiền • Tính toán lợi nhuận • Nhắc việc quan trọng cần làm'
                  : 'Loss prevention • Profit simulation • Priority task guidance'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer text-base font-bold"
            title="Đóng cửa sổ"
          >
            <X size={20} />
          </button>
        </div>

        {/* 3 Main Tabs (Large, Clear, High-Contrast) */}
        <div className="flex items-center border-b border-slate-200 bg-white px-6 gap-2 overflow-x-auto">
          {[
            {
              id: 'leakage',
              label: isVi ? '1. Xem nguy cơ thất thoát tiền' : '1. Profit Leakage',
              badge: `Mất ~${fmtMoney(leakageData.totalPotentialLeakage)}/tháng`,
              badgeBg: '#fee2e2',
              badgeColor: '#dc2626',
            },
            {
              id: 'simulator',
              label: isVi ? '2. Thử tính lời / lỗ khi thay đổi giá' : '2. Profit Calculator',
              badge: isVi ? 'Thử tính toán' : 'Simulate',
              badgeBg: '#dcfce7',
              badgeColor: '#16a34a',
            },
            {
              id: 'priority',
              label: isVi ? '3. Việc quan trọng cần làm ngay' : '3. Priority Tasks',
              badge: isVi ? '3 việc cần làm' : '3 actions',
              badgeBg: '#fef3c7',
              badgeColor: '#d97706',
            },
          ].map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-4 font-bold text-sm sm:text-base border-b-4 transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className="text-xs font-black px-2.5 py-0.5 rounded-full"
                  style={{ background: tab.badgeBg, color: tab.badgeColor }}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/60">

          {/* ══════════ TAB 1: NGUY CƠ THẤT THOÁT TIỀN ══════════ */}
          {activeTab === 'leakage' && (
            <div className="space-y-5">
              {/* Summary Alert Box */}
              <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <ShieldAlert size={26} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-rose-950">
                      {isVi
                        ? `Ước tính tiền đang bị thất thoát: ~${fmtMoney(leakageData.totalPotentialLeakage)} / tháng`
                        : `Estimated Monthly Leakage: ~${fmtMoney(leakageData.totalPotentialLeakage)}`}
                    </h3>
                    <p className="text-sm font-medium text-rose-800 mt-1 leading-relaxed">
                      {isVi
                        ? 'Chủ nhà hãy chú ý: Tiền thất thoát chủ yếu đến từ 4 phòng đang để trống lâu ngày và các khoản nợ tiền thuê chưa được nhắc thu.'
                        : 'Losses are driven by 4 extended vacant units and uncollected rental debts.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="px-4 py-2.5 rounded-xl bg-white border border-rose-200 shadow-sm text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase">{isVi ? 'Phòng trống' : 'Vacancies'}</p>
                    <p className="text-xl font-black text-amber-600">{overview.availableRooms} {isVi ? 'phòng' : 'rooms'}</p>
                  </div>
                  <div className="px-4 py-2.5 rounded-xl bg-white border border-rose-200 shadow-sm text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase">{isVi ? 'Khách nợ' : 'Arrears'}</p>
                    <p className="text-xl font-black text-rose-600">{fmtMoney(overview.outstandingPayments)}</p>
                  </div>
                </div>
              </div>

              {/* Detail Items */}
              <div className="space-y-4">
                <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Info size={18} className="text-blue-600" />
                  {isVi ? 'Chi tiết 3 vấn đề đang làm giảm tiền lời của bạn:' : 'Detailed Loss Points:'}
                </h4>

                <div className="space-y-3.5">
                  {leakageData.items.map(item => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs font-black uppercase"
                            style={{ background: item.severityBg, color: item.severityColor }}
                          >
                            {item.severity}
                          </span>
                          <h5 className="text-base font-extrabold text-slate-900">{item.title}</h5>
                        </div>

                        <span className="text-lg font-black text-rose-600 flex-shrink-0">
                          Mất ~{fmtMoney(item.amount)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {item.sub}
                      </p>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1.5">
                        <p className="text-slate-800 font-medium">
                          <strong className="text-amber-800">🔍 Tại sao bị:</strong> {item.rootCause}
                        </p>
                        <p className="text-slate-800 font-medium">
                          <strong className="text-emerald-700">💡 Lời khuyên của AI:</strong> {item.suggestion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ TAB 2: THỬ TÍNH LỢI NHUẬN (WHAT-IF) ══════════ */}
          {activeTab === 'simulator' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-sm text-blue-900 font-medium">
                💡 <strong>Dành cho chủ nhà:</strong> Bạn muốn tăng giá thuê, sửa phòng hay chạy quảng cáo? Hãy kéo các thanh trượt bên dưới, AI sẽ tự động tính ngay xem tiền lời mỗi tháng sẽ tăng hay giảm!
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Simple Controls */}
                <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Sliders size={18} className="text-blue-600" />
                      {isVi ? 'Bạn muốn thử phương án nào?' : 'Choose Assumptions'}
                    </h4>
                    <button
                      onClick={() => {
                        setRentPriceChange(5);
                        setTargetOccupancy(90);
                        setMarketingBudget(2000000);
                        setRenovationCost(0);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      {isVi ? 'Đặt lại ban đầu' : 'Reset'}
                    </button>
                  </div>

                  {/* 1. Price Adjustment */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-800">{isVi ? '1. Bạn muốn tăng hay giảm giá thuê?' : '1. Price change:'}</span>
                      <span className="text-base font-black px-3 py-1 rounded-xl bg-blue-100 text-blue-800">
                        {rentPriceChange > 0 ? `Tăng +${rentPriceChange}%` : rentPriceChange === 0 ? 'Giữ nguyên giá' : `Giảm ${rentPriceChange}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-15"
                      max="30"
                      step="2.5"
                      value={rentPriceChange}
                      onChange={e => setRentPriceChange(Number(e.target.value))}
                      className="w-full h-3 bg-slate-200 rounded-lg accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>Giảm 15% (Đại hạ giá)</span>
                      <span>Giữ nguyên</span>
                      <span>Tăng 30% (Tăng mạnh)</span>
                    </div>
                  </div>

                  {/* 2. Occupancy Slider */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-800">{isVi ? '2. Số phòng có khách ở kỳ vọng:' : '2. Target Occupancy:'}</span>
                      <span className="text-base font-black px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800">
                        {simResults.newOccupiedRooms} / 18 phòng ({targetOccupancy}%)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="5"
                      value={targetOccupancy}
                      onChange={e => setTargetOccupancy(Number(e.target.value))}
                      className="w-full h-3 bg-slate-200 rounded-lg accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>50% (Trống 1 nửa)</span>
                      <span>Hiện tại (72%)</span>
                      <span>100% (Thuê kín phòng)</span>
                    </div>
                  </div>

                  {/* 3. Marketing Ads */}
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-800 block">
                      {isVi ? '3. Chi tiền tìm khách / đăng tin quảng cáo:' : '3. Ad spend:'}
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { val: 0, label: '0 đ (Tự tìm)' },
                        { val: 2000000, label: '2 triệu đ' },
                        { val: 5000000, label: '5 triệu đ' },
                      ].map(item => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setMarketingBudget(item.val)}
                          className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer ${
                            marketingBudget === item.val
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Renovation */}
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-800 block">
                      {isVi ? '4. Tiền bỏ ra sửa chữa / nâng cấp nội thất:' : '4. Renovation:'}
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { val: 0, label: 'Không sửa' },
                        { val: 15000000, label: 'Chi 15 triệu' },
                        { val: 45000000, label: 'Chi 45 triệu' },
                      ].map(item => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setRenovationCost(item.val)}
                          className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer ${
                            renovationCost === item.val
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Results Forecast */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                  {/* Big Profit Box */}
                  <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-2">
                    <p className="text-sm font-bold text-emerald-800 uppercase tracking-wide">
                      {isVi ? 'TIỀN LỜI RÒNG DỰ KIẾN MỖI THÁNG' : 'EXPECTED MONTHLY NET PROFIT'}
                    </p>
                    <p className="text-3xl sm:text-4xl font-black text-emerald-700">
                      {fmtMoney(simResults.projectedNetProfit)}
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-300 text-sm font-extrabold text-emerald-800">
                      {simResults.profitGrowthPercent >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      <span>
                        {simResults.profitGrowthPercent >= 0
                          ? `Tăng thêm +${fmtMoney(simResults.profitDifference)} (+${simResults.profitGrowthPercent.toFixed(1)}%)`
                          : `Giảm ${fmtMoney(simResults.profitDifference)} (${simResults.profitGrowthPercent.toFixed(1)}%)`}
                      </span>
                    </div>
                  </div>

                  {/* Comparisons */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 text-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-600">{isVi ? 'Tổng tiền thu vào dự kiến:' : 'Projected revenue:'}</span>
                      <strong className="text-base text-slate-900">{fmtMoney(simResults.projectedRevenue)}</strong>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-600">{isVi ? 'Chi phí vận hành & đăng tin:' : 'Projected expense:'}</span>
                      <strong className="text-base text-slate-900">{fmtMoney(simResults.projectedExpense)}</strong>
                    </div>
                    {renovationCost > 0 && (
                      <div className="flex justify-between items-center pt-1 text-blue-900">
                        <span className="font-bold">{isVi ? 'Thời gian hoàn lại vốn sửa nhà:' : 'Payback period:'}</span>
                        <strong className="text-base text-blue-700">
                          {simResults.paybackMonths ? `Khoảng ${simResults.paybackMonths} tháng` : 'Chưa có lời'}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Verdict Box */}
                  <div
                    className="p-5 rounded-2xl border-2 flex items-start gap-3.5 bg-white shadow-sm"
                    style={{ borderColor: simResults.verdictColor }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold"
                      style={{ background: simResults.verdictColor }}
                    >
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {isVi ? 'ĐÁNH GIÁ CỦA AI HOLOKA:' : 'AI VERDICT:'}
                      </p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5 leading-snug">
                        {simResults.verdict}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ══════════ TAB 3: VIỆC CẦN LÀM NGAY (MA TRẬN ƯU TIÊN) ══════════ */}
          {activeTab === 'priority' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 font-medium">
                🎯 <strong>AI đã sắp xếp sẵn theo thứ tự:</strong> Việc làm trước giúp tránh mất tiền nhiều nhất sẽ được đưa lên đầu danh sách để bạn xử lý ngay.
              </div>

              <div className="space-y-4">
                {priorityActions.map(act => {
                  const isDone = actionDone[act.id];
                  return (
                    <div
                      key={act.id}
                      className={`p-6 rounded-2xl border-2 transition-all bg-white ${
                        isDone ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="px-3 py-1 rounded-xl text-xs font-black tracking-wider uppercase"
                            style={{ background: act.badgeBg, color: act.badgeColor }}
                          >
                            {act.priorityBadge}
                          </span>
                          <h4 className="text-lg font-black text-slate-900">
                            {act.title}
                          </h4>
                        </div>

                        <span className="text-base font-black text-rose-600">
                          {isVi ? 'Liên quan:' : 'Amount:'} {fmtMoney(act.moneyAtRisk)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1 mb-4">
                        <p className="text-slate-800">
                          <strong>⚠️ Lý do cần làm gấp:</strong> {act.reason}
                        </p>
                        <p className="text-slate-600">
                          <strong>👤 Người làm:</strong> {act.who}
                        </p>
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleExecuteAction(act.id)}
                          disabled={isDone}
                          className={`py-3 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 transition-all cursor-pointer ${
                            isDone
                              ? 'bg-emerald-600 text-white cursor-default shadow-sm'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <Check size={18} />
                              <span>{isVi ? 'Đã xử lý xong việc này' : 'Done'}</span>
                            </>
                          ) : (
                            <>
                              <span>{act.actionBtn}</span>
                              <ArrowRight size={18} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">
              {isVi
                ? 'Hệ thống HOLOKA đang bảo vệ và tính toán số liệu liên tục'
                : 'HOLOKA AI Protection is running'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer text-sm"
          >
            {isVi ? 'Đóng cửa sổ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
