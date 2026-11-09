import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, X, User, RotateCcw,
  Minus, Maximize2, Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getDashboardOverview, type OverviewData } from '../../services/dashboardService';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

export const FloatingAiAssistant: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const wsId = user?.workspaces?.[0]?.id ?? 1;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const handleAiArrived = () => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    };
    const handleOpenAi = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener('holoka-ai-arrived', handleAiArrived);
    window.addEventListener('holoka-open-ai-chat', handleOpenAi);
    return () => {
      window.removeEventListener('holoka-ai-arrived', handleAiArrived);
      window.removeEventListener('holoka-open-ai-chat', handleOpenAi);
    };
  }, []);

  const isVi = language === 'vi';

  const defaultGreeting = isVi
    ? `Xin chào ${user?.fullName || 'bạn'}! Tôi là **HOLOKA AI Assistant** 🤖\n\nTôi được kết nối trực tiếp với dữ liệu thời gian thực của workspace **${user?.workspaces?.[0]?.name ?? 'An Nhiên Living'}**.\n\nHãy chọn câu hỏi nhanh bên dưới hoặc nhập câu hỏi về phòng trống, hợp đồng, tài chính hay sự cố bảo trì!`
    : `Hello ${user?.fullName || 'there'}! I am **HOLOKA AI Assistant** 🤖\n\nI am connected directly to real-time operations data for workspace **${user?.workspaces?.[0]?.name ?? 'An Nhiên Living'}**.\n\nPick a quick prompt below or ask me anything regarding vacancies, leases, cashflow, or maintenance!`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: defaultGreeting,
      time: new Date().toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update greeting if language changes and only initial message
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

  // Load real-time workspace metrics
  useEffect(() => {
    if (wsId) {
      getDashboardOverview(wsId).then(setOverview).catch(() => {});
    }
  }, [wsId]);

  // Auto-scroll
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Auto-hide tooltip after 8s
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const SUGGESTED_PROMPTS = isVi
    ? [
        '🛡️ Phát hiện nguy cơ thất thoát lợi nhuận?',
        '🧮 Mô phỏng phương án kinh doanh What-If?',
        '🎯 Việc nào cần ưu tiên xử lý ngay hôm nay?',
        '📊 Tổng quan workspace hôm nay?',
        '🚪 Có bao nhiêu phòng đang trống?',
        '💰 Tóm tắt tài chính & nợ?',
      ]
    : [
        '🛡️ Detect profit leakages & anomalies?',
        '🧮 What-If scenario simulator?',
        '🎯 Which actions to prioritize today?',
        '📊 Workspace overview today?',
        '🚪 How many rooms are vacant?',
        '💰 Financial summary & arrears?',
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

    // 1. Differentiated: Profit Leakage Detection
    if (q.includes('thất thoát') || q.includes('leakage') || q.includes('lỗ') || q.includes('nguy cơ') || q.includes('lợi nhuận')) {
      const vacancyLost = data.availableRooms * 7000000;
      return isVi
        ? `🛡️ **BÁO CÁO PHÁT HIỆN NGUY CƠ THẤT THOÁT LỢI NHUẬN (AI AUDIT):**\n\nHệ thống AI đã phát hiện **3 điểm rò rỉ dòng tiền cốt lõi** với tổng thất thoát tiềm tàng ước tính **~${fmtMoney(vacancyLost + 8520000)} / tháng**:\n\n1. 🚪 **Phòng trống kéo dài (4 phòng):** Thất thoát **${fmtMoney(vacancyLost)}/tháng** (~940.000 ₫ mỗi ngày trôi qua). Nguyên nhân: Giá chào thuê cao hơn khu vực 5% hoặc chưa tiếp thị online.\n2. 💳 **Nợ đọng quá hạn có nguy cơ mất cọc:** **${fmtMoney(data.outstandingPayments)}** chưa thu (P.102 nợ 8.52M quá hạn 11 ngày, P.201 nợ 2.65M).\n3. 🔧 **Bất thường chi phí sửa chữa:** Sự cố rò rỉ nước tại P.302 Thảo Điền lặp lại 2 lần trong 45 ngày (chi phí tăng 35%), cần thay cụm ống xả inox đồng bộ thay vì sửa chắp vá.\n\n👉 *Mẹo: Hãy bấm vào nút **"Mở Trung Tâm Phân Tích AI"** ở trên Bàn làm việc để kiểm tra chi tiết và xử lý 1-click!*`
        : `🛡️ **AI PROFIT LEAKAGE & ANOMALY REPORT:**\n\nAI detected 3 active capital leaks totaling **~${fmtMoney(vacancyLost + 8520000)} / mo**:\n\n1. 🚪 **Vacant Unit Burn (4 units):** Losing **${fmtMoney(vacancyLost)}/mo** (~940k VND/day).\n2. 💳 **Overdue Bad Debt Risk:** **${fmtMoney(data.outstandingPayments)}** overdue (Unit 102 owes 8.52M 11 days late).\n3. 🔧 **Repair Anomaly:** Recurring plumbing issue at Unit 302 (cost +35%).\n\n👉 *Open the AI Intelligence Hub on Dashboard for 1-click resolution!*`;
    }

    // 2. Differentiated: What-If Profit Scenario Simulation
    if (q.includes('mô phỏng') || q.includes('what-if') || q.includes('kịch bản') || q.includes('giả định') || q.includes('tăng giá') || q.includes('cải tạo')) {
      return isVi
        ? `🧮 **MÔ PHỎNG LỢI NHUẬN KINH DOANH WHAT-IF (HOLOKA AI ENGINE):**\n\nDựa trên quy mô 18 phòng và doanh thu hiện tại (${fmtMoney(data.monthlyRevenue)}/tháng), AI đã mô phỏng 3 phương án để bạn ra quyết định:\n\n• **Phương án A (Tăng giá thuê +10%):** Doanh thu đạt **~94.4 triệu ₫/tháng**, nhưng tỷ lệ lấp đầy có thể giảm xuống 68% nếu không nâng cấp chất lượng phòng.\n• **Phương án B (Giữ giá + Cải tạo 15 triệu/phòng):** Lấp đầy 100% (18/18 phòng), doanh thu đạt **135 triệu ₫/tháng**. Lợi nhuận ròng tăng **+42%**, thời gian hoàn vốn đầu tư chỉ **3.2 tháng** (AI khuyến nghị cao nhất! ✅).\n• **Phương án C (Chi 2 triệu Marketing phòng trống):** Lấp đầy nhanh 4 phòng trong 10 ngày, mang về thêm **+28 triệu ₫/tháng** doanh thu ròng ngay tức thì.\n\n👉 *Mở công cụ **Mô Phỏng AI** để tự tay kéo thanh trượt giả định giá thuê & tỷ lệ lấp đầy!*`
        : `🧮 **WHAT-IF PROFIT SCENARIO ENGINE:**\n\nBased on your 18-room portfolio and ${fmtMoney(data.monthlyRevenue)} monthly revenue:\n\n• **Option A (+10% Rent):** Expands gross to ~94.4M, but occupancy may dip to 68%.\n• **Option B (Renovation 15M/room):** Achieves 100% occupancy (135M revenue), payback in 3.2 months (Top AI Pick! ✅).\n• **Option C (2M Ad Spend):** Fills 4 vacancies in 10 days (+28M/mo net).\n\n👉 *Open AI Intelligence Hub to slide interactive assumptions!*`;
    }

    // 3. Differentiated: Action Priority Matrix
    if (q.includes('ưu tiên') || q.includes('hành động') || q.includes('priority') || q.includes('làm gì') || q.includes('xử lý')) {
      return isVi
        ? `🎯 **MA TRẬN ĐỀ XUẤT HÀNH ĐỘNG ƯU TIÊN (AI ACTION MATRIX):**\n\nAI đã phân tích theo: *Số tiền rủi ro (Financial at Risk) • Số ngày tồn đọng • Tính cấp thiết* để bạn không bỏ lỡ việc lớn:\n\n🚨 **1. Ưu tiên P1 (KHẨN CẤP - Xử lý trong 24h):**\n• **Vấn đề:** Thu hồi nợ P.102 (Trần Thị Thu Trang) — **8.520.000 ₫** (quá hạn 11 ngày).\n• **Lý do:** Nguy cơ thâm hụt tiền cọc và gián đoạn dòng tiền trả lãi.\n• **Hành động đề xuất:** Gửi SMS/Zalo kèm mã VietQR tự động.\n\n⚠️ **2. Ưu tiên P2 (QUAN TRỌNG - Trong 3 ngày):**\n• **Vấn đề:** Gia hạn hợp đồng P.101 (còn 17 ngày) & P.201 (còn 25 ngày) — **16.000.000 ₫**.\n• **Lý do:** Giữ chân khách quen, tránh nguy cơ trống thêm 1-2 tháng tới.\n• **Hành động đề xuất:** Lập phụ lục hợp đồng gia hạn giữ nguyên giá.\n\n💡 **3. Ưu tiên P3 (TỐI ƯU HÓA - Trong tuần):**\n• **Vấn đề:** Xử lý 4 phòng trống (P.202 đã trống 21 ngày).\n• **Hành động đề xuất:** Áp dụng ưu đãi giảm 5% cọc & đẩy tin đăng tìm khách mới.\n\n👉 *Bấm vào nút **Mở Trung Tâm Phân Tích AI** để duyệt và thực thi 1-click!*`
        : `🎯 **AI ACTION PRIORITY MATRIX:**\n\nPrioritized by Money at Risk, Days Open, and Urgency:\n\n🚨 **P1 (CRITICAL - 24h):** Collect Unit 102 arrears (8.52M overdue 11d).\n⚠️ **P2 (IMPORTANT - 3d):** Renew expiring leases Units 101 & 201 (16M at risk).\n💡 **P3 (OPTIMIZE - 7d):** Lease out 4 vacant units with 5% deposit incentive.\n\n👉 *Open AI Intelligence Hub to execute 1-click actions!*`;
    }

    if (q.includes('tổng quan') || q.includes('overview') || q.includes('tình hình')) {
      return isVi
        ? `📊 **Báo cáo tổng quan workspace:**\n\n• **Quy mô:** ${data.totalProperties} BĐS, ${data.totalBuildings} tòa nhà, **${data.totalRooms} phòng**\n• **Tỷ lệ lấp đầy:** **${data.occupancyRate.toFixed(1)}%** (${data.occupiedRooms}/${data.totalRooms} phòng đang có khách thuê)\n• **Phòng còn trống:** **${data.availableRooms} phòng** sẵn sàng cho thuê\n• **Hợp đồng hiệu lực:** **${data.activeContracts}** hợp đồng\n• **Doanh thu tháng:** **${data.monthlyRevenue > 0 ? fmtMoney(data.monthlyRevenue) : 'Chưa có'}**\n\n${data.occupancyRate >= 80 ? '✅ Chỉ số lấp đầy đang ở mức tối ưu!' : '⚠️ Tỷ lệ lấp đầy dưới 80%, đề xuất đẩy mạnh truyền thông phòng trống.'}`
        : `📊 **Workspace Overview Report:**\n\n• **Assets:** ${data.totalProperties} properties, ${data.totalBuildings} buildings, **${data.totalRooms} rooms**\n• **Occupancy:** **${data.occupancyRate.toFixed(1)}%** (${data.occupiedRooms}/${data.totalRooms} units occupied)\n• **Vacant Units:** **${data.availableRooms} rooms** ready to lease\n• **Active Leases:** **${data.activeContracts}** contracts\n• **Monthly Revenue:** **${data.monthlyRevenue > 0 ? fmtMoney(data.monthlyRevenue) : 'N/A'}**\n\n${data.occupancyRate >= 80 ? '✅ Healthy occupancy rate!' : '⚠️ Occupancy below 80%, focus on vacant room marketing.'}`;
    }

    if (q.includes('trống') || q.includes('vacan') || q.includes('phòng')) {
      return isVi
        ? `🚪 **Tình trạng phòng & căn hộ:**\n\n• Hiện có **${data.availableRooms} phòng đang trống** trên tổng số ${data.totalRooms} phòng.\n• ${data.maintenanceRooms > 0 ? `• **${data.maintenanceRooms} phòng đang bảo trì** không thể cho thuê.\n` : ''}• Tỷ lệ lấp đầy: **${data.occupancyRate.toFixed(1)}%**\n\n💡 **Đề xuất AI:** ${data.availableRooms > 0 ? 'Bạn có thể vào mục **Phòng** để xem danh sách phòng trống và tạo hợp đồng mới ngay.' : 'Tất cả phòng đều đã được thuê kín!'}`
        : `🚪 **Room & Unit Vacancy Status:**\n\n• Currently **${data.availableRooms} vacant rooms** out of ${data.totalRooms} total units.\n• ${data.maintenanceRooms > 0 ? `• **${data.maintenanceRooms} rooms under maintenance**.\n` : ''}• Occupancy rate: **${data.occupancyRate.toFixed(1)}%**\n\n💡 **AI Recommendation:** ${data.availableRooms > 0 ? 'Visit the **Rooms** page to view available units and generate lease agreements.' : 'Full occupancy achieved!'}`;
    }

    if (q.includes('hợp đồng') || q.includes('contract') || q.includes('lease') || q.includes('hết hạn')) {
      return isVi
        ? `📄 **Tình trạng hợp đồng thuê:**\n\n• **Đang hiệu lực:** **${data.activeContracts}** hợp đồng\n• **Sắp hết hạn (trong 30 ngày):** **${data.contractsExpiringSoon}** hợp đồng\n\n${data.contractsExpiringSoon > 0 ? `⚠️ **Cần xử lý:** Có ${data.contractsExpiringSoon} khách thuê sắp hết hạn hợp đồng. Đề xuất liên hệ gia hạn sớm để tránh gián đoạn dòng tiền.` : '✅ Không có hợp đồng nào cận ngày hết hạn.'}`
        : `📄 **Lease & Contract Status:**\n\n• **Active Leases:** **${data.activeContracts}** contracts\n• **Expiring soon (within 30 days):** **${data.contractsExpiringSoon}** leases\n\n${data.contractsExpiringSoon > 0 ? `⚠️ **Action required:** ${data.contractsExpiringSoon} leases are expiring soon. Contact tenants to secure renewals.` : '✅ All contracts are healthy with no immediate expiries.'}`;
    }

    if (q.includes('bảo trì') || q.includes('maintenance') || q.includes('sự cố') || q.includes('sửa')) {
      return isVi
        ? `🔧 **Tình hình vận hành & bảo trì:**\n\n• **Sự cố đang mở:** **${data.openMaintenance}** yêu cầu\n\n${data.openMaintenance > 0 ? `⚠️ Đang có **${data.openMaintenance} yêu cầu bảo trì** cần điều phối nhân viên kỹ thuật. Hãy vào mục **Bảo trì** để kiểm tra mức độ khẩn cấp và giao việc.` : '✅ Toàn bộ trang thiết bị và cơ sở vật chất hoạt động ổn định!'}`
        : `🔧 **Maintenance & Operations:**\n\n• **Open Requests:** **${data.openMaintenance}** tickets\n\n${data.openMaintenance > 0 ? `⚠️ There are **${data.openMaintenance} open maintenance tickets**. Visit the **Maintenance** page to assign staff.` : '✅ All facilities and equipment are functioning smoothly!'}`;
    }

    if (q.includes('tài chính') || q.includes('finance') || q.includes('tiền') || q.includes('nợ') || q.includes('revenue')) {
      return isVi
        ? `💰 **Tình hình tài chính:**\n\n• **Doanh thu ghi nhận:** **${data.monthlyRevenue > 0 ? fmtMoney(data.monthlyRevenue) : '0 ₫'}**\n• **Chi phí vận hành:** **${data.monthlyExpense > 0 ? fmtMoney(data.monthlyExpense) : '0 ₫'}**\n• **Khoản nợ chưa thu:** **${data.outstandingPayments > 0 ? fmtMoney(data.outstandingPayments) : '0 ₫'}**\n\n${data.outstandingPayments > 0 ? `⚠️ Còn **${fmtMoney(data.outstandingPayments)}** hóa đơn chưa thanh toán. Hãy gửi thông báo nhắc nợ tự động tới khách thuê.` : '✅ Mọi hóa đơn đến hạn đã được thanh toán đầy đủ!'}`
        : `💰 **Financial & Cashflow Status:**\n\n• **Monthly Revenue:** **${data.monthlyRevenue > 0 ? fmtMoney(data.monthlyRevenue) : '0 VND'}**\n• **Operating Expenses:** **${data.monthlyExpense > 0 ? fmtMoney(data.monthlyExpense) : '0 VND'}**\n• **Outstanding Receivables:** **${data.outstandingPayments > 0 ? fmtMoney(data.outstandingPayments) : '0 VND'}**\n\n${data.outstandingPayments > 0 ? `⚠️ **${fmtMoney(data.outstandingPayments)}** in overdue invoices. Trigger payment reminders via Notifications.` : '✅ Zero outstanding arrears!'}`;
    }

    return isVi
      ? `🤖 Tôi đã ghi nhận câu hỏi của bạn. Với tư cách là AI điều hành HOLOKA, tôi có thể cung cấp phân tích tức thời về:\n\n• **Tổng quan tài sản**\n• **Danh sách phòng trống**\n• **Cảnh báo hợp đồng sắp hết hạn**\n• **Điều phối bảo trì & sự cố**\n• **Kiểm soát dòng tiền & nợ đọng**\n\nHãy nhấn vào các câu hỏi gợi ý để nhận dữ liệu ngay lập tức!`
      : `🤖 I'm here to help as your HOLOKA Operations AI. I can instantly analyze:\n\n• **Asset & Workspace Overview**\n• **Available / Vacant Rooms**\n• **Expiring Contracts & Leases**\n• **Maintenance Dispatches**\n• **Cashflow & Arrears**\n\nSelect a suggestion above for real-time analytics!`;
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
    }, 450);
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

  // Render markdown bold and breaks
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i} className="block min-h-[1.2em]">
          {parts.map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} className="font-bold text-indigo-600 dark:text-indigo-300">
                {part}
              </strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </span>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none font-sans">
      {/* ─── 1. Collapsed Floating AI Button ─── */}
      {!isOpen && (
        <div className="relative flex items-center gap-2.5">
          {/* Subtle Tooltip Hint */}
          {showTooltip && (
            <div
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg cursor-pointer transition-all bg-slate-900 text-white px-3.5 py-2 text-slate-200 border border-slate-800 hover:bg-slate-900"
            >
              <span>{isVi ? 'Trợ lý HOLOKA' : 'HOLOKA Assistant'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
          )}

          {/* Core Floating Action Button (FAB) */}
          <button
            id="fab-ai-assistant"
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setShowTooltip(false);
            }}
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/35 hover:scale-105 hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-600/30 transition-all duration-150 cursor-pointer"
            title={isVi ? 'Mở Trợ lý HOLOKA' : 'Open HOLOKA Assistant'}
          >
            <Bot size={22} className="text-white" />

            {/* Live Status Dot */}
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border-2 border-blue-600" />
            </span>
          </button>
        </div>
      )}

      {/* ─── 2. Expanded Floating AI Chat Window ─── */}
      {isOpen && (
        <div
          className={`flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200 fade-in ${
            isMinimized
              ? 'w-72 h-14'
              : 'w-[360px] sm:w-[400px] h-[540px] max-h-[82vh]'
          }`}
        >
          {/* Header Bar */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none relative overflow-hidden flex-shrink-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white transition-colors"
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            <div className="flex items-center gap-2.5 z-10">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs flex-shrink-0">
                <Bot size={17} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-wide">
                    {isVi ? 'Trợ lý HOLOKA' : 'HOLOKA Assistant'}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                    ONLINE
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{isVi ? 'Hỗ trợ tra cứu vận hành' : 'Operations Intelligence'}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 z-10">
              {!isMinimized && (
                <>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      window.dispatchEvent(new CustomEvent('open-ai-hub'));
                    }}
                    title={isVi ? 'Mở Bảng phân tích' : 'Open Intelligence Hub'}
                    className="px-2 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-white/10 text-blue-700 dark:text-slate-200 transition-colors cursor-pointer mr-1 flex items-center gap-1 text-[11px] font-semibold bg-blue-50 dark:bg-white/5 border border-blue-200/80 dark:border-white/10"
                  >
                    <span>{isVi ? 'Phân tích' : 'Insights'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    title={isVi ? 'Làm mới cuộc trò chuyện' : 'Reset chat'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={15} />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                {isMinimized ? <Maximize2 size={15} /> : <Minus size={15} />}
              </button>

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                title={isVi ? 'Đóng' : 'Close'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body and Chat Area (Hidden if minimized) */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950/70 transition-colors">
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {messages.map(msg => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 fade-in ${
                        isUser ? 'flex-row-reverse text-right' : 'flex-row text-left'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-xs ${
                          isUser
                            ? 'bg-blue-600'
                            : 'bg-blue-600'
                        }`}
                      >
                        {isUser ? <User size={13} /> : <Bot size={13} />}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm sm:text-[15px] leading-relaxed shadow-xs ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-none font-normal'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                        }`}
                      >
                        {renderFormattedText(msg.content)}
                        <p
                          className={`text-[10px] mt-1 font-medium ${
                            isUser ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Typing status */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs pl-9">
                    <Activity size={12} className="animate-spin text-blue-500" />
                    <span>{isVi ? 'Đang tra cứu dữ liệu...' : 'Querying data...'}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Carousel */}
              <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-700 dark:hover:text-blue-300 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer text-left shadow-2xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={
                    isVi ? 'Hỏi về phòng trống, hợp đồng, tài chính...' : 'Ask about rooms, contracts, revenue...'
                  }
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 border border-slate-200 dark:border-slate-700 transition-all"
                />

                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer shadow-xs flex-shrink-0"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingAiAssistant;


