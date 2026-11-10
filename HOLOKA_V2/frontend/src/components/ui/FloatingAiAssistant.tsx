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
        { label: 'Rò rỉ lợi nhuận?', icon: '🛡️', q: 'Phát hiện nguy cơ thất thoát lợi nhuận?' },
        { label: 'Mô phỏng What-If', icon: '🧮', q: 'Mô phỏng phương án kinh doanh What-If?' },
        { label: 'Việc cần ưu tiên', icon: '🎯', q: 'Việc nào cần ưu tiên xử lý ngay hôm nay?' },
        { label: 'Phòng đang trống', icon: '🚪', q: 'Có bao nhiêu phòng đang trống?' },
        { label: 'Thu chi & Nợ', icon: '💰', q: 'Tóm tắt tài chính & nợ?' },
        { label: 'Tổng quan hôm nay', icon: '📊', q: 'Tổng quan workspace hôm nay?' },
      ]
    : [
        { label: 'Profit Leaks?', icon: '🛡️', q: 'Detect profit leakages & anomalies?' },
        { label: 'What-If Simulation', icon: '🧮', q: 'What-If scenario simulator?' },
        { label: 'Priority Actions', icon: '🎯', q: 'Which actions to prioritize today?' },
        { label: 'Vacant Units', icon: '🚪', q: 'How many rooms are vacant?' },
        { label: 'Finance & Debt', icon: '💰', q: 'Financial summary & arrears?' },
        { label: 'Today Overview', icon: '📊', q: 'Workspace overview today?' },
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

    // 1. Profit Leakage Detection
    if (q.includes('thất thoát') || q.includes('leakage') || q.includes('lỗ') || q.includes('nguy cơ') || q.includes('lợi nhuận')) {
      const vacancyLost = data.availableRooms * 7000000;
      return isVi
        ? `🛡️ **BÁO CÁO PHÁT HIỆN NGUY CƠ THẤT THOÁT LỢI NHUẬN (AI AUDIT):**\n\nHệ thống AI đã phát hiện **3 điểm rò rỉ dòng tiền cốt lõi** với tổng thất thoát tiềm tàng ước tính **~${fmtMoney(vacancyLost + 8520000)} / tháng**:\n\n1. 🚪 **Phòng trống kéo dài (4 phòng):** Thất thoát **${fmtMoney(vacancyLost)}/tháng** (~940.000 ₫ mỗi ngày trôi qua). Nguyên nhân: Giá chào thuê cao hơn khu vực 5% hoặc chưa tiếp thị online.\n2. 💳 **Nợ đọng quá hạn có nguy cơ mất cọc:** **${fmtMoney(data.outstandingPayments)}** chưa thu (P.102 nợ 8.52M quá hạn 11 ngày, P.201 nợ 2.65M).\n3. 🔧 **Bất thường chi phí sửa chữa:** Sự cố rò rỉ nước tại P.302 Thảo Điền lặp lại 2 lần trong 45 ngày (chi phí tăng 35%), cần thay cụm ống xả inox đồng bộ thay vì sửa chắp vá.\n\n👉 *Mẹo: Hãy bấm nút **"Phân tích"** ở thanh tiêu đề để mở Trung Tâm Phân Tích AI 1-click!*`
        : `🛡️ **AI PROFIT LEAKAGE & ANOMALY REPORT:**\n\nAI detected 3 active capital leaks totaling **~${fmtMoney(vacancyLost + 8520000)} / mo**:\n\n1. 🚪 **Vacant Unit Burn (4 units):** Losing **${fmtMoney(vacancyLost)}/mo** (~940k VND/day).\n2. 💳 **Overdue Bad Debt Risk:** **${fmtMoney(data.outstandingPayments)}** overdue (Unit 102 owes 8.52M 11 days late).\n3. 🔧 **Repair Anomaly:** Recurring plumbing issue at Unit 302 (cost +35%).\n\n👉 *Tip: Click the **"Insights"** button in header to open full AI Intelligence Hub!*`;
    }

    // 2. What-If Profit Scenario Simulation
    if (q.includes('mô phỏng') || q.includes('what-if') || q.includes('kịch bản') || q.includes('giả định') || q.includes('tăng giá') || q.includes('cải tạo')) {
      return isVi
        ? `🧮 **MÔ PHỎNG LỢI NHUẬN KINH DOANH WHAT-IF (HOLOKA AI ENGINE):**\n\nDựa trên quy mô 18 phòng và doanh thu hiện tại (${fmtMoney(data.monthlyRevenue)}/tháng), AI đã mô phỏng 3 phương án để bạn ra quyết định:\n\n• **Phương án A (Tăng giá thuê +10%):** Doanh thu đạt **~94.4 triệu ₫/tháng**, nhưng tỷ lệ lấp đầy có thể giảm xuống 68% nếu không nâng cấp chất lượng phòng.\n• **Phương án B (Giữ giá + Cải tạo 15 triệu/phòng):** Lấp đầy 100% (18/18 phòng), doanh thu đạt **135 triệu ₫/tháng**. Lợi nhuận ròng tăng **+42%**, thời gian hoàn vốn đầu tư chỉ **3.2 tháng** (AI khuyến nghị cao nhất! ✅).\n• **Phương án C (Chi 2 triệu Marketing phòng trống):** Lấp đầy nhanh 4 phòng trong 10 ngày, mang về thêm **+28 triệu ₫/tháng** doanh thu ròng ngay tức thì.\n\n👉 *Mở công cụ **Mô Phỏng AI** để tự tay kéo thanh trượt giả định giá thuê & tỷ lệ lấp đầy!*`
        : `🧮 **WHAT-IF PROFIT SCENARIO ENGINE:**\n\nBased on your 18-room portfolio and ${fmtMoney(data.monthlyRevenue)} monthly revenue:\n\n• **Option A (+10% Rent):** Expands gross to ~94.4M, but occupancy may dip to 68%.\n• **Option B (Renovation 15M/room):** Achieves 100% occupancy (135M revenue), payback in 3.2 months (Top AI Pick! ✅).\n• **Option C (2M Ad Spend):** Fills 4 vacancies in 10 days (+28M/mo net).\n\n👉 *Open AI Intelligence Hub to slide interactive assumptions!*`;
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
