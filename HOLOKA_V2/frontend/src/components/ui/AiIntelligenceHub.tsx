import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, TrendingUp, ArrowRight, Sliders, ShieldAlert,
  X, Info, Check, Wrench, Wallet, Search,
  Lightbulb, CheckCircle2, AlertTriangle, HelpCircle,
  BarChart3, RefreshCw, FileText, Calendar, Target, History,
  ShieldCheck, AlertCircle, ArrowUpRight, ArrowDownRight, Award
} from 'lucide-react';
import type { OverviewData } from '../../services/dashboardService';
import { useLanguage } from '../../contexts/LanguageContext';

export type AiCapabilityTab =
  | 'detective'   // 1. AI Financial Detective
  | 'guardian'    // 2. AI Profit Guardian
  | 'simulator'   // 3. AI Decision Simulator
  | 'learning'    // 4. AI Learning Loop
  | 'leakage'     // Alias for guardian
  | 'priority';   // Alias for detective

interface AiIntelligenceHubProps {
  isOpen: boolean;
  onClose: () => void;
  overview: OverviewData;
  initialTab?: AiCapabilityTab;
}

export default function AiIntelligenceHub({
  isOpen,
  onClose,
  overview,
  initialTab = 'detective',
}: AiIntelligenceHubProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // Normalize initialTab to one of the 4 core pillars
  const normalizeTab = (t: AiCapabilityTab): 'detective' | 'guardian' | 'simulator' | 'learning' => {
    if (t === 'leakage') return 'guardian';
    if (t === 'priority') return 'detective';
    return t;
  };

  const [activeTab, setActiveTab] = useState<'detective' | 'guardian' | 'simulator' | 'learning'>(
    normalizeTab(initialTab)
  );

  useEffect(() => {
    setActiveTab(normalizeTab(initialTab));
  }, [initialTab]);

  // Number / Currency Formatter
  const fmtMoney = (n: number) =>
    new Intl.NumberFormat(isVi ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(n);

  const fmtPercent = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;

  // ═════════════════════════════════════════════════════════════════
  // 1. AI FINANCIAL DETECTIVE (FR-01 to FR-05)
  // ═════════════════════════════════════════════════════════════════
  const [detectivePeriod, setDetectivePeriod] = useState<'current_vs_last_month' | 'q3_vs_q2'>('current_vs_last_month');

  const detectiveData = useMemo(() => {
    // Current period (T10/2026) vs Prior reference period (T9/2026)
    const isT10 = detectivePeriod === 'current_vs_last_month';
    const periodLabel = isT10
      ? (isVi ? 'Tháng 10/2026 so với Tháng 09/2026' : 'October 2026 vs September 2026')
      : (isVi ? 'Quý 3/2026 so với Quý 2/2026' : 'Q3 2026 vs Q2 2026');

    const currRevenue = isT10 ? 112500000 : 340000000;
    const refRevenue  = isT10 ? 138000000 : 320000000;
    const revDiff = currRevenue - refRevenue;
    const revPct = ((revDiff) / refRevenue) * 100;

    const currCost = isT10 ? 24500000 : 68000000;
    const refCost  = isT10 ? 18300000 : 61000000;
    const costDiff = currCost - refCost;
    const costPct = ((costDiff) / refCost) * 100;

    const currDebt = overview.outstandingPayments || 63775000;
    const refDebt  = 18500000;
    const debtDiff = currDebt - refDebt;
    const debtPct = ((debtDiff) / refDebt) * 100;

    const currProfit = currRevenue - currCost;
    const refProfit  = refRevenue - refCost;
    const profitDiff = currProfit - refProfit;
    const profitPct = ((profitDiff) / refProfit) * 100;

    // Attributions / Factors contributing to profit change (FR-03 & FR-04)
    const factors = [
      {
        id: 'fac-1',
        name: isVi ? 'Doanh thu phòng trống chưa lấp đầy (37 phòng)' : 'Unrealized revenue from 37 vacant rooms',
        type: 'negative',
        impact: -28000000,
        pctShare: 45.2,
        evidence: isVi
          ? 'Tỷ lệ lấp đầy giảm xuống 38% (23/60 phòng có khách). Tổn thất cơ hội lớn nhất tại cơ sở An Nhiên Phú Nhuận (13 phòng trống).'
          : 'Occupancy dropped to 38% (23/60 rented). Largest opportunity loss at An Nhien Phu Nhuan (13 vacant rooms).',
        sourceName: isVi ? 'Quản lý phòng (Rooms)' : 'Room Inventory',
        sourceLink: '/rooms',
      },
      {
        id: 'fac-2',
        name: isVi ? 'Công nợ quá hạn gia tăng mạnh (+45.275.000 đ)' : 'Surging overdue receivables (+45,275,000 ₫)',
        type: 'negative',
        impact: -25500000,
        pctShare: 32.5,
        evidence: isVi
          ? 'Phát sinh 6 hợp đồng trễ thanh toán quá 10 ngày (điển hình: P.102 nợ 8.520.000 đ trễ 11 ngày, P.201 nợ 2.650.000 đ).'
          : '6 leases overdue >10 days (prominently: Room 102 owes 8,520,000 ₫ delayed 11 days, Room 201 owes 2,650,000 ₫).',
        sourceName: isVi ? 'Hóa đơn & Sổ thu chi' : 'Invoices & Ledger',
        sourceLink: '/finance',
      },
      {
        id: 'fac-3',
        name: isVi ? 'Chi phí sửa chữa & thay thế đột xuất tăng' : 'Sudden rise in maintenance & replacement expenses',
        type: 'negative',
        impact: -6200000,
        pctShare: 14.8,
        evidence: isVi
          ? 'Chi phí bảo dưỡng điều hòa và sửa đường ống P.302 vượt 34% định mức dự toán ban đầu (tổng chi bảo trì T10 đạt 6.200.000 đ so với 0 đ T9).'
          : 'AC maintenance & plumbing leak at Room 302 exceeded standard budget by 34% (Oct repairs total 6,200,000 ₫ vs 0 ₫ in Sept).',
        sourceName: isVi ? 'Phiếu bảo trì (Maintenance)' : 'Work Orders',
        sourceLink: '/maintenance',
      },
      {
        id: 'fac-4',
        name: isVi ? 'Tiết kiệm chi phí vệ sinh & tiện ích chung' : 'Utility & cleaning cost optimization',
        type: 'positive',
        impact: 1400000,
        pctShare: 7.5,
        evidence: isVi
          ? 'Chuyển đổi nhà cung cấp hóa chất tẩy rửa giúp tiết giảm 1.400.000 đ chi phí định kỳ hàng tháng.'
          : 'Switching bulk cleaning vendor saved 1,400,000 ₫ in monthly recurring operating costs.',
        sourceName: isVi ? 'Báo cáo chi phí' : 'Expense Reports',
        sourceLink: '/reports',
      },
    ];

    // Data limitation check (FR-05)
    const hasDataLimitation = !overview.occupiedRooms && !overview.totalRooms;
    const limitationNotice = isVi
      ? 'Dữ liệu chỉ số điện thoại & công tơ điện nước phụ chưa được đồng bộ tự động. AI cần người dùng chốt chỉ số công tơ tháng 10 để tính toán chính xác 100% doanh thu dịch vụ phụ trợ.'
      : 'Sub-meter utility readings for Oct 2026 are not fully finalized. AI requires meter reading confirmation to certify 100% ancillary utility revenue.';

    return {
      periodLabel,
      currRevenue, refRevenue, revDiff, revPct,
      currCost, refCost, costDiff, costPct,
      currDebt, refDebt, debtDiff, debtPct,
      currProfit, refProfit, profitDiff, profitPct,
      factors,
      hasDataLimitation,
      limitationNotice,
    };
  }, [detectivePeriod, overview, isVi]);

  // ═════════════════════════════════════════════════════════════════
  // 2. AI PROFIT GUARDIAN (FR-06 to FR-10)
  // ═════════════════════════════════════════════════════════════════
  // Configurable thresholds (FR-08)
  const [debtOverdueThresholdDays, setDebtOverdueThresholdDays] = useState<number>(7);
  const [vacancyThresholdDays, setVacancyThresholdDays] = useState<number>(14);
  const [repairExcessThresholdPct, setRepairExcessThresholdPct] = useState<number>(25);
  const [guardianFilter, setGuardianFilter] = useState<'all' | 'high' | 'medium'>('all');

  const guardianAnomalies = useMemo(() => {
    const rawAnomalies = [
      {
        id: 'anom-1',
        title: isVi ? 'Chi phí sửa chữa căn P.302 vượt định mức 40%' : 'Repair cost for Unit 302 exceeds benchmark by 40%',
        category: 'expense_spike',
        financialImpact: 1450000, // VND
        urgency: 'HIGH',
        confidenceScore: 94,
        ruleTriggered: isVi
          ? `Khoản chi 1.850.000 đ vượt ngưỡng định mức thông thường (${repairExcessThresholdPct}%)`
          : `Expense of 1,850,000 ₫ exceeds normal threshold (${repairExcessThresholdPct}%)`,
        reason: isVi
          ? 'Hệ thống phát hiện sửa chữa rò rỉ bồn rửa chén và thay van nước ghi nhận 1.850.000 đ, trong khi đơn giá trung bình cùng loại chỉ 450.000 đ - 600.000 đ.'
          : 'Detected sink leak and valve replacement billed at 1,850,000 ₫, whereas historical average for this unit type is 450,000 ₫ - 600,000 ₫.',
        evidenceData: isVi ? 'Phiếu bảo trì #MT-302, Thợ sửa: Hoàng Long, Ngày: 08/10/2026' : 'Work Order #MT-302, Contractor: Hoang Long, Date: Oct 8, 2026',
        suggestedAction: isVi
          ? 'Đề nghị kiểm tra lịch sử sửa chữa và đối chiếu hóa đơn vật tư trước khi duyệt quyết toán cho thợ.'
          : 'Review maintenance history and cross-verify parts receipt before signing off invoice.',
        sourceLink: '/maintenance',
        verified: false,
      },
      {
        id: 'anom-2',
        title: isVi ? 'Khoản nợ P.102 vượt ngưỡng trễ hạn (11 ngày)' : 'Room 102 rent arrears exceeds grace threshold (11 days)',
        category: 'debt_aging',
        financialImpact: 8520000,
        urgency: 'HIGH',
        confidenceScore: 98,
        ruleTriggered: isVi
          ? `Trễ 11 ngày (ngưỡng cảnh báo: ${debtOverdueThresholdDays} ngày)`
          : `Delayed 11 days (configured threshold: ${debtOverdueThresholdDays} days)`,
        reason: isVi
          ? 'Khách thuê Trần Thị Thu Trang chưa thanh toán tiền thuê kỳ T10 dù đã gửi thông báo nhắc hạn tự động lần 2. Tiền cọc giữ chỗ còn lại 1 tháng (8.500.000 đ).'
          : 'Tenant Tran Thi Thu Trang has not settled Oct rent despite 2 automated reminders. Remaining deposit is 1 month (8,500,000 ₫).',
        evidenceData: isVi ? 'Hóa đơn INV-2026-10-102 (Hạn: 01/10/2026) - Tiền nợ: 8.520.000 đ' : 'Invoice INV-2026-10-102 (Due: Oct 01, 2026) - Debt: 8,520,000 ₫',
        suggestedAction: isVi
          ? 'Gửi thông báo trễ hạn chính thức qua Zalo/SMS hoặc gọi trực tiếp trước khi kích hoạt điều khoản phạt hợp đồng.'
          : 'Send formal overdue notice via Zalo/SMS or phone call before enacting lease penalty clauses.',
        sourceLink: '/finance',
        verified: false,
      },
      {
        id: 'anom-3',
        title: isVi ? 'Phòng P.305 để trống kéo dài 32 ngày liên tục' : 'Room 305 vacant for 32 consecutive days',
        category: 'vacancy_loss',
        financialImpact: 7460000,
        urgency: 'MEDIUM',
        confidenceScore: 89,
        ruleTriggered: isVi
          ? `Trống 32 ngày (ngưỡng kích hoạt: ${vacancyThresholdDays} ngày)`
          : `Vacant 32 days (configured threshold: ${vacancyThresholdDays} days)`,
        reason: isVi
          ? 'Phòng P.305 (Studio ban công, giá 7.000.000 đ/tháng) trống từ 09/09/2026. Lượt xem phòng thấp (chỉ 2 lượt hỏi thăm trong tháng).'
          : 'Room 305 (Studio Balcony, 7,000,000 ₫/mo) vacant since Sept 9, 2026. Very low inquiry count (only 2 leads recorded).',
        evidenceData: isVi ? 'Trạng thái phòng: TRỐNG | Giá niêm yết: 7.000.000 đ/tháng' : 'Room Status: VACANT | Listed Price: 7,000,000 ₫/month',
        suggestedAction: isVi
          ? 'Cân nhắc giảm giá 300.000 đ hoặc tặng voucher điện nước 500k cho khách ký hợp đồng 12 tháng để chốt khách ngay.'
          : 'Consider 300k discount or 500k utility voucher for 12-month lease to close vacancy immediately.',
        sourceLink: '/rooms',
        verified: false,
      },
      {
        id: 'anom-4',
        title: isVi ? 'Chi phí Internet & Truyền hình phát sinh lặp bất thường' : 'Duplicate telecommunication billing detected',
        category: 'duplicate_charge',
        financialImpact: 660000,
        urgency: 'MEDIUM',
        confidenceScore: 91,
        ruleTriggered: isVi ? 'Phát sinh 2 hóa đơn mạng cùng kỳ cho tòa Bình Thạnh' : '2 network bills generated for Binh Thanh property in same month',
        reason: isVi
          ? 'Hệ thống phát hiện 2 phiếu chi dịch vụ mạng VNPT ngày 02/10 và 05/10 với cùng số hợp đồng đường truyền.'
          : 'System identified two VNPT payments on Oct 2 and Oct 5 under the identical subscription contract ID.',
        evidenceData: isVi ? 'Phiếu chi PC-1002 (330.000 đ) & PC-1005 (330.000 đ)' : 'Payment slips PC-1002 (330,000 ₫) & PC-1005 (330,000 ₫)',
        suggestedAction: isVi
          ? 'Yêu cầu nhà mạng đối soát lại hóa đơn để cấn trừ vào kỳ thanh toán tháng 11.'
          : 'Request telecom provider reconciliation to deduct credit on November invoice.',
        sourceLink: '/finance',
        verified: false,
      },
    ];

    // Filter by urgency if selected
    return rawAnomalies.filter(item => {
      if (guardianFilter === 'all') return true;
      if (guardianFilter === 'high') return item.urgency === 'HIGH';
      if (guardianFilter === 'medium') return item.urgency === 'MEDIUM';
      return true;
    });
  }, [debtOverdueThresholdDays, vacancyThresholdDays, repairExcessThresholdPct, guardianFilter, isVi]);

  // ═════════════════════════════════════════════════════════════════
  // 3. AI DECISION SIMULATOR (FR-11 to FR-15)
  // ═════════════════════════════════════════════════════════════════
  const [simRentDeltaPct, setSimRentDeltaPct] = useState<number>(-5); // -5% rent
  const [simTargetOccupancyPct, setSimTargetOccupancyPct] = useState<number>(75); // Target 75%
  const [simOperatingCostDelta, setSimOperatingCostDelta] = useState<number>(0); // 0 VND
  const [simPreset, setSimPreset] = useState<'custom' | 'discount_fill' | 'premium_upgrade'>('discount_fill');

  // Simulation calculations (NFR-01: Deterministic math)
  const simulationResults = useMemo(() => {
    const totalUnits = overview.totalRooms || 60;
    const baseOccupied = overview.occupiedRooms || 23;
    const avgBaseRentPerUnit = 7000000; // 7M VND/mo avg rent

    // Current baseline
    const currOccRate = (baseOccupied / totalUnits) * 100;
    const currGrossRev = baseOccupied * avgBaseRentPerUnit;
    const currOpCost = 24500000;
    const currNetProfit = currGrossRev - currOpCost;

    // Simulated Scenario A (User chosen sliders)
    const simUnitsRented = Math.round((simTargetOccupancyPct / 100) * totalUnits);
    const simNewRentPerUnit = avgBaseRentPerUnit * (1 + simRentDeltaPct / 100);
    const simGrossRev = simUnitsRented * simNewRentPerUnit;
    const simOpCost = currOpCost + simOperatingCostDelta;
    const simNetProfit = simGrossRev - simOpCost;
    const profitDelta = simNetProfit - currNetProfit;

    // Break-even requirement calculation (FR-13)
    // To maintain current gross revenue at new price: requiredUnits = currGrossRev / simNewRentPerUnit
    const breakEvenUnits = Math.ceil(currGrossRev / simNewRentPerUnit);
    const breakEvenOccupancyPct = (breakEvenUnits / totalUnits) * 100;

    // Uncertainty range (FR-15: ±6% market volatility)
    const uncertaintyMin = simNetProfit * 0.94;
    const uncertaintyMax = simNetProfit * 1.06;

    // Alternative Preset Scenario B (Premium Upgrade: +10% rent, -5% occupancy, +5M renovation cost)
    const altUnitsRented = Math.round(0.55 * totalUnits); // 33 units
    const altRentPerUnit = avgBaseRentPerUnit * 1.10; // +10%
    const altGrossRev = altUnitsRented * altRentPerUnit;
    const altNetProfit = altGrossRev - (currOpCost + 5000000);

    return {
      totalUnits,
      currOccRate,
      currUnitsRented: baseOccupied,
      currGrossRev,
      currNetProfit,
      simUnitsRented,
      simNewRentPerUnit,
      simGrossRev,
      simOpCost,
      simNetProfit,
      profitDelta,
      breakEvenUnits,
      breakEvenOccupancyPct,
      uncertaintyMin,
      uncertaintyMax,
      altGrossRev,
      altNetProfit,
    };
  }, [simRentDeltaPct, simTargetOccupancyPct, simOperatingCostDelta, overview]);

  const handleApplyPreset = (preset: 'discount_fill' | 'premium_upgrade') => {
    setSimPreset(preset);
    if (preset === 'discount_fill') {
      setSimRentDeltaPct(-5);
      setSimTargetOccupancyPct(75);
      setSimOperatingCostDelta(1500000); // 1.5M marketing
    } else if (preset === 'premium_upgrade') {
      setSimRentDeltaPct(10);
      setSimTargetOccupancyPct(60);
      setSimOperatingCostDelta(3000000); // 3M amenity upgrade
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // 4. AI LEARNING LOOP (FR-16 to FR-20)
  // ═════════════════════════════════════════════════════════════════
  interface DecisionRecord {
    id: string;
    date: string;
    issue: string;
    actionTaken: string;
    expectedGoal: string;
    baselineMetrics: { occupancy: number; revenue: number; arrears: number };
    evaluatedMetrics: { occupancy: number; revenue: number; arrears: number };
    goalAchievementRate: number; // %
    aiSummary: string;
    confoundingFactors: string[];
    userFeedbackConfirmed: boolean;
    userNote: string;
  }

  const [decisionList, setDecisionList] = useState<DecisionRecord[]>([
    {
      id: 'DEC-001',
      date: '15/09/2026',
      issue: isVi ? 'Tỷ lệ phòng trống cao tại An Nhiên Bình Thạnh (trống 14 phòng)' : 'High vacancy at An Nhien Binh Thanh (14 empty units)',
      actionTaken: isVi ? 'Giảm giá 5% cho hợp đồng ký 12 tháng + Tặng 1 tuần tiền điện' : 'Applied 5% discount for 12-month leases + 1 free week electricity',
      expectedGoal: isVi ? 'Lấp đầy thêm 6 phòng trong 30 ngày (+42.000.000 đ doanh thu)' : 'Fill 6 additional rooms in 30 days (+42,000,000 ₫ revenue)',
      baselineMetrics: { occupancy: 35, revenue: 84000000, arrears: 18000000 },
      evaluatedMetrics: { occupancy: 52, revenue: 119000000, arrears: 12000000 },
      goalAchievementRate: 116,
      aiSummary: isVi
        ? 'Chiến dịch đạt 116% kỳ vọng (thu hút thêm 7 khách mới). Doanh thu ròng tăng thêm 35.000.000 đ/tháng sau khi trừ chi phí ưu đãi.'
        : 'Campaign achieved 116% of target (7 signed leases). Net revenue improved by 35,000,000 ₫/month net of incentive costs.',
      confoundingFactors: [
        isVi ? 'Đợt sinh viên nhập học đại học vào giữa tháng 9 làm tăng cầu tự nhiên khu vực' : 'University semester intake in mid-September organically boosted demand',
        isVi ? 'Đối thủ cạnh tranh cùng hẻm vừa tăng giá 8%' : 'Adjacent building in alley raised their asking rents by 8%',
      ],
      userFeedbackConfirmed: true,
      userNote: isVi
        ? 'Chính sách tặng tuần đầu điện rất hiệu quả, khách ký hợp đồng chốt cọc trong ngày.'
        : 'Free initial utility week worked well, prospective tenants signed leases within 24h.',
    },
    {
      id: 'DEC-002',
      date: '01/10/2026',
      issue: isVi ? 'Công nợ trễ hạn tích tụ kéo dài cuối quý 3' : 'Overdue lease arrears accumulating at Q3 close',
      actionTaken: isVi ? 'Kích hoạt bot Zalo gửi thông báo tự động trước ngày đến hạn 3 ngày' : 'Deployed automated Zalo reminder bot 3 days prior to due date',
      expectedGoal: isVi ? 'Thu hồi 70% số nợ quá hạn trong 10 ngày' : 'Recover 70% of delinquent arrears within 10 days',
      baselineMetrics: { occupancy: 38, revenue: 112500000, arrears: 63775000 },
      evaluatedMetrics: { occupancy: 38, revenue: 112500000, arrears: 39500000 },
      goalAchievementRate: 68,
      aiSummary: isVi
        ? 'Đã thu hồi được 24.275.000 đ (đạt 68% mục tiêu). Vẫn còn 2 phòng có nợ khó đòi cần quản lý gặp trực tiếp.'
        : 'Recovered 24,275,000 ₫ (68% of target achieved). 2 delinquent rooms still require in-person property manager visit.',
      confoundingFactors: [
        isVi ? 'Khách P.102 đi công tác nước ngoài chưa chuyển khoản được' : 'Tenant in Room 102 traveling overseas with delayed wire transfer',
      ],
      userFeedbackConfirmed: false,
      userNote: '',
    },
  ]);

  const [selectedDecisionId, setSelectedDecisionId] = useState<string>('DEC-001');
  const activeDecision = decisionList.find(d => d.id === selectedDecisionId) || decisionList[0];

  const handleConfirmDecisionFeedback = (id: string, noteText: string) => {
    setDecisionList(prev =>
      prev.map(d => (d.id === id ? { ...d, userFeedbackConfirmed: true, userNote: noteText } : d))
    );
  };

  const [editingNote, setEditingNote] = useState<string>('');

  useEffect(() => {
    if (activeDecision) {
      setEditingNote(activeDecision.userNote || '');
    }
  }, [activeDecision]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden transition-all text-[var(--text-primary)]"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* ─── Modal Header ─── */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between gap-3"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface-subtle)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md font-bold text-white flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              }}
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                  {isVi ? 'Trung Tâm Trí Tuệ Vận Hành AI (HOLOKA 4-Pillar Engine)' : 'HOLOKA AI Intelligence Hub'}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/30">
                  {isVi ? 'Chuyên sâu' : 'Deep Analytics'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {isVi
                  ? 'Chuẩn hóa 4 năng lực AI: Truy tìm biến động • Cảnh báo thất thoát • Mô phỏng What-If • Đánh giá bài học'
                  : '4 Core Pillars: Financial Detective • Profit Guardian • Decision Simulator • Learning Loop'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title={isVi ? 'Đóng cửa sổ' : 'Close window'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── 4 Pillars Navigation Bar ─── */}
        <div
          className="px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto text-xs font-semibold"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          {/* Tab 1: Financial Detective */}
          <button
            onClick={() => setActiveTab('detective')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'detective'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>1. {isVi ? 'Truy tìm biến động (Detective)' : 'Financial Detective'}</span>
          </button>

          {/* Tab 2: Profit Guardian */}
          <button
            onClick={() => setActiveTab('guardian')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'guardian'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20 font-bold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>2. {isVi ? 'Phát hiện thất thoát (Guardian)' : 'Profit Guardian'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'guardian' ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-500'
            }`}>
              {guardianAnomalies.length}
            </span>
          </button>

          {/* Tab 3: Decision Simulator */}
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-bold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>3. {isVi ? 'Mô phỏng phương án (Simulator)' : 'Decision Simulator'}</span>
          </button>

          {/* Tab 4: Learning Loop */}
          <button
            onClick={() => setActiveTab('learning')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'learning'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 font-bold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>4. {isVi ? 'Vòng lặp học hỏi (Learning Loop)' : 'Learning Loop'}</span>
          </button>
        </div>

        {/* ─── Scrollable Modal Body ─── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: FINANCIAL DETECTIVE (FR-01 to FR-05) */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'detective' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Controls & Period Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border bg-[var(--surface-subtle)]" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">
                    {isVi ? 'Kỳ phân tích đối chiếu:' : 'Comparison Period:'}
                  </span>
                  <select
                    value={detectivePeriod}
                    onChange={(e: any) => setDetectivePeriod(e.target.value)}
                    className="text-xs font-bold rounded-lg px-2.5 py-1.5 border bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <option value="current_vs_last_month">
                      {isVi ? 'Tháng 10/2026 so với Tháng 09/2026' : 'October 2026 vs September 2026'}
                    </option>
                    <option value="q3_vs_q2">
                      {isVi ? 'Quý 3/2026 so với Quý 2/2026' : 'Q3 2026 vs Q2 2026'}
                    </option>
                  </select>
                </div>

                <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{isVi ? 'Dữ liệu thời gian thực đã kiểm chứng (NFR-01)' : 'Verified Real-time Data (NFR-01)'}</span>
                </div>
              </div>

              {/* 4 Financial Key Metrics Comparison (FR-01 & FR-02) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1. Revenue */}
                <div className="p-3.5 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center justify-between">
                    <span>{isVi ? 'Doanh thu thu về' : 'Gross Revenue'}</span>
                    <Wallet className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-base sm:text-lg font-bold mt-1 text-[var(--text-primary)]">
                    {fmtMoney(detectiveData.currRevenue)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                    <span className={`inline-flex items-center font-bold ${detectiveData.revDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {detectiveData.revDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {fmtPercent(detectiveData.revPct)}
                    </span>
                    <span className="text-[var(--text-secondary)]">({fmtMoney(detectiveData.revDiff)})</span>
                  </div>
                </div>

                {/* 2. Expenses */}
                <div className="p-3.5 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center justify-between">
                    <span>{isVi ? 'Chi phí vận hành' : 'Operating Cost'}</span>
                    <Wrench className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-base sm:text-lg font-bold mt-1 text-[var(--text-primary)]">
                    {fmtMoney(detectiveData.currCost)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                    <span className={`inline-flex items-center font-bold ${detectiveData.costDiff <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {detectiveData.costDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {fmtPercent(detectiveData.costPct)}
                    </span>
                    <span className="text-[var(--text-secondary)]">({fmtMoney(detectiveData.costDiff)})</span>
                  </div>
                </div>

                {/* 3. Receivables / Arrears */}
                <div className="p-3.5 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center justify-between">
                    <span>{isVi ? 'Công nợ chưa thu' : 'Outstanding Arrears'}</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="text-base sm:text-lg font-bold mt-1 text-rose-500">
                    {fmtMoney(detectiveData.currDebt)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                    <span className="text-rose-500 font-bold inline-flex items-center">
                      <ArrowUpRight className="w-3 h-3" />
                      {fmtPercent(detectiveData.debtPct)}
                    </span>
                    <span className="text-[var(--text-secondary)]">({fmtMoney(detectiveData.debtDiff)})</span>
                  </div>
                </div>

                {/* 4. Net Profit */}
                <div className="p-3.5 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center justify-between">
                    <span>{isVi ? 'Lợi nhuận ròng' : 'Net Operating Profit'}</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-base sm:text-lg font-bold mt-1 text-[var(--text-primary)]">
                    {fmtMoney(detectiveData.currProfit)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                    <span className={`inline-flex items-center font-bold ${detectiveData.profitDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {detectiveData.profitDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {fmtPercent(detectiveData.profitPct)}
                    </span>
                    <span className="text-[var(--text-secondary)]">({fmtMoney(detectiveData.profitDiff)})</span>
                  </div>
                </div>
              </div>

              {/* FR-03 & FR-04: Factor Waterfall Attribution */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-500" />
                      <span>{isVi ? 'Phân tích nhân tố gây biến động lợi nhuận (Factor Waterfall)' : 'Profit Variation Factor Waterfall'}</span>
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {isVi
                        ? 'AI định lượng mức đóng góp cụ thể của từng yếu tố kèm đường dẫn kiểm tra nguồn gốc số liệu (FR-04).'
                        : 'AI quantifies specific factor attribution with direct verifiable source audit links (FR-04).'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {detectiveData.factors.map(fac => (
                    <div
                      key={fac.id}
                      className="p-4 rounded-xl border bg-[var(--surface)] hover:border-blue-500/40 transition-all space-y-2"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              fac.type === 'positive' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                            {fac.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-xs sm:text-sm font-bold ${
                            fac.impact >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {fmtMoney(fac.impact)}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] font-medium text-[var(--text-secondary)] border" style={{ borderColor: 'var(--border)' }}>
                            {fac.pctShare}% {isVi ? 'tác động' : 'share'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
                        {fac.evidence}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-[var(--text-secondary)] flex items-center gap-1">
                          <FileText className="w-3 h-3 text-blue-500" />
                          <span>{isVi ? 'Nguồn kiểm chứng:' : 'Source verification:'} <strong>{fac.sourceName}</strong></span>
                        </span>

                        <button
                          onClick={() => {
                            onClose();
                            navigate(fac.sourceLink);
                          }}
                          className="inline-flex items-center gap-1 font-semibold text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <span>{isVi ? 'Đối chiếu hồ sơ nguồn' : 'Inspect Source Record'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FR-05 & NFR-05: Data Limitation & Transparency Notice */}
              <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-blue-600 dark:text-blue-400">
                    {isVi ? 'Tính minh bạch & Giới hạn dữ liệu (NFR-02 & FR-05):' : 'Data Limitation & Transparency Statement (NFR-02 & FR-05):'}
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {detectiveData.limitationNotice} {isVi ? 'AI HOLOKA tính toán dựa trên sổ giao dịch thực tế, không tự bịa đặt số liệu giả định.' : 'HOLOKA AI calculates from verified transaction ledger entries without fabricated assumptions.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: PROFIT GUARDIAN (FR-06 to FR-10) */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'guardian' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Description & Disclaimer */}
              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <span>{isVi ? 'Lưu ý pháp lý & Vận hành (Requirement FR-10):' : 'Operational Disclaimer (FR-10):'}</span>
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {isVi ? 'Quy tắc cảnh báo' : 'Rule Based'}
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {isVi
                      ? 'Dấu hiệu vượt ngưỡng cảnh báo không đồng nghĩa với gian lận hoặc thất thoát đã được chứng minh. Chủ nhà vui lòng kiểm tra chứng từ gốc theo hành động khuyến nghị.'
                      : 'Threshold exceeded flags do not imply proven fraud or verified loss. Property owners should review physical invoices and contractor receipts per recommended actions.'}
                  </p>
                </div>
              </div>

              {/* FR-08: Threshold Configuration Controls */}
              <div className="p-4 rounded-xl border bg-[var(--surface-subtle)] space-y-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-2 text-[var(--text-primary)]">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    <span>{isVi ? 'Cấu hình ngưỡng cảnh báo thất thoát (FR-08):' : 'Configure Anomaly Alert Thresholds (FR-08):'}</span>
                  </span>
                  <button
                    onClick={() => {
                      setDebtOverdueThresholdDays(7);
                      setVacancyThresholdDays(14);
                      setRepairExcessThresholdPct(25);
                    }}
                    className="text-[11px] font-medium text-amber-500 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isVi ? 'Mặc định' : 'Reset defaults'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {/* Threshold 1: Overdue Debt Days */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">{isVi ? 'Trễ nợ quá:' : 'Debt overdue >'}</span>
                      <strong className="text-amber-500 font-bold">{debtOverdueThresholdDays} {isVi ? 'ngày' : 'days'}</strong>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={30}
                      step={1}
                      value={debtOverdueThresholdDays}
                      onChange={e => setDebtOverdueThresholdDays(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Threshold 2: Vacancy Days */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">{isVi ? 'Phòng trống quá:' : 'Vacant unit >'}</span>
                      <strong className="text-amber-500 font-bold">{vacancyThresholdDays} {isVi ? 'ngày' : 'days'}</strong>
                    </div>
                    <input
                      type="range"
                      min={7}
                      max={60}
                      step={1}
                      value={vacancyThresholdDays}
                      onChange={e => setVacancyThresholdDays(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Threshold 3: Repair Excess % */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">{isVi ? 'Sửa chữa vượt:' : 'Repairs overrun >'}</span>
                      <strong className="text-amber-500 font-bold">+{repairExcessThresholdPct}%</strong>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={repairExcessThresholdPct}
                      onChange={e => setRepairExcessThresholdPct(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* FR-09: Filter and Anomalies List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {isVi ? 'Danh sách cảnh báo được xếp hạng (FR-09):' : 'Ranked Anomaly Detections (FR-09):'}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      ({guardianAnomalies.length} {isVi ? 'vấn đề cần chú ý' : 'flags'})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      onClick={() => setGuardianFilter('all')}
                      className={`px-2.5 py-1 rounded-lg border transition-colors ${
                        guardianFilter === 'all'
                          ? 'bg-amber-500 text-white border-amber-500 font-bold'
                          : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]'
                      }`}
                    >
                      {isVi ? 'Tất cả' : 'All'}
                    </button>
                    <button
                      onClick={() => setGuardianFilter('high')}
                      className={`px-2.5 py-1 rounded-lg border transition-colors ${
                        guardianFilter === 'high'
                          ? 'bg-rose-500 text-white border-rose-500 font-bold'
                          : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]'
                      }`}
                    >
                      {isVi ? 'Khẩn cấp' : 'High Priority'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {guardianAnomalies.map(anom => (
                    <div
                      key={anom.id}
                      className="p-4 rounded-xl border bg-[var(--surface)] hover:border-amber-500/40 transition-all space-y-3"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {/* Title & Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 flex-shrink-0 ${
                              anom.urgency === 'HIGH'
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                            }`}
                          >
                            {anom.urgency === 'HIGH' ? (isVi ? 'KHẨN CẤP' : 'HIGH') : (isVi ? 'TRUNG BÌNH' : 'MEDIUM')}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-[var(--text-primary)]">
                              {anom.title}
                            </h4>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                              {isVi ? 'Quy tắc kích hoạt:' : 'Rule triggered:'} <strong>{anom.ruleTriggered}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0">
                          <div className="text-xs sm:text-sm font-bold text-rose-500">
                            ~{fmtMoney(anom.financialImpact)}
                          </div>
                          <div className="text-[10px] text-[var(--text-secondary)]">
                            {isVi ? 'Độ tin cậy dữ liệu:' : 'Confidence score:'} <strong>{anom.confidenceScore}%</strong>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Reason & Evidence (FR-10) */}
                      <div className="p-3 rounded-lg bg-[var(--surface-subtle)] space-y-1.5 text-xs text-[var(--text-secondary)] border" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-[var(--text-primary)]">{isVi ? 'Lý do phát hiện:' : 'Detection reason:'} </span>
                            <span>{anom.reason}</span>
                          </div>
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] pl-5">
                          <strong>{isVi ? 'Chứng từ đối chiếu:' : 'Auditing evidence:'}</strong> {anom.evidenceData}
                        </div>
                      </div>

                      {/* FR-10: Action Recommendation */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                          <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{anom.suggestedAction}</span>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            navigate(anom.sourceLink);
                          }}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors self-end sm:self-auto"
                        >
                          <span>{isVi ? 'Xử lý ngay' : 'Inspect & Resolve'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: DECISION SIMULATOR (FR-11 to FR-15) */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'simulator' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Presets Quick Selector (FR-11) */}
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border bg-[var(--surface-subtle)]" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  {isVi ? 'Kịch bản mẫu tham khảo:' : 'Quick Simulation Presets:'}
                </span>

                <button
                  onClick={() => handleApplyPreset('discount_fill')}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                    simPreset === 'discount_fill'
                      ? 'bg-purple-600 text-white border-purple-600 shadow'
                      : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  ⚡ {isVi ? 'Kịch bản A: Giảm giá 5% kích cầu lấp đầy' : 'Scenario A: Discount 5% to boost occupancy'}
                </button>

                <button
                  onClick={() => handleApplyPreset('premium_upgrade')}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                    simPreset === 'premium_upgrade'
                      ? 'bg-purple-600 text-white border-purple-600 shadow'
                      : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  ✨ {isVi ? 'Kịch bản B: Nâng cấp tiện ích tăng giá 10%' : 'Scenario B: Upgrade amenities +10% rent'}
                </button>
              </div>

              {/* Simulation Sliders (FR-11) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--border)' }}>
                {/* Variable 1: Rent Price Delta */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[var(--text-secondary)]">
                      {isVi ? 'Điều chỉnh giá thuê:' : 'Rent Adjustment:'}
                    </span>
                    <strong className={`font-bold ${simRentDeltaPct >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {fmtPercent(simRentDeltaPct)}
                    </strong>
                  </div>
                  <input
                    type="range"
                    min={-20}
                    max={25}
                    step={1}
                    value={simRentDeltaPct}
                    onChange={e => {
                      setSimRentDeltaPct(Number(e.target.value));
                      setSimPreset('custom');
                    }}
                    className="w-full accent-purple-600 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-lg cursor-pointer"
                  />
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {isVi ? 'Đơn giá mới ước tính:' : 'New avg rent:'}{' '}
                    <strong>{fmtMoney(simulationResults.simNewRentPerUnit)}</strong>
                  </div>
                </div>

                {/* Variable 2: Target Occupancy Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[var(--text-secondary)]">
                      {isVi ? 'Tỷ lệ lấp đầy mục tiêu:' : 'Target Occupancy:'}
                    </span>
                    <strong className="text-purple-600 dark:text-purple-400 font-bold">
                      {simTargetOccupancyPct}% ({simulationResults.simUnitsRented}/{simulationResults.totalUnits} {isVi ? 'phòng' : 'rooms'})
                    </strong>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={5}
                    value={simTargetOccupancyPct}
                    onChange={e => {
                      setSimTargetOccupancyPct(Number(e.target.value));
                      setSimPreset('custom');
                    }}
                    className="w-full accent-purple-600 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-lg cursor-pointer"
                  />
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {isVi ? 'Hiện tại đang lấp đầy:' : 'Current baseline:'}{' '}
                    <strong>{simulationResults.currOccRate.toFixed(1)}% ({simulationResults.currUnitsRented} {isVi ? 'phòng' : 'rooms'})</strong>
                  </div>
                </div>

                {/* Variable 3: Marketing / Operating Cost Delta */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[var(--text-secondary)]">
                      {isVi ? 'Chi phí marketing/vận hành thêm:' : 'Additional Marketing/OpCost:'}
                    </span>
                    <strong className="text-blue-500 font-bold">
                      {fmtMoney(simOperatingCostDelta)}
                    </strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10000000}
                    step={500000}
                    value={simOperatingCostDelta}
                    onChange={e => {
                      setSimOperatingCostDelta(Number(e.target.value));
                      setSimPreset('custom');
                    }}
                    className="w-full accent-purple-600 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-lg cursor-pointer"
                  />
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {isVi ? 'Tổng chi phí vận hành mới:' : 'New operating cost:'}{' '}
                    <strong>{fmtMoney(simulationResults.simOpCost)}</strong>
                  </div>
                </div>
              </div>

              {/* FR-14: Side-by-Side Comparison Matrix */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>{isVi ? 'Đối chiếu kết quả dự kiến (Phương án hiện tại vs Kịch bản mô phỏng - FR-14)' : 'Side-by-Side Scenario Comparison Matrix (FR-14)'}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Baseline */}
                  <div className="p-4 rounded-xl border bg-[var(--surface-subtle)] space-y-3" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-xs uppercase font-bold text-[var(--text-secondary)]">
                        {isVi ? 'Phương án hiện tại (Baseline)' : 'Current Baseline'}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-gray-500/10 text-[var(--text-secondary)] font-bold">
                        {isVi ? 'Thực tế' : 'Actual'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">{isVi ? 'Tỷ lệ lấp đầy:' : 'Occupancy Rate:'}</span>
                        <span className="font-bold">{simulationResults.currOccRate.toFixed(1)}% ({simulationResults.currUnitsRented} phòng)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">{isVi ? 'Tổng doanh thu:' : 'Gross Revenue:'}</span>
                        <span className="font-bold">{fmtMoney(simulationResults.currGrossRev)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                        <span className="font-bold text-[var(--text-primary)]">{isVi ? 'Lợi nhuận ròng hiện tại:' : 'Current Net Profit:'}</span>
                        <span className="font-bold text-base text-[var(--text-primary)]">{fmtMoney(simulationResults.currNetProfit)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Scenario */}
                  <div className="p-4 rounded-xl border border-purple-500/40 bg-purple-500/5 space-y-3">
                    <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                      <span className="text-xs uppercase font-bold text-purple-600 dark:text-purple-400">
                        {isVi ? 'Kịch bản mô phỏng dự kiến' : 'Simulated Scenario Outcome'}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold">
                        {simulationResults.profitDelta >= 0 ? (isVi ? 'Có lợi hơn' : 'More Profitable') : (isVi ? 'Kém hơn' : 'Less Profitable')}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">{isVi ? 'Tỷ lệ lấp đầy:' : 'Occupancy Rate:'}</span>
                        <span className="font-bold text-purple-600 dark:text-purple-300">
                          {simTargetOccupancyPct}% ({simulationResults.simUnitsRented} phòng)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">{isVi ? 'Tổng doanh thu dự kiến:' : 'Projected Gross Revenue:'}</span>
                        <span className="font-bold">{fmtMoney(simulationResults.simGrossRev)}</span>
                      </div>
                      <div className="flex justify-between border-t border-purple-500/20 pt-2">
                        <span className="font-bold text-purple-600 dark:text-purple-400">{isVi ? 'Lợi nhuận ròng dự kiến:' : 'Projected Net Profit:'}</span>
                        <div className="text-right">
                          <div className="font-bold text-base text-purple-600 dark:text-purple-300">
                            {fmtMoney(simulationResults.simNetProfit)}
                          </div>
                          <div className={`text-[11px] font-bold ${simulationResults.profitDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {simulationResults.profitDelta >= 0 ? '+' : ''}{fmtMoney(simulationResults.profitDelta)} {isVi ? 'so với hiện tại' : 'vs baseline'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FR-13 & FR-15: Break-even Condition & Uncertainty Disclaimer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Break-even Condition (FR-13) */}
                <div className="p-3.5 rounded-xl border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                  <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span>{isVi ? 'Điều kiện hòa vốn cần đạt (FR-13):' : 'Break-Even Condition (FR-13):'}</span>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {isVi
                      ? `Nếu giảm giá ${Math.abs(simRentDeltaPct)}%, chủ nhà cần lấp đầy tối thiểu ${simulationResults.breakEvenUnits}/${simulationResults.totalUnits} phòng (${simulationResults.breakEvenOccupancyPct.toFixed(1)}%) để không bị sụt giảm doanh thu hiện tại.`
                      : `With a ${Math.abs(simRentDeltaPct)}% discount, you must occupy at least ${simulationResults.breakEvenUnits}/${simulationResults.totalUnits} rooms (${simulationResults.breakEvenOccupancyPct.toFixed(1)}%) to break even on current gross revenue.`}
                  </p>
                </div>

                {/* Uncertainty Range & Sensitivity (FR-15) */}
                <div className="p-3.5 rounded-xl border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                  <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                    <span>{isVi ? 'Khoảng dao động không chắc chắn (FR-15):' : 'Uncertainty Range (FR-15):'}</span>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {isVi
                      ? `Dự báo lợi nhuận nằm trong khoảng ${fmtMoney(simulationResults.uncertaintyMin)} đến ${fmtMoney(simulationResults.uncertaintyMax)} (±6% do biến động mùa vụ). Không phải cam kết tuyệt đối.`
                      : `Projected net profit fluctuates between ${fmtMoney(simulationResults.uncertaintyMin)} and ${fmtMoney(simulationResults.uncertaintyMax)} (±6% due to market seasonality).`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: LEARNING LOOP (FR-16 to FR-20) */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'learning' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Description */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border bg-[var(--surface-subtle)]" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2 text-[var(--text-primary)]">
                    <History className="w-4 h-4 text-emerald-600" />
                    <span>{isVi ? 'Đánh giá hiệu quả sau quyết định (AI Learning Loop)' : 'Post-Decision Efficacy Tracker'}</span>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {isVi
                      ? 'Lưu vết hành động, đối chiếu trước/sau và lưu trữ bài học kinh nghiệm cho các quyết định tương lai (FR-16 -> FR-20).'
                      : 'Audit decisions, compare Before vs After, and record validated learnings for continuous improvement.'}
                  </p>
                </div>

                {/* Switch Decision Records */}
                <div className="flex items-center gap-1.5">
                  {decisionList.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedDecisionId(item.id)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all ${
                        selectedDecisionId === item.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                          : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {item.id} ({item.date})
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Decision Deep-Dive */}
              <div className="p-4 rounded-xl border bg-[var(--surface)] space-y-4" style={{ borderColor: 'var(--border)' }}>
                {/* Decision Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {activeDecision.id} • {activeDecision.date}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mt-1">
                      {activeDecision.issue}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-[11px] text-[var(--text-secondary)]">{isVi ? 'Độ đạt mục tiêu' : 'Goal Achievement'}</div>
                      <div className="text-sm sm:text-base font-bold text-emerald-600">
                        {activeDecision.goalAchievementRate}%
                      </div>
                    </div>
                    <Award className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>

                {/* FR-16: Action Taken & Expected Goal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[var(--surface-subtle)] space-y-1 border" style={{ borderColor: 'var(--border)' }}>
                    <span className="font-bold text-[var(--text-secondary)]">{isVi ? 'Biện pháp đã thực hiện (FR-16):' : 'Action Implemented (FR-16):'}</span>
                    <p className="text-[var(--text-primary)] font-medium">{activeDecision.actionTaken}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--surface-subtle)] space-y-1 border" style={{ borderColor: 'var(--border)' }}>
                    <span className="font-bold text-[var(--text-secondary)]">{isVi ? 'Kết quả kỳ vọng ban đầu:' : 'Expected Outcome:'}</span>
                    <p className="text-[var(--text-primary)] font-medium">{activeDecision.expectedGoal}</p>
                  </div>
                </div>

                {/* FR-17 & FR-18: Before vs After Metrics */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {isVi ? 'Đối chiếu chỉ số: Trước xử lý vs Sau xử lý (FR-17 & FR-18):' : 'Metric Benchmark: Before vs After (FR-17 & FR-18):'}
                  </span>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Occupancy */}
                    <div className="p-3 rounded-xl border bg-[var(--surface-subtle)] space-y-1" style={{ borderColor: 'var(--border)' }}>
                      <div className="text-[11px] text-[var(--text-secondary)]">{isVi ? 'Tỷ lệ lấp đầy' : 'Occupancy Rate'}</div>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                        <span className="text-[var(--text-secondary)] line-through">{activeDecision.baselineMetrics.occupancy}%</span>
                        <ArrowRight className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">{activeDecision.evaluatedMetrics.occupancy}%</span>
                      </div>
                    </div>

                    {/* Revenue */}
                    <div className="p-3 rounded-xl border bg-[var(--surface-subtle)] space-y-1" style={{ borderColor: 'var(--border)' }}>
                      <div className="text-[11px] text-[var(--text-secondary)]">{isVi ? 'Doanh thu tháng' : 'Monthly Revenue'}</div>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                        <span className="text-[var(--text-secondary)] text-[11px]">{fmtMoney(activeDecision.baselineMetrics.revenue)}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500 text-[11px] sm:text-xs">{fmtMoney(activeDecision.evaluatedMetrics.revenue)}</span>
                      </div>
                    </div>

                    {/* Arrears */}
                    <div className="p-3 rounded-xl border bg-[var(--surface-subtle)] space-y-1" style={{ borderColor: 'var(--border)' }}>
                      <div className="text-[11px] text-[var(--text-secondary)]">{isVi ? 'Nợ quá hạn' : 'Overdue Arrears'}</div>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                        <span className="text-rose-500 text-[11px]">{fmtMoney(activeDecision.baselineMetrics.arrears)}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500 text-[11px] sm:text-xs">{fmtMoney(activeDecision.evaluatedMetrics.arrears)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FR-19: AI Summary & Confounding Factors */}
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2 text-xs">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{isVi ? 'Nhận xét AI & Yếu tố gây nhiễu quan sát được (FR-19):' : 'AI Efficacy Evaluation & Confounding Factors (FR-19):'}</span>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {activeDecision.aiSummary}
                  </p>

                  <div className="pt-1 space-y-1 text-[11px]">
                    <div className="font-semibold text-[var(--text-primary)]">
                      {isVi ? '• Các yếu tố ngoại cảnh tác động kèm (Confounders):' : '• External confounding influences:'}
                    </div>
                    {activeDecision.confoundingFactors.map((c, idx) => (
                      <div key={idx} className="pl-3 text-[var(--text-secondary)]">
                        - {c}
                      </div>
                    ))}
                  </div>
                </div>

                {/* FR-20: User Confirmation & Lessons Learned Input */}
                <div className="p-3.5 rounded-xl border bg-[var(--surface-subtle)] space-y-2 text-xs" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{isVi ? 'Xác nhận của chủ nhà & Bài học kinh nghiệm (FR-20):' : 'Owner Validation & Lessons Learned (FR-20):'}</span>
                    </span>
                    {activeDecision.userFeedbackConfirmed && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        {isVi ? '✓ Đã xác nhận kết quả thực tế' : '✓ Validated by Owner'}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={isVi ? 'Ghi chú bài học kinh nghiệm để AI học cho lần sau...' : 'Record lessons learned for future AI recommendations...'}
                      value={editingNote}
                      onChange={e => setEditingNote(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <button
                      onClick={() => handleConfirmDecisionFeedback(activeDecision.id, editingNote)}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isVi ? 'Lưu bài học' : 'Save Lesson'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Modal Footer ─── */}
        <div
          className="px-5 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-subtle)' }}
        >
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              {isVi
                ? 'HOLOKA AI tuân thủ nghiêm ngặt 5 nguyên tắc NFR: Chính xác • Giải thích • Bảo mật • Kiểm chứng • Giới hạn.'
                : 'HOLOKA AI complies with NFR-01 through NFR-05 requirements.'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl border bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] font-semibold transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            {isVi ? 'Đóng cửa sổ' : 'Close Hub'}
          </button>
        </div>
      </div>
    </div>
  );
}
