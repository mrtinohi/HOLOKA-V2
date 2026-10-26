import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, X, Sparkles, User, RotateCcw,
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
        '📊 Tổng quan workspace hôm nay?',
        '🚪 Có bao nhiêu phòng đang trống?',
        '📄 Có hợp đồng nào sắp hết hạn?',
        '🔧 Tình hình sự cố bảo trì?',
        '💰 Tóm tắt tài chính & nợ?',
      ]
    : [
        '📊 Workspace overview today?',
        '🚪 How many rooms are vacant?',
        '📄 Any expiring leases?',
        '🔧 Status of maintenance issues?',
        '💰 Financial summary & arrears?',
      ];

  const generateAnswer = (query: string): string => {
    const q = query.toLowerCase();
    const data = overview || {
      totalProperties: 1,
      totalBuildings: 1,
      totalRooms: 12,
      occupiedRooms: 9,
      availableRooms: 3,
      maintenanceRooms: 0,
      occupancyRate: 75.0,
      activeContracts: 9,
      contractsExpiringSoon: 1,
      openMaintenance: 1,
      outstandingPayments: 5000000,
      monthlyRevenue: 45000000,
      monthlyExpense: 12000000,
      pendingTasks: 2,
    };

    const fmtMoney = (n: number) =>
      new Intl.NumberFormat(isVi ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(n);

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
              <strong key={j} className="font-extrabold text-indigo-900">
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
        <div className="relative flex items-center gap-3">
          {/* Floating Tooltip Hint */}
          {showTooltip && (
            <div
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 text-white text-xs font-semibold shadow-xl border border-white/10 backdrop-blur-md cursor-pointer hover:bg-slate-900 transition-all duration-300 animate-float"
            >
              <Sparkles size={13} className="text-cyan-400" />
              <span>{isVi ? 'Trợ lý HOLOKA AI' : 'HOLOKA AI Assistant'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
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
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-[0_8px_30px_rgba(99,102,241,0.5)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.7)] transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer group"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)',
            }}
            title={isVi ? 'Mở Trợ lý ảo HOLOKA AI' : 'Open HOLOKA AI Assistant'}
          >
            {/* Glowing Ambient Background Ring */}
            <div className="absolute inset-[-4px] rounded-2xl bg-indigo-500 opacity-40 blur-md group-hover:opacity-75 transition-opacity" />

            {/* Rotating Tech Dashed Ring */}
            <div
              className="absolute inset-[-3px] rounded-2xl border border-cyan-300/30 border-dashed pointer-events-none"
              style={{ animation: 'spin-slow 16s linear infinite' }}
            />

            <Bot size={26} className="relative z-10 text-white group-hover:rotate-12 transition-transform" />

            {/* Live Status Beacon */}
            <span className="absolute top-1 right-1 flex h-3 w-3 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-slate-900" />
            </span>
          </button>
        </div>
      )}

      {/* ─── 2. Expanded Floating AI Chat Window ─── */}
      {isOpen && (
        <div
          className={`flex flex-col bg-white rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.25)] border border-slate-200/80 overflow-hidden transition-all duration-300 fade-in ${
            isMinimized
              ? 'w-72 h-14'
              : 'w-[360px] sm:w-[410px] h-[580px] max-h-[85vh]'
          }`}
          style={{ backdropFilter: 'blur(20px)' }}
        >
          {/* Header Bar */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none text-white relative overflow-hidden flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #1e1b4b 100%)',
            }}
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            {/* Ambient corner light */}
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-indigo-500/30 blur-xl pointer-events-none" />

            <div className="flex items-center gap-2.5 z-10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Bot size={17} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white tracking-wide">
                    HOLOKA AI
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                    LIVE
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isVi ? 'Trực tuyến • Bất động sản' : 'Online • Real-time Data'}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 z-10">
              {!isMinimized && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  title={isVi ? 'Làm mới cuộc trò chuyện' : 'Reset chat'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RotateCcw size={15} />
                </button>
              )}

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body and Chat Area (Hidden if minimized) */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/60">
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
                            ? 'bg-gradient-to-br from-indigo-600 to-violet-600'
                            : 'bg-gradient-to-br from-slate-900 to-slate-800'
                        }`}
                      >
                        {isUser ? <User size={13} /> : <Bot size={13} />}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                          isUser
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                        }`}
                      >
                        {renderFormattedText(msg.content)}
                        <p
                          className={`text-[10px] mt-1.5 font-medium ${
                            isUser ? 'text-indigo-200' : 'text-slate-400'
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
                  <div className="flex items-center gap-2 text-slate-400 text-xs pl-9">
                    <Activity size={12} className="animate-spin text-indigo-500" />
                    <span>{isVi ? 'HOLOKA AI đang tính toán...' : 'Analyzing metrics...'}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Carousel */}
              <div className="px-3 py-2 bg-white/80 border-t border-slate-200/60 flex gap-1.5 overflow-x-auto no-scrollbar">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="flex-shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200/60 transition-all duration-150 cursor-pointer text-left"
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
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={
                    isVi ? 'Hỏi về phòng trống, hợp đồng, tài chính...' : 'Ask about rooms, contracts, revenue...'
                  }
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500 transition-all"
                />

                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex-shrink-0"
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
