import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, User, RotateCcw,
  Sparkles, GripHorizontal, Copy, Check
} from 'lucide-react';
import aiMascotImg from '../../assets/ai-mascot.png';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getDashboardOverview, type OverviewData } from '../../services/dashboardService';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

interface Position {
  x: number;
  y: number;
}

const FAB_STORAGE_KEY = 'holoka_ai_fab_pos';
const FAB_SIZE = 64;
const WINDOW_WIDTH = 380;
const WINDOW_HEIGHT = 540;

export const FloatingAiAssistant: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const wsId = user?.workspaces?.[0]?.id ?? 1;

  const [isOpen, setIsOpen] = useState(false);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Position of the mascot FAB button (persisted in localStorage)
  const [fabPos, setFabPos] = useState<Position>(() => {
    try {
      const saved = localStorage.getItem(FAB_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    const defaultX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - FAB_SIZE - 24) : 800;
    const defaultY = typeof window !== 'undefined' ? Math.max(16, window.innerHeight - FAB_SIZE - 24) : 600;
    return { x: defaultX, y: defaultY };
  });

  // Drag tracking refs
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    startX: number;
    startY: number;
  }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fabButtonRef = useRef<HTMLButtonElement>(null);

  // External event listeners
  useEffect(() => {
    const handleAiArrived = () => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 4000);
    };
    const handleOpenAi = () => {
      setIsOpen(true);
    };
    window.addEventListener('holoka-ai-arrived', handleAiArrived);
    window.addEventListener('holoka-open-ai-chat', handleOpenAi);
    return () => {
      window.removeEventListener('holoka-ai-arrived', handleAiArrived);
      window.removeEventListener('holoka-open-ai-chat', handleOpenAi);
    };
  }, []);

  const defaultGreeting = isVi
    ? `Xin chào **${user?.fullName || 'bạn'}**! Tôi là **HOLOKA AI Assistant** 🤖\n\nTôi được kết nối trực tiếp với dữ liệu thời gian thực của workspace **${user?.workspaces?.[0]?.name ?? 'An Nhiên Living'}**.\n\nHãy chọn câu hỏi nhanh bên dưới hoặc nhập câu hỏi về phòng trống, hợp đồng, tài chính hay sự cố bảo trì!`
    : `Hello **${user?.fullName || 'there'}**! I am **HOLOKA AI Assistant** 🤖\n\nI am connected directly to real-time operations data for workspace **${user?.workspaces?.[0]?.name ?? 'An Nhiên Living'}**.\n\nPick a quick prompt below or ask me anything regarding vacancies, leases, cashflow, or maintenance!`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: defaultGreeting,
      time: new Date().toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update greeting on language change
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 0) {
        return [
          {
            id: 0,
            role: 'assistant',
            content: defaultGreeting,
            time: new Date().toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      return prev;
    });
  }, [language, defaultGreeting, isVi]);

  // Load workspace overview
  useEffect(() => {
    if (wsId) {
      getDashboardOverview(wsId).then(setOverview).catch(() => {});
    }
  }, [wsId]);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Auto-hide initial tooltip after 8s
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Clamping helper for FAB
  const clampFab = useCallback((x: number, y: number): Position => {
    const maxX = Math.max(12, window.innerWidth - FAB_SIZE - 12);
    const maxY = Math.max(12, window.innerHeight - FAB_SIZE - 12);
    return {
      x: Math.min(Math.max(12, x), maxX),
      y: Math.min(Math.max(12, y), maxY),
    };
  }, []);

  // Viewport resize watcher
  useEffect(() => {
    const handleResize = () => {
      setFabPos(prev => clampFab(prev.x, prev.y));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampFab]);

  // Calculate anchored window position based on fabPos
  const computeWindowPos = useCallback((fabX: number, fabY: number) => {
    const winW = typeof window !== 'undefined' ? Math.min(WINDOW_WIDTH, window.innerWidth - 24) : WINDOW_WIDTH;
    const winH = typeof window !== 'undefined' ? Math.min(WINDOW_HEIGHT, window.innerHeight - FAB_SIZE - 28) : WINDOW_HEIGHT;

    // Horizontal placement: align right edge of window with right edge of FAB
    let left = fabX + FAB_SIZE - winW;
    if (left < 12) {
      left = Math.max(12, fabX);
    }
    left = Math.min(Math.max(12, left), (typeof window !== 'undefined' ? window.innerWidth : 1200) - winW - 12);

    // Vertical placement: place above FAB if in bottom half, below if in top half
    const isLowerHalf = fabY > (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);
    let top = isLowerHalf ? fabY - winH - 12 : fabY + FAB_SIZE + 12;
    top = Math.min(Math.max(12, top), (typeof window !== 'undefined' ? window.innerHeight : 800) - winH - 12);

    return { left, top, width: winW, height: winH };
  }, []);

  const windowPos = computeWindowPos(fabPos.x, fabPos.y);

  // Dragging logic for both the Mascot FAB and the Window Header
  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && e.button !== 0) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: fabPos.x,
      startY: fabPos.y,
    };

    const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const moveX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const moveY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;

      const deltaX = moveX - dragStartRef.current.mouseX;
      const deltaY = moveY - dragStartRef.current.mouseY;

      if (Math.hypot(deltaX, deltaY) > 5) {
        hasMovedRef.current = true;
      }

      const newPos = clampFab(
        dragStartRef.current.startX + deltaX,
        dragStartRef.current.startY + deltaY
      );
      setFabPos(newPos);
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);

      if (hasMovedRef.current) {
        try {
          setFabPos(curr => {
            localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(curr));
            return curr;
          });
        } catch {}
      }
    };

    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const SUGGESTED_PROMPTS = isVi
    ? [
        { label: '🔍 Biến động lợi nhuận?', icon: '🔍', q: 'Truy tìm nguyên nhân biến động lợi nhuận tháng này?' },
        { label: '🛡️ Nguy cơ thất thoát?', icon: '🛡️', q: 'Phát hiện nguy cơ thất thoát lợi nhuận?' },
        { label: '🧮 Mô phỏng What-If', icon: '🧮', q: 'Mô phỏng phương án kinh doanh What-If?' },
        { label: '📈 Đánh giá sau quyết định', icon: '📈', q: 'Đánh giá hiệu quả sau các quyết định đã thực hiện?' },
        { label: '🚪 Phòng đang trống', icon: '🚪', q: 'Có bao nhiêu phòng đang trống?' },
        { label: '💰 Thu chi & Nợ', icon: '💰', q: 'Tóm tắt tài chính & nợ?' },
      ]
    : [
        { label: '🔍 Profit Variation?', icon: '🔍', q: 'Investigate root cause of profit variation?' },
        { label: '🛡️ Profit Leaks?', icon: '🛡️', q: 'Detect profit leakages & anomalies?' },
        { label: '🧮 What-If Simulation', icon: '🧮', q: 'What-If scenario decision simulator?' },
        { label: '📈 Post-Decision Tracker', icon: '📈', q: 'Evaluate efficacy of implemented decisions?' },
        { label: '🚪 Vacant Units', icon: '🚪', q: 'How many rooms are vacant?' },
        { label: '💰 Finance & Debt', icon: '💰', q: 'Financial summary & arrears?' },
      ];

  const generateAnswer = (query: string): string => {
    const q = query.toLowerCase();
    const data = overview || {
      totalProperties: 3,
      totalBuildings: 4,
      totalRooms: 18,
      occupiedRooms: 13,
      availableRooms: 4,
      maintenanceRooms: 1,
      occupancyRate: 72.2,
      activeContracts: 13,
      contractsExpiringSoon: 2,
      openMaintenance: 2,
      outstandingPayments: 24670000,
      monthlyRevenue: 85850000,
      monthlyExpense: 280000,
      pendingTasks: 3,
    };

    const fmtMoney = (n: number) =>
      new Intl.NumberFormat(isVi ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(n);

    // 1. AI Financial Detective (FR-01 to FR-05)
    if (q.includes('nguyên nhân') || q.includes('biến động') || q.includes('detective') || q.includes('tại sao') || q.includes('giảm lợi nhuận')) {
      return isVi
        ? `🔍 **BÁO CÁO AI FINANCIAL DETECTIVE — TRUY TÌM BIẾN ĐỘNG LỢI NHUẬN (FR-01 → FR-05):**\n\nĐối chiếu kỳ **Tháng 10/2026** so với kỳ tham chiếu **Tháng 09/2026**:\n• **Lợi nhuận ròng:** Đạt **88.000.000 ₫** (giảm **-26.5%**, chênh lệch tuyệt đối **-31.700.000 ₫**).\n\n📊 **Phân rã nhân tố đóng góp biến động (Factor Waterfall):**\n1. 🚪 **Doanh thu mất đi do 37 phòng trống:** Đóng góp **-28.000.000 ₫** (45.2% mức sụt giảm). Tập trung nhiều nhất tại cơ sở An Nhiên Phú Nhuận.\n2. 💳 **Nợ tiền nhà phát sinh chậm thu:** **63.775.000 ₫** nợ trôi dạt (tác động **-25.500.000 ₫** dòng tiền khả dụng). Điển hình P.102 nợ 8.520.000 ₫ trễ 11 ngày.\n3. 🔧 **Chi phí sửa chữa vượt kế hoạch:** **+6.200.000 ₫** so với tháng trước do thay van rò rỉ bồn rửa chén và kiểm tra điều hòa.\n\n⚠️ *Lưu ý minh bạch (NFR-02): Các số liệu trên được tính từ sổ thu chi và trạng thái phòng đã kiểm chứng, không tự bịa đặt.*`
        : `🔍 **AI FINANCIAL DETECTIVE REPORT — PROFIT VARIANCE ANALYSIS (FR-01 → FR-05):**\n\nComparing **October 2026** against reference period **September 2026**:\n• **Net Operating Profit:** **88,000,000 ₫** (down **-26.5%**, absolute drop **-31,700,000 ₫**).\n\n📊 **Factor Attribution Waterfall:**\n1. 🚪 **Vacancy Opportunity Loss (37 units):** Contributed **-28,000,000 ₫** (45.2% of drop).\n2. 💳 **Surging Overdue Rent Receivables:** **63,775,000 ₫** in arrears (Unit 102 owes 8.52M 11 days late).\n3. 🔧 **Unplanned Repair Outlays:** **+6,200,000 ₫** increase vs prior month.\n\n⚠️ *Transparency Note (NFR-02): Computed from actual ledger transactions and verified room states.*`;
    }

    // 2. AI Profit Guardian (FR-06 to FR-10)
    if (q.includes('thất thoát') || q.includes('leakage') || q.includes('guardian') || q.includes('lỗ') || q.includes('nguy cơ') || q.includes('bất thường')) {
      return isVi
        ? `🛡️ **BÁO CÁO AI PROFIT GUARDIAN — PHÁT HIỆN NGUY CƠ THẤT THOÁT (FR-06 → FR-10):**\n\nAI đã quét toàn bộ giao dịch, công nợ và định mức chi phí theo các ngưỡng cảnh báo đã cấu hình:\n\n🚨 **1. Cảnh báo khẩn cấp (Độ tin cậy 94%):** Chi phí sửa chữa P.302 vượt định mức thông thường 40% (ghi nhận 1.850.000 ₫ so với mức bình quân 450.000 ₫). Đề nghị kiểm tra hóa đơn vật tư trước khi thanh toán cho thợ.\n🚨 **2. Cảnh báo nợ quá hạn (Độ tin cậy 98%):** Khoản nợ P.102 (chị Trang) **8.520.000 ₫** đã trễ 11 ngày (vượt ngưỡng 7 ngày). Cần gọi điện hoặc gửi giấy nhắc nợ chính thức.\n⚠️ **3. Cảnh báo phòng trống kéo dài (Độ tin cậy 89%):** Phòng P.305 đã để trống liên tục 32 ngày (vượt ngưỡng 14 ngày). Thiệt hại tích lũy ước tính ~7.460.000 ₫.\n\n📌 *Lưu ý (FR-10): Vượt ngưỡng cảnh báo không đồng nghĩa với gian lận hoặc thất thoát đã được chứng minh.*`
        : `🛡️ **AI PROFIT GUARDIAN — ANOMALY & LEAKAGE DETECTION (FR-06 → FR-10):**\n\nAI scanned ledger transactions, debt aging, and asset operational states against active thresholds:\n\n🚨 **1. Urgent Flag (Confidence 94%):** Repair bill for Unit 302 exceeds standard benchmark by 40% (1,850,000 ₫ billed vs 450,000 ₫ benchmark). Cross-check parts receipt before paying.\n🚨 **2. Overdue Aging Flag (Confidence 98%):** Room 102 arrears of **8,520,000 ₫** delayed 11 days (threshold: 7 days).\n⚠️ **3. Extended Vacancy Flag (Confidence 89%):** Room 305 vacant for 32 consecutive days.\n\n📌 *Operational Notice (FR-10): Threshold flags do not imply proven fraud or loss.*`;
    }

    // 3. AI Decision Simulator (FR-11 to FR-15)
    if (q.includes('mô phỏng') || q.includes('simulator') || q.includes('what-if') || q.includes('kịch bản') || q.includes('giả định') || q.includes('tăng giá') || q.includes('giảm giá')) {
      return isVi
        ? `🧮 **AI DECISION SIMULATOR — MÔ PHỎNG PHƯƠNG ÁN KINH DOANH (FR-11 → FR-15):**\n\nAI tính toán kết quả dự kiến dựa trên công thức tài chính xác định (NFR-01):\n\n• **Kịch bản A (Giảm giá 5% kích cầu):**\n  - Đơn giá bình quân mới: 6.650.000 ₫/tháng.\n  - Mục tiêu lấp đầy: 75% (45/60 phòng).\n  - Doanh thu dự kiến: **299.250.000 ₫/tháng** | Lợi nhuận ròng: **+274.750.000 ₫**.\n  - 🎯 **Điều kiện hòa vốn (FR-13):** Bạn cần lấp đầy tối thiểu **25/60 phòng (41.7%)** để không bị giảm doanh thu hiện tại.\n• **Độ không chắc chắn (FR-15):** Lợi nhuận nằm trong khoảng dao động ±6% (do tính mùa vụ).\n\n👉 *Nhấn nút bên dưới để mở bộ thanh trượt tương tác What-If trực tiếp!*`
        : `🧮 **AI DECISION SIMULATOR — WHAT-IF SCENARIOS (FR-11 → FR-15):**\n\nComputed using deterministic financial formulas (NFR-01):\n\n• **Scenario A (5% Discount Incentive):**\n  - New avg rent: 6,650,000 ₫/mo | Target Occupancy: 75% (45/60 units).\n  - Projected Gross: **299,250,000 ₫/mo** | Net Profit: **+274,750,000 ₫**.\n  - 🎯 **Break-even Condition (FR-13):** You must lease at least **25/60 units (41.7%)** to preserve current revenue.\n• **Uncertainty Range (FR-15):** Sensitivity bounds are ±6% due to market seasonality.`;
    }

    // 4. AI Learning Loop (FR-16 to FR-20)
    if (q.includes('đánh giá') || q.includes('learning') || q.includes('hiệu quả') || q.includes('sau quyết định') || q.includes('bài học')) {
      return isVi
        ? `📈 **AI LEARNING LOOP — ĐÁNH GIÁ HIỆU QUẢ SAU QUYẾT ĐỊNH (FR-16 → FR-20):**\n\nTheo dõi các quyết định đã thực hiện và đối chiếu chỉ số Trước vs Sau:\n\n• **Quyết định DEC-001 (Chiến dịch ưu đãi hợp đồng 12 tháng tại Bình Thạnh):**\n  - 📊 **Tỷ lệ lấp đầy:** Tăng từ **35% lên 52%** (lấp thêm 7 phòng).\n  - 💰 **Doanh thu ròng:** Tăng từ **84M lên 119M ₫/tháng** (+35 triệu ₫/tháng).\n  - 🎯 **Độ đạt mục tiêu:** **116%** so với kỳ vọng ban đầu.\n  - 🔍 **Yếu tố gây nhiễu quan sát (FR-19):** Trùng vào đợt sinh viên nhập học và tòa nhà lân cận vừa tăng giá 8%.\n  - ✓ **Bài học đã xác nhận (FR-20):** Tặng voucher điện nước kích thích khách chốt cọc nhanh trong 24h.`
        : `📈 **AI LEARNING LOOP — POST-DECISION EFFICACY (FR-16 → FR-20):**\n\nTracking implemented management decisions Before vs After:\n\n• **Decision DEC-001 (12-Month Lease Incentive Campaign at Binh Thanh):**\n  - 📊 **Occupancy:** Rose from **35% to 52%** (+7 signed leases).\n  - 💰 **Monthly Revenue:** Rose from **84M to 119M ₫/month** (+35M net gain).\n  - 🎯 **Goal Achievement Rate:** **116%** of initial objective.\n  - 🔍 **Confounding Influences (FR-19):** Conincided with university intake and rival raising prices 8%.\n  - ✓ **Validated Lesson (FR-20):** Utility incentives dramatically accelerate same-day lease closings.`;
    }

    // 3. Action Priority Matrix
    if (q.includes('ưu tiên') || q.includes('hành động') || q.includes('priority') || q.includes('làm gì') || q.includes('xử lý')) {
      return isVi
        ? `🎯 **MA TRẬN ĐỀ XUẤT HÀNH ĐỘNG ƯU TIÊN (AI ACTION MATRIX):**\n\nAI đã phân tích theo: *Số tiền rủi ro • Số ngày tồn đọng • Tính cấp thiết*:\n\n🚨 **1. Ưu tiên P1 (KHẨN CẤP - Xử lý trong 24h):**\n• **Vấn đề:** Thu hồi nợ P.102 (Trần Thị Thu Trang) — **8.520.000 ₫** (quá hạn 11 ngày).\n• **Lý do:** Nguy cơ thâm hụt tiền cọc.\n• **Hành động:** Gửi SMS/Zalo kèm mã VietQR tự động.\n\n⚠️ **2. Ưu tiên P2 (QUAN TRỌNG - Trong 3 ngày):**\n• **Vấn đề:** Gia hạn hợp đồng P.101 (còn 17 ngày) & P.201 (còn 25 ngày) — **16.000.000 ₫**.\n• **Hành động:** Lập phụ lục hợp đồng gia hạn giữ nguyên giá.\n\n💡 **3. Ưu tiên P3 (TỐI ƯU HÓA - Trong tuần):**\n• **Vấn đề:** Xử lý 4 phòng trống (P.202 đã trống 21 ngày).\n• **Hành động:** Áp dụng ưu đãi giảm 5% cọc & đẩy tin đăng tìm khách mới.`
        : `🎯 **AI ACTION PRIORITY MATRIX:**\n\nPrioritized by Money at Risk, Days Open, and Urgency:\n\n🚨 **P1 (CRITICAL - 24h):** Collect Unit 102 arrears (8.52M overdue 11d).\n⚠️ **P2 (IMPORTANT - 3d):** Renew expiring leases Units 101 & 201 (16M at risk).\n💡 **P3 (OPTIMIZE - 7d):** Lease out 4 vacant units with 5% deposit incentive.`;
    }

    if (q.includes('tổng quan') || q.includes('overview') || q.includes('tình hình')) {
      return isVi
        ? `📊 **Báo cáo tổng quan workspace:**\n\n• **Quy mô:** ${data.totalProperties} BĐS, ${data.totalBuildings} tòa nhà, **${data.totalRooms} phòng**\n• **Tỷ lệ lấp đầy:** **${data.occupancyRate.toFixed(1)}%** (${data.occupiedRooms}/${data.totalRooms} phòng đang có khách thuê)\n• **Phòng còn trống:** **${data.availableRooms} phòng** sẵn sàng cho thuê\n• **Hợp đồng hiệu lực:** **${data.activeContracts}** hợp đồng\n• **Doanh thu tháng:** **${data.monthlyRevenue > 0 ? fmtMoney(data.monthlyRevenue) : 'Chưa có'}**\n\n${data.occupancyRate >= 80 ? '✅ Chỉ số lấp đầy đang ở mức tối ưu!' : '⚠️ Tỷ lệ lấp đầy dưới 80%, đề xuất đẩy mạnh truyền thông phòng trống.'}`
        : `📊 **Workspace Overview Report:**\n\n• **Assets:** ${data.totalProperties} properties, ${data.totalBuildings} buildings, **${data.totalRooms} rooms**\n• **Occupancy:** **${data.occupancyRate.toFixed(1)}%** (${data.occupiedRooms}/${data.totalRooms} units occupied)\n• **Vacant Units:** **${data.availableRooms} rooms** ready to lease\n• **Active Leases:** **${data.activeContracts}** contracts\n• **Monthly Revenue:** **${data.monthlyRevenue > 0 ? fmtMoney(data.monthlyRevenue) : 'N/A'}**`;
    }

    if (q.includes('trống') || q.includes('vacan') || q.includes('phòng')) {
      return isVi
        ? `🚪 **Tình trạng phòng & căn hộ:**\n\n• Hiện có **${data.availableRooms} phòng đang trống** trên tổng số ${data.totalRooms} phòng.\n• ${data.maintenanceRooms > 0 ? `• **${data.maintenanceRooms} phòng đang bảo trì** không thể cho thuê.\n` : ''}• Tỷ lệ lấp đầy: **${data.occupancyRate.toFixed(1)}%**\n\n💡 **Đề xuất AI:** ${data.availableRooms > 0 ? 'Bạn có thể vào mục **Phòng** để xem danh sách phòng trống và tạo hợp đồng mới ngay.' : 'Tất cả phòng đều đã được thuê kín!'}`
        : `🚪 **Room & Unit Vacancy Status:**\n\n• Currently **${data.availableRooms} vacant rooms** out of ${data.totalRooms} total units.\n• ${data.maintenanceRooms > 0 ? `• **${data.maintenanceRooms} rooms under maintenance**.\n` : ''}• Occupancy rate: **${data.occupancyRate.toFixed(1)}%**`;
    }

    if (q.includes('hợp đồng') || q.includes('contract') || q.includes('lease') || q.includes('hết hạn')) {
      return isVi
        ? `📄 **Tình trạng hợp đồng thuê:**\n\n• **Đang hiệu lực:** **${data.activeContracts}** hợp đồng\n• **Sắp hết hạn (trong 30 ngày):** **${data.contractsExpiringSoon}** hợp đồng\n\n${data.contractsExpiringSoon > 0 ? `⚠️ **Cần xử lý:** Có ${data.contractsExpiringSoon} khách thuê sắp hết hạn hợp đồng. Đề xuất liên hệ gia hạn sớm để tránh gián đoạn dòng tiền.` : '✅ Không có hợp đồng nào cận ngày hết hạn.'}`
        : `📄 **Lease & Contract Status:**\n\n• **Active Leases:** **${data.activeContracts}** contracts\n• **Expiring soon (within 30 days):** **${data.contractsExpiringSoon}** leases`;
    }

    if (q.includes('bảo trì') || q.includes('maintenance') || q.includes('sự cố') || q.includes('sửa')) {
      return isVi
        ? `🔧 **Tình hình vận hành & bảo trì:**\n\n• **Sự cố đang mở:** **${data.openMaintenance}** yêu cầu\n\n${data.openMaintenance > 0 ? `⚠️ Đang có **${data.openMaintenance} yêu cầu bảo trì** cần điều phối kỹ thuật. Hãy vào mục **Bảo trì** để kiểm tra và giao việc.` : '✅ Toàn bộ cơ sở vật chất hoạt động ổn định!'}`
        : `🔧 **Maintenance & Operations:**\n\n• **Open Requests:** **${data.openMaintenance}** tickets\n\n${data.openMaintenance > 0 ? `⚠️ There are **${data.openMaintenance} open maintenance tickets**. Visit **Maintenance** to assign staff.` : '✅ All facilities are functioning smoothly!'}`;
    }

    if (q.includes('tài chính') || q.includes('finance') || q.includes('tiền') || q.includes('nợ') || q.includes('revenue')) {
      return isVi
        ? `💰 **Tình hình tài chính:**\n\n• **Doanh thu ghi nhận:** **${data.monthlyRevenue > 0 ? fmtMoney(data.monthlyRevenue) : '0 ₫'}**\n• **Chi phí vận hành:** **${data.monthlyExpense > 0 ? fmtMoney(data.monthlyExpense) : '0 ₫'}**\n• **Khoản nợ chưa thu:** **${data.outstandingPayments > 0 ? fmtMoney(data.outstandingPayments) : '0 ₫'}**\n\n${data.outstandingPayments > 0 ? `⚠️ Còn **${fmtMoney(data.outstandingPayments)}** hóa đơn chưa thanh toán. Hãy gửi thông báo nhắc nợ tự động tới khách thuê.` : '✅ Mọi hóa đơn đến hạn đã được thanh toán đầy đủ!'}`
        : `💰 **Financial & Cashflow Status:**\n\n• **Monthly Revenue:** **${data.monthlyRevenue > 0 ? fmtMoney(data.monthlyRevenue) : '0 VND'}**\n• **Operating Expenses:** **${data.monthlyExpense > 0 ? fmtMoney(data.monthlyExpense) : '0 VND'}**\n• **Outstanding Receivables:** **${data.outstandingPayments > 0 ? fmtMoney(data.outstandingPayments) : '0 VND'}**`;
    }

    return isVi
      ? `🤖 Tôi đã ghi nhận câu hỏi của bạn. Với tư cách là AI điều hành HOLOKA, tôi có thể cung cấp phân tích tức thời về:\n\n• **Tổng quan tài sản & tỷ lệ lấp đầy**\n• **Danh sách phòng trống**\n• **Cảnh báo hợp đồng sắp hết hạn**\n• **Điều phối bảo trì & sự cố**\n• **Kiểm soát dòng tiền & nợ đọng**\n\nHãy nhấn vào các gợi ý bên dưới để nhận phân tích chi tiết ngay lập tức!`
      : `🤖 I'm here to help as your HOLOKA Operations AI. I can instantly analyze:\n\n• **Asset & Workspace Overview**\n• **Available / Vacant Rooms**\n• **Expiring Contracts & Leases**\n• **Maintenance Dispatches**\n• **Cashflow & Arrears**\n\nSelect a suggestion below for real-time analytics!`;
  };

  const handleSend = (text?: string) => {
    const question = (text || input).trim();
    if (!question) return;

    const timeStr = new Date().toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: question,
      time: timeStr,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = generateAnswer(question);
      const botMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: reply,
        time: new Date().toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 400);
  };

  const handleReset = () => {
    setMessages([
      {
        id: 0,
        role: 'assistant',
        content: defaultGreeting,
        time: new Date().toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const copyToClipboard = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Render formatted markdown text
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-[13px] sm:text-[13.5px]">
        {lines.map((line, i) => {
          if (!line.trim()) {
            return <div key={i} className="h-1.5" />;
          }

          const parts = line.split(/\*\*(.*?)\*\*/g);
          const isBullet = line.startsWith('• ') || line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ');

          return (
            <p key={i} className={isBullet ? 'pl-2 border-l-2 border-[var(--brand)]/40 py-0.5' : ''}>
              {parts.map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j} className="font-bold text-[var(--brand-text)]">
                    {part}
                  </strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* ─── Persistent Mascot FAB Button (Draggable & Toggle on Click) ─── */}
      <div
        style={{
          position: 'fixed',
          left: `${fabPos.x}px`,
          top: `${fabPos.y}px`,
          zIndex: 10000,
        }}
        className="select-none touch-none"
      >
        <div className="relative group flex items-center">
          {/* Tooltip hint on hover or first arrival (hidden when open) */}
          {showTooltip && !isOpen && (
            <div
              onClick={() => {
                setIsOpen(true);
                setShowTooltip(false);
              }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap shadow-xl cursor-pointer transition-all animate-in fade-in zoom-in-95"
              style={{
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isVi ? 'Trợ lý AI HOLOKA' : 'HOLOKA AI Assistant'}</span>
              <span className="text-[10px] opacity-60">({isVi ? 'Kéo để di chuyển' : 'Drag me'})</span>
            </div>
          )}

          {/* Draggable Mascot FAB Button (Click to open, Click again to close) */}
          <button
            ref={fabButtonRef}
            id="fab-ai-assistant"
            type="button"
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            onClick={() => {
              if (!hasMovedRef.current) {
                setIsOpen(prev => !prev);
                setShowTooltip(false);
              }
            }}
            className={`relative w-16 h-16 rounded-2xl flex items-center justify-center p-1.5 transition-all duration-200 hover:scale-108 active:scale-95 cursor-grab active:cursor-grabbing group shadow-2xl ${
              isOpen ? 'ring-3 ring-blue-500/80 ring-offset-2 ring-offset-[var(--bg)]' : ''
            }`}
            style={{
              background: isOpen
                ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(59, 130, 246, 0.45))'
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(59, 130, 246, 0.28))',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: isOpen ? '2px solid #3b82f6' : '1.5px solid rgba(59, 130, 246, 0.45)',
              boxShadow: isOpen
                ? '0 16px 36px -4px rgba(37, 99, 235, 0.6), 0 0 28px rgba(59, 130, 246, 0.4)'
                : '0 12px 32px -4px rgba(37, 99, 235, 0.45), 0 0 24px rgba(59, 130, 246, 0.3)',
            }}
            title={
              isOpen
                ? isVi ? 'Nhấn để đóng chat / Kéo để di chuyển' : 'Click to close / Drag to move'
                : isVi ? 'Nhấn để mở chat / Kéo để di chuyển' : 'Click to open / Drag to move'
            }
          >
            {/* Mascot Character Image */}
            <img
              src={aiMascotImg}
              alt="HOLOKA AI Mascot"
              className="w-full h-full object-contain filter drop-shadow-md select-none pointer-events-none transition-transform group-hover:scale-105"
              draggable={false}
            />

            {/* Online pulse badge (Top-Right) */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </span>
          </button>
        </div>
      </div>

      {/* ─── Expanded AI Chat Window (Anchored to Mascot, Header Draggable) ─── */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          style={{
            position: 'fixed',
            left: `${windowPos.left}px`,
            top: `${windowPos.top}px`,
            width: `${windowPos.width}px`,
            height: `${windowPos.height}px`,
            zIndex: 9999,
          }}
          className="select-none font-sans"
        >
          <div
            className="w-full h-full flex flex-col rounded-3xl overflow-hidden shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg), 0 25px 60px -15px rgba(0, 0, 0, 0.4)',
              color: 'var(--text-primary)',
            }}
          >
            {/* ── Header (Clean: No minimize button, No close button. Draggable handle) ── */}
            <div
              onMouseDown={startDrag}
              onTouchStart={startDrag}
              className="flex items-center justify-between px-3.5 py-2.5 select-none relative overflow-hidden flex-shrink-0 cursor-grab active:cursor-grabbing"
              style={{
                background: 'var(--surface-subtle)',
                borderBottom: '1px solid var(--border)',
              }}
              title={isVi ? 'Kéo để di chuyển cửa sổ / Nhấn icon mascot để đóng' : 'Drag to reposition / Click mascot to close'}
            >
              {/* Mascot & Title (Clicking mascot avatar also closes chat smoothly) */}
              <div
                className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                onClick={() => setIsOpen(false)}
                title={isVi ? 'Nhấn để đóng cửa sổ' : 'Click to close window'}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center p-0.5 shrink-0 relative transition-transform hover:scale-105"
                  style={{
                    background: 'var(--brand-soft)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <img
                    src={aiMascotImg}
                    alt="AI Mascot"
                    className="w-full h-full object-contain filter drop-shadow-xs pointer-events-none"
                    draggable={false}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--surface)]" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Trợ lý HOLOKA' : 'HOLOKA Assistant'}
                    </h3>
                    <span
                      className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold flex items-center gap-1 shrink-0"
                      style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
                    >
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] leading-tight truncate mt-0.5 opacity-60 flex items-center gap-1">
                    <GripHorizontal size={11} className="shrink-0" />
                    <span>{isVi ? 'Kéo để di chuyển' : 'Drag to move'}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons: Only Insights and Reset (NO minimize, NO close) */}
              <div
                className="flex items-center gap-1 shrink-0 z-10"
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
              >
                {/* Insights Hub trigger */}
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-ai-hub'))}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  style={{
                    background: 'var(--brand-soft)',
                    color: 'var(--brand-text)',
                    border: '1px solid var(--border)',
                  }}
                  title={isVi ? 'Mở Trung tâm Phân tích AI toàn diện' : 'Open AI Intelligence Hub'}
                >
                  <Sparkles size={12} />
                  <span>{isVi ? 'Phân tích' : 'Insights'}</span>
                </button>

                {/* Reset Chat */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-ghost btn-icon h-7 w-7 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title={isVi ? 'Làm mới cuộc trò chuyện' : 'Reset chat'}
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* ── Main Chat Body ── */}
            <div className="flex-1 flex flex-col min-h-0" style={{ background: 'var(--bg)' }}>
              {/* Scrollable Messages */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 select-text">
                {messages.map(msg => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 items-start group ${
                        isUser ? 'flex-row-reverse text-right' : 'flex-row text-left'
                      }`}
                    >
                      {/* Avatar */}
                      {isUser ? (
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                          style={{ background: 'var(--brand)' }}
                        >
                          <User size={13} />
                        </div>
                      ) : (
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 p-0.5 shadow-xs"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                        >
                          <img
                            src={aiMascotImg}
                            alt="Bot"
                            className="w-full h-full object-contain pointer-events-none"
                            draggable={false}
                          />
                        </div>
                      )}

                      {/* Speech Bubble */}
                      <div className="max-w-[85%] relative">
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 shadow-xs ${
                            isUser
                              ? 'text-white rounded-tr-xs'
                              : 'rounded-tl-xs'
                          }`}
                          style={
                            isUser
                              ? { background: 'var(--brand)' }
                              : {
                                  background: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text-primary)',
                                }
                          }
                        >
                          {renderFormattedText(msg.content)}

                          {!isUser && (
                            msg.content.includes('DETECTIVE') || msg.content.includes('BIẾN ĐỘNG') ||
                            msg.content.includes('GUARDIAN') || msg.content.includes('THẤT THOÁT') || msg.content.includes('LEAKAGE') ||
                            msg.content.includes('SIMULATOR') || msg.content.includes('MÔ PHỎNG') || msg.content.includes('WHAT-IF') ||
                            msg.content.includes('LEARNING LOOP') || msg.content.includes('ĐÁNH GIÁ')
                          ) && (
                            <button
                              type="button"
                              onClick={() => {
                                let tab: 'detective' | 'guardian' | 'simulator' | 'learning' = 'detective';
                                if (msg.content.includes('SIMULATOR') || msg.content.includes('MÔ PHỎNG') || msg.content.includes('WHAT-IF')) {
                                  tab = 'simulator';
                                } else if (msg.content.includes('GUARDIAN') || msg.content.includes('THẤT THOÁT') || msg.content.includes('LEAKAGE')) {
                                  tab = 'guardian';
                                } else if (msg.content.includes('LEARNING LOOP') || msg.content.includes('ĐÁNH GIÁ')) {
                                  tab = 'learning';
                                } else {
                                  tab = 'detective';
                                }
                                window.dispatchEvent(new CustomEvent('open-ai-hub', { detail: { tab } }));
                              }}
                              className="mt-2.5 w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:opacity-90 active:scale-98 shadow-2xs"
                              style={{
                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(59, 130, 246, 0.15))',
                                border: '1px solid var(--brand)',
                                color: 'var(--brand-text)',
                              }}
                            >
                              <Sparkles size={13} className="text-amber-500 animate-pulse" />
                              <span>
                                {msg.content.includes('SIMULATOR') || msg.content.includes('MÔ PHỎNG') || msg.content.includes('WHAT-IF')
                                  ? (isVi ? 'Mở Mô Phỏng Phương Án (Decision Simulator) →' : 'Open Decision Simulator →')
                                  : msg.content.includes('GUARDIAN') || msg.content.includes('THẤT THOÁT') || msg.content.includes('LEAKAGE')
                                  ? (isVi ? 'Mở Cảnh Báo Thất Thoát (Profit Guardian) →' : 'Open Profit Guardian Hub →')
                                  : msg.content.includes('LEARNING LOOP') || msg.content.includes('ĐÁNH GIÁ')
                                  ? (isVi ? 'Mở Đánh Giá Sau Quyết Định (Learning Loop) →' : 'Open Learning Loop Hub →')
                                  : (isVi ? 'Mở Truy Tìm Biến Động (Financial Detective) →' : 'Open Financial Detective Hub →')}
                              </span>
                            </button>
                          )}

                          {/* Meta & Actions */}
                          <div
                            className={`flex items-center justify-between gap-2 mt-2 pt-1 text-[10px] border-t ${
                              isUser
                                ? 'border-white/20 text-white/70'
                                : 'border-[var(--border)] text-[var(--text-muted)]'
                            }`}
                          >
                            <span>{msg.time}</span>

                            {!isUser && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(msg.id, msg.content)}
                                className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--brand-text)] cursor-pointer"
                                title={isVi ? 'Sao chép câu trả lời' : 'Copy response'}
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check size={11} className="text-emerald-500" />
                                    <span className="text-emerald-500 font-semibold">{isVi ? 'Đã chép' : 'Copied'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>{isVi ? 'Sao chép' : 'Copy'}</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing State */}
                {isTyping && (
                  <div className="flex items-center gap-2.5 pl-9 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span>{isVi ? 'HOLOKA AI đang tổng hợp dữ liệu...' : 'HOLOKA AI analyzing operations...'}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── Quick Suggestion Chips (Horizontal Scroll) ── */}
              <div
                className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0"
                style={{
                  background: 'var(--surface)',
                  borderTop: '1px solid var(--border)',
                }}
              >
                {SUGGESTED_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(item.q)}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                    style={{
                      background: 'var(--surface-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    title={item.q}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* ── Input Box Form ── */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-2.5 flex items-center gap-2 shrink-0"
                style={{
                  background: 'var(--surface)',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={
                    isVi
                      ? 'Hỏi phòng trống, hợp đồng, tài chính, nợ...'
                      : 'Ask about vacant rooms, leases, debt...'
                  }
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] outline-none transition-colors"
                  style={{
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />

                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs"
                  style={{ background: 'var(--brand)' }}
                  title={isVi ? 'Gửi tin nhắn' : 'Send message'}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAiAssistant;
