import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardOverview } from '../services/dashboardService';
import type { OverviewData } from '../services/dashboardService';

/* ── Suggested prompts ───────────────────────────────────────────────────── */
const SUGGESTED = [
  'Workspace đang hoạt động như thế nào?',
  'Có bao nhiêu phòng đang trống?',
  'Có hợp đồng nào sắp hết hạn không?',
  'Có bảo trì nào cần xử lý gấp không?',
  'Tóm tắt tình hình tài chính tháng này?',
  'Cần tập trung xử lý vấn đề gì trước?',
];

/* ── Message types ───────────────────────────────────────────────────────── */
interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

/* ── Simple rule-based AI using real data ────────────────────────────────── */
function generateResponse(input: string, data: OverviewData): string {
  const q = input.toLowerCase();
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  // Overall
  if (q.includes('tổng quan') || q.includes('hoạt động') || q.includes('như thế nào') || q.includes('tình hình')) {
    return `📊 **Tổng quan workspace hiện tại:**

• **Bất động sản:** ${data.totalProperties} property, ${data.totalBuildings} tòa nhà, ${data.totalRooms} phòng
• **Tỷ lệ lấp đầy:** ${data.occupancyRate.toFixed(1)}% (${data.occupiedRooms}/${data.totalRooms} phòng đang thuê)
• **Phòng trống:** ${data.availableRooms} phòng
• **Hợp đồng đang hiệu lực:** ${data.activeContracts}
• **Doanh thu tháng này:** ${data.monthlyRevenue > 0 ? fmtCurrency(data.monthlyRevenue) : 'Chưa có dữ liệu'}

${data.occupancyRate < 80 ? `⚠️ Tỷ lệ lấp đầy đang thấp hơn mức lý tưởng (80%). Cần ưu tiên lấp phòng trống.` : `✅ Tỷ lệ lấp đầy tốt!`}`;
  }

  // Vacancy
  if (q.includes('trống') || q.includes('phòng trống') || q.includes('vacancy')) {
    return `🏠 **Tình trạng phòng trống:**

Hiện có **${data.availableRooms} phòng đang trống** trong tổng số ${data.totalRooms} phòng.

${data.maintenanceRooms > 0 ? `• ${data.maintenanceRooms} phòng đang bảo trì (tạm thời không cho thuê)` : ''}
• Tỷ lệ lấp đầy: **${data.occupancyRate.toFixed(1)}%**

${data.availableRooms > 5
  ? '📋 **Đề xuất:** Số phòng trống đang cao. Cân nhắc điều chỉnh giá thuê hoặc tăng cường marketing để thu hút khách thuê mới.'
  : '✅ Số phòng trống ở mức chấp nhận được.'}`;
  }

  // Contracts
  if (q.includes('hợp đồng') || q.includes('hết hạn') || q.includes('contract')) {
    return `📄 **Tình trạng hợp đồng:**

• **Đang hiệu lực:** ${data.activeContracts} hợp đồng
• **Sắp hết hạn (≤30 ngày):** ${data.contractsExpiringSoon} hợp đồng

${data.contractsExpiringSoon > 0
  ? `⚠️ **Hành động cần thiết:** Có ${data.contractsExpiringSoon} hợp đồng sắp hết hạn. Hãy liên hệ khách thuê để gia hạn sớm, tránh để phòng bị trống đột ngột.

📋 **Đề xuất:** Vào trang **Hợp đồng** để xem chi tiết và xử lý.`
  : '✅ Không có hợp đồng nào sắp hết hạn trong 30 ngày tới.'}`;
  }

  // Maintenance
  if (q.includes('bảo trì') || q.includes('maintenance') || q.includes('sửa chữa')) {
    return `🔧 **Tình trạng bảo trì:**

• **Yêu cầu đang mở:** ${data.openMaintenance} yêu cầu

${data.openMaintenance === 0
  ? '✅ Không có yêu cầu bảo trì nào đang chờ xử lý.'
  : `⚠️ Có **${data.openMaintenance}** yêu cầu bảo trì chưa được xử lý.

📋 **Đề xuất:** 
1. Phân loại theo mức độ ưu tiên (URGENT > HIGH > MEDIUM > LOW)
2. Phân công nhân viên phụ trách
3. Cập nhật trạng thái xử lý thường xuyên

Vào trang **Bảo trì** để xem và xử lý chi tiết.`}`;
  }

  // Finance
  if (q.includes('tài chính') || q.includes('doanh thu') || q.includes('tiền') || q.includes('revenue')) {
    return `💰 **Tình hình tài chính tháng này:**

• **Doanh thu:** ${data.monthlyRevenue > 0 ? fmtCurrency(data.monthlyRevenue) : 'Chưa có hóa đơn tháng này'}
• **Chi phí:** ${data.monthlyExpense > 0 ? fmtCurrency(data.monthlyExpense) : '—'}
• **Khoản nợ chưa thu:** ${data.outstandingPayments > 0 ? fmtCurrency(data.outstandingPayments) : 'Không có'}

${data.outstandingPayments > 0
  ? `⚠️ **Có ${fmtCurrency(data.outstandingPayments)} chưa được thanh toán.** Cần theo dõi và nhắc nhở khách thuê thanh toán đúng hạn.`
  : '✅ Tất cả khoản thu đều đã được thanh toán.'}`;
  }

  // Tasks
  if (q.includes('công việc') || q.includes('task') || q.includes('ưu tiên') || q.includes('xử lý')) {
    const issues = [];
    if (data.openMaintenance > 0) issues.push(`🔴 ${data.openMaintenance} yêu cầu bảo trì cần xử lý`);
    if (data.contractsExpiringSoon > 0) issues.push(`🟡 ${data.contractsExpiringSoon} hợp đồng sắp hết hạn`);
    if (data.outstandingPayments > 0) issues.push(`🟡 Còn khoản thu chưa thanh toán`);
    if (data.pendingTasks > 0) issues.push(`🔵 ${data.pendingTasks} task đang chờ xử lý`);
    if (data.availableRooms > 3) issues.push(`⚪ ${data.availableRooms} phòng đang trống`);

    return `🎯 **Thứ tự ưu tiên xử lý:**

${issues.length === 0
  ? '✅ Hiện tại không có vấn đề nào cần xử lý gấp. Hệ thống đang vận hành tốt!'
  : issues.join('\n')
}

${issues.length > 0 ? '\n💡 **Lời khuyên:** Tập trung xử lý các mục màu đỏ trước, sau đó đến vàng và xanh.' : ''}`;
  }

  // Default
  return `🤖 Xin lỗi, tôi chưa hiểu câu hỏi của bạn. 

Tôi có thể giúp bạn về:
• **Tổng quan vận hành** — "Workspace đang hoạt động như thế nào?"
• **Phòng trống** — "Có bao nhiêu phòng đang trống?"
• **Hợp đồng** — "Có hợp đồng nào sắp hết hạn không?"
• **Bảo trì** — "Có bảo trì nào cần xử lý gấp không?"
• **Tài chính** — "Tình hình tài chính tháng này?"
• **Ưu tiên** — "Cần xử lý vấn đề gì trước?"

Hãy thử một trong các câu hỏi gợi ý bên dưới!`;
}

/* ── Message Bubble ──────────────────────────────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';

  // Parse markdown-like bold
  const parseContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
          )}
          {i < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className={`flex gap-3 fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: isUser
            ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
            : 'linear-gradient(135deg,#0f172a,#1e293b)',
        }}
      >
        {isUser ? <User size={15} color="white" /> : <Bot size={15} color="white" />}
      </div>

      {/* Bubble */}
      <div
        className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
        style={isUser
          ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderBottomRightRadius: 4 }
          : { background: '#fff', color: '#374151', border: '1px solid #f1f5f9', borderBottomLeftRadius: 4, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }
        }
      >
        {parseContent(msg.content)}
        <p className="text-xs mt-2 opacity-60">{msg.time}</p>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function AiAssistantPage() {
  const { user } = useAuth();
  const wsId = user!.workspaces[0].id;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: `Xin chào! Tôi là **HOLOKA AI** 👋

Tôi phân tích dữ liệu thực tế từ workspace của bạn để trả lời các câu hỏi về vận hành bất động sản.

Hãy hỏi tôi bất cứ điều gì về tình hình phòng, hợp đồng, tài chính hay bảo trì!`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDashboardOverview(wsId).then(setOverview).catch(() => {});
  }, [wsId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || thinking) return;

    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { id: Date.now(), role: 'user', content: text, time: now };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setThinking(true);

    // Simulate thinking delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

    const response = overview
      ? generateResponse(text, overview)
      : 'Đang tải dữ liệu workspace... Vui lòng thử lại sau giây lát.';

    const botMsg: Message = {
      id: Date.now() + 1,
      role: 'assistant',
      content: response,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(m => [...m, botMsg]);
    setThinking(false);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 56px - 48px)' }}>
      {/* Header */}
      <div className="fade-in flex items-center gap-4 mb-4 flex-shrink-0">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}
        >
          <Bot size={22} color="white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>HOLOKA AI</h1>
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          </div>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Phân tích dữ liệu workspace · Trả lời bằng tiếng Việt
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl p-5 space-y-4 mb-4"
        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
      >
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {thinking && (
          <div className="flex gap-3 fade-in">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
              <Bot size={15} color="white" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
              <div className="flex items-center gap-1.5">
                {[0, 0.2, 0.4].map(d => (
                  <div
                    key={d}
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#94a3b8', animation: 'pulse-soft 1.2s ease infinite', animationDelay: `${d}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="flex gap-2 flex-wrap mb-3 flex-shrink-0">
        {SUGGESTED.slice(0, 4).map(s => (
          <button
            key={s}
            onClick={() => send(s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: '#fff', color: '#475569', border: '1px solid #e2e8f0' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#a5b4fc'; (e.currentTarget as HTMLElement).style.color = '#6366f1'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.color = '#475569'; }}
          >
            <Sparkles size={11} style={{ color: '#a5b4fc' }} />
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-3 p-3 rounded-2xl flex-shrink-0"
        style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}
      >
        <MessageSquare size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
        <input
          className="flex-1 text-sm bg-transparent outline-none"
          style={{ color: '#0f172a' }}
          placeholder="Hỏi bất kỳ điều gì về workspace của bạn…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          disabled={thinking}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || thinking}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          <Send size={15} color="white" />
        </button>
      </div>
    </div>
  );
}
