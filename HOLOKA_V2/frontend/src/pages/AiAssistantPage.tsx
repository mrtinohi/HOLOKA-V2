import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MessageSquare, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getDashboardOverview, type OverviewData } from '../services/dashboardService';

const SUGGESTED_VI = [
  'Workspace đang hoạt động như thế nào?',
  'Có bao nhiêu phòng đang trống?',
  'Có hợp đồng nào sắp hết hạn không?',
  'Có bảo trì nào cần xử lý gấp không?',
  'Tóm tắt tình hình tài chính tháng này?',
  'Cần tập trung xử lý vấn đề gì trước?',
];

const SUGGESTED_EN = [
  'How is the workspace performing?',
  'How many units are currently vacant?',
  'Are there any leases expiring soon?',
  'Are there any urgent maintenance requests?',
  'Summarize this month\'s financial performance?',
  'What should I prioritize today?',
];

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

/** Rule-based responder over real workspace metrics — bilingual. */
function generateResponse(input: string, data: OverviewData, isVi: boolean): string {
  const q = input.toLowerCase();
  const money = (n: number) =>
    new Intl.NumberFormat(isVi ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(n);

  if (
    q.includes('tổng quan') || q.includes('hoạt động') || q.includes('như thế nào') ||
    q.includes('tình hình') || q.includes('perform') || q.includes('overview')
  ) {
    if (isVi) {
      return `📊 **Tổng quan workspace hiện tại**

• **Bất động sản:** ${data.totalProperties} cơ sở, ${data.totalBuildings} tòa nhà, ${data.totalRooms} phòng
• **Tỷ lệ lấp đầy:** ${data.occupancyRate.toFixed(1)}% (${data.occupiedRooms}/${data.totalRooms} phòng đang thuê)
• **Phòng trống:** ${data.availableRooms} phòng
• **Hợp đồng hiệu lực:** ${data.activeContracts}
• **Doanh thu tháng này:** ${data.monthlyRevenue > 0 ? money(data.monthlyRevenue) : 'Chưa có dữ liệu'}

${data.occupancyRate < 80
  ? '⚠️ Tỷ lệ lấp đầy đang dưới mức lý tưởng (80%). Nên ưu tiên lấp phòng trống.'
  : '✅ Tỷ lệ lấp đầy đang ở mức tốt.'}`;
    } else {
      return `📊 **Current Workspace Overview**

• **Properties:** ${data.totalProperties} properties, ${data.totalBuildings} buildings, ${data.totalRooms} units
• **Occupancy Rate:** ${data.occupancyRate.toFixed(1)}% (${data.occupiedRooms}/${data.totalRooms} occupied)
• **Vacant Units:** ${data.availableRooms} units
• **Active Contracts:** ${data.activeContracts}
• **Monthly Revenue:** ${data.monthlyRevenue > 0 ? money(data.monthlyRevenue) : 'No invoice data yet'}

${data.occupancyRate < 80
  ? '⚠️ Occupancy is below the 80% target. Prioritize marketing vacant units.'
  : '✅ Occupancy is at a healthy rate.'}`;
    }
  }

  if (q.includes('trống') || q.includes('vacan')) {
    if (isVi) {
      return `🏠 **Tình trạng phòng trống**

Hiện có **${data.availableRooms} phòng đang trống** trên tổng ${data.totalRooms} phòng.
${data.maintenanceRooms > 0 ? `• ${data.maintenanceRooms} phòng đang bảo trì (tạm ngừng cho thuê)\n` : ''}• Tỷ lệ lấp đầy: **${data.occupancyRate.toFixed(1)}%**

${data.availableRooms > 5
  ? '📋 **Đề xuất:** Số phòng trống khá cao. Cân nhắc điều chỉnh giá thuê hoặc tăng cường đăng tin.'
  : '✅ Số phòng trống ở mức chấp nhận được.'}`;
    } else {
      return `🏠 **Vacancy Status**

Currently **${data.availableRooms} units are vacant** out of ${data.totalRooms} total units.
${data.maintenanceRooms > 0 ? `• ${data.maintenanceRooms} units under maintenance\n` : ''}• Occupancy rate: **${data.occupancyRate.toFixed(1)}%**

${data.availableRooms > 5
  ? '📋 **Recommendation:** Vacancy count is high. Consider move-in promotions or re-marketing.'
  : '✅ Vacancy is within standard operating margins.'}`;
    }
  }

  if (q.includes('hợp đồng') || q.includes('hết hạn') || q.includes('lease') || q.includes('contract') || q.includes('expir')) {
    if (isVi) {
      return `📄 **Tình trạng hợp đồng**

• **Đang hiệu lực:** ${data.activeContracts} hợp đồng
• **Sắp hết hạn (≤30 ngày):** ${data.contractsExpiringSoon} hợp đồng

${data.contractsExpiringSoon > 0
  ? `⚠️ Cần liên hệ khách thuê để gia hạn sớm, tránh để phòng trống đột ngột.\n\n📋 Mở trang **Hợp đồng** để xem chi tiết.`
  : '✅ Không có hợp đồng nào sắp hết hạn trong 30 ngày tới.'}`;
    } else {
      return `📄 **Lease Agreements Status**

• **Active:** ${data.activeContracts} leases
• **Expiring Soon (≤30 days):** ${data.contractsExpiringSoon} leases

${data.contractsExpiringSoon > 0
  ? `⚠️ Follow up with tenants for renewals to prevent unexpected vacancies.\n\n📋 Navigate to **Contracts & Leases** for details.`
  : '✅ No leases are expiring within the next 30 days.'}`;
    }
  }

  if (q.includes('bảo trì') || q.includes('sự cố') || q.includes('sửa chữa') || q.includes('maint') || q.includes('repair')) {
    if (isVi) {
      return `🔧 **Tình trạng bảo trì**

• **Yêu cầu đang mở:** ${data.openMaintenance}

${data.openMaintenance === 0
  ? '✅ Không có yêu cầu bảo trì nào đang chờ xử lý.'
  : `⚠️ Có **${data.openMaintenance}** yêu cầu chưa được xử lý.

📋 **Đề xuất:**
1. Phân loại theo mức ưu tiên (Khẩn cấp → Cao → Trung bình → Thấp)
2. Phân công nhân viên phụ trách
3. Cập nhật trạng thái thường xuyên

Mở trang **Bảo trì** để xử lý chi tiết.`}`;
    } else {
      return `🔧 **Maintenance Status**

• **Open Tickets:** ${data.openMaintenance}

${data.openMaintenance === 0
  ? '✅ All facilities are operating normally. No open tickets.'
  : `⚠️ There are **${data.openMaintenance}** open repair tickets pending dispatch.

📋 **Recommendations:**
1. Prioritize Urgent and High severity issues
2. Assign technician or vendor
3. Mark completed once tenant verifies

Visit **Maintenance & Issues** for details.`}`;
    }
  }

  if (q.includes('tài chính') || q.includes('doanh thu') || q.includes('tiền') || q.includes('nợ') || q.includes('financ') || q.includes('revenu') || q.includes('debt')) {
    if (isVi) {
      return `💰 **Tình hình tài chính tháng này**

• **Doanh thu:** ${data.monthlyRevenue > 0 ? money(data.monthlyRevenue) : 'Chưa có hóa đơn tháng này'}
• **Chi phí:** ${data.monthlyExpense > 0 ? money(data.monthlyExpense) : '—'}
• **Công nợ chưa thu:** ${data.outstandingPayments > 0 ? money(data.outstandingPayments) : 'Không có'}

${data.outstandingPayments > 0
  ? `⚠️ Còn **${money(data.outstandingPayments)}** chưa thanh toán. Nên nhắc khách đúng hạn.`
  : '✅ Tất cả khoản thu đã được thanh toán.'}`;
    } else {
      return `💰 **Monthly Financial Health**

• **Revenue:** ${data.monthlyRevenue > 0 ? money(data.monthlyRevenue) : 'No invoices billed this month'}
• **Expenses:** ${data.monthlyExpense > 0 ? money(data.monthlyExpense) : '—'}
• **Overdue Receivables:** ${data.outstandingPayments > 0 ? money(data.outstandingPayments) : 'Zero overdue balance'}

${data.outstandingPayments > 0
  ? `⚠️ Outstanding balance of **${money(data.outstandingPayments)}** requires tenant reminders.`
  : '✅ All billed receivables are settled.'}`;
    }
  }

  if (q.includes('công việc') || q.includes('ưu tiên') || q.includes('xử lý') || q.includes('task') || q.includes('priorit')) {
    const issues: string[] = [];
    if (data.openMaintenance > 0) issues.push(isVi ? `🔴 ${data.openMaintenance} yêu cầu bảo trì cần xử lý` : `🔴 ${data.openMaintenance} open maintenance requests`);
    if (data.outstandingPayments > 0) issues.push(isVi ? '🟡 Còn khoản thu chưa thanh toán' : '🟡 Overdue invoices awaiting collection');
    if (data.contractsExpiringSoon > 0) issues.push(isVi ? `🟡 ${data.contractsExpiringSoon} hợp đồng sắp hết hạn` : `🟡 ${data.contractsExpiringSoon} leases expiring soon`);
    if (data.pendingTasks > 0) issues.push(isVi ? `🔵 ${data.pendingTasks} công việc đang chờ` : `🔵 ${data.pendingTasks} pending tasks`);
    if (data.availableRooms > 3) issues.push(isVi ? `⚪ ${data.availableRooms} phòng đang trống` : `⚪ ${data.availableRooms} vacant units to fill`);

    if (isVi) {
      return `🎯 **Thứ tự ưu tiên xử lý**

${issues.length === 0
  ? '✅ Không có vấn đề nào cần xử lý gấp. Hệ thống đang vận hành tốt.'
  : issues.join('\n')}

${issues.length > 0 ? '\n💡 Xử lý các mục đỏ trước, sau đó đến vàng và xanh.' : ''}`;
    } else {
      return `🎯 **Action Priority Order**

${issues.length === 0
  ? '✅ Operations running smoothly. No critical bottlenecks.'
  : issues.join('\n')}

${issues.length > 0 ? '\n💡 Tackle red items first, then yellow and blue.' : ''}`;
    }
  }

  return isVi
    ? `🤖 Tôi chưa hiểu câu hỏi này.

Tôi có thể hỗ trợ về:
• **Tổng quan vận hành** — "Workspace đang hoạt động như thế nào?"
• **Phòng trống** — "Có bao nhiêu phòng đang trống?"
• **Hợp đồng** — "Có hợp đồng nào sắp hết hạn không?"
• **Bảo trì** — "Có bảo trì nào cần xử lý gấp không?"
• **Tài chính** — "Tình hình tài chính tháng này?"
• **Ưu tiên** — "Cần xử lý vấn đề gì trước?"

Hãy thử một trong các gợi ý bên dưới.`
    : `🤖 I didn't recognize this question.

I can help you with:
• **Operations Overview** — "How is the workspace performing?"
• **Vacancies** — "How many units are currently vacant?"
• **Leases** — "Are there any leases expiring soon?"
• **Maintenance** — "Are there any urgent maintenance requests?"
• **Financials** — "Summarize this month's financial performance?"
• **Priorities** — "What should I prioritize today?"

Try clicking one of the suggested prompts below.`;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';

  const renderContent = (text: string) =>
    text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i} className="block min-h-[1.15em]">
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} className="font-semibold">{part}</strong>
              : <span key={j}>{part}</span>
          )}
        </span>
      );
    });

  return (
    <div className={`flex gap-2.5 fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
        style={{ background: isUser ? 'var(--text-secondary)' : 'var(--brand)' }}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </span>

      <div
        className="max-w-[82%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed"
        style={isUser
          ? { background: 'var(--brand)', color: '#fff', borderBottomRightRadius: 4 }
          : { background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }}
      >
        {renderContent(msg.content)}
        <p className="text-[10px] mt-1.5 opacity-60">{msg.time}</p>
      </div>
    </div>
  );
}

export default function AiAssistantPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const wsId = user!.workspaces[0].id;

  const now = () => new Date().toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  const greeting = isVi
    ? `Xin chào! Tôi là **HOLOKA AI** 👋\n\nTôi phân tích dữ liệu thực tế từ workspace của bạn để trả lời các câu hỏi về vận hành bất động sản.\n\nHãy hỏi tôi bất cứ điều gì về phòng, hợp đồng, tài chính hay bảo trì.`
    : `Hello! I am **HOLOKA AI** 👋\n\nI analyze live data from your workspace to answer questions about property management operations.\n\nAsk me anything regarding rooms, contracts, finance, or maintenance.`;

  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', content: greeting, time: now() },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    getDashboardOverview(wsId)
      .then(ov => { if (active) setOverview(ov); })
      .catch(() => {});
    return () => { active = false; };
  }, [wsId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async (text: string) => {
    if (!text.trim() || thinking) return;

    setMessages(m => [...m, { id: Date.now(), role: 'user', content: text.trim(), time: now() }]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      const resp = overview
        ? generateResponse(text, overview, isVi)
        : (isVi ? 'Đang kết nối dữ liệu máy chủ… vui lòng thử lại sau giây lát.' : 'Connecting to operations data... please try again in a moment.');

      setMessages(m => [
        ...m,
        { id: Date.now(), role: 'assistant', content: resp, time: now() },
      ]);
      setThinking(false);
    }, 450);
  };

  const reset = () => {
    setMessages([{ id: Date.now(), role: 'assistant', content: greeting, time: now() }]);
  };

  const suggestedPrompts = isVi ? SUGGESTED_VI : SUGGESTED_EN;

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] pb-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-200)', color: 'var(--brand-text)' }}
          >
            <Sparkles size={17} />
          </span>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {isVi ? 'Trợ lý ảo HOLOKA AI' : 'HOLOKA AI Operations Assistant'}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isVi ? 'Hỏi đáp tức thì về tình trạng vận hành, số liệu và công việc.' : 'Instant operations insights, metrics lookups, and guidance.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="btn btn-ghost text-xs"
          title={isVi ? 'Làm mới cuộc trò chuyện' : 'Reset conversation'}
        >
          <RefreshCw size={14} />
          <span className="hidden sm:inline">{isVi ? 'Làm mới' : 'Reset'}</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-5 space-y-4">
        {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
        {thinking && (
          <div className="flex items-center gap-2 text-xs italic" style={{ color: 'var(--text-muted)' }}>
            <Bot size={14} className="animate-pulse" />
            <span>{isVi ? 'HOLOKA AI đang phân tích dữ liệu…' : 'HOLOKA AI is analyzing operations data…'}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
        <MessageSquare size={13} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
        {suggestedPrompts.map(prompt => (
          <button
            key={prompt}
            type="button"
            onClick={() => send(prompt)}
            className="rounded-lg px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer flex-shrink-0"
            style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 pt-2"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isVi ? 'Hỏi bất kỳ điều gì về workspace của bạn…' : 'Ask anything about your workspace…'}
          className="input flex-1"
          aria-label={isVi ? 'Nội dung câu hỏi' : 'Question input'}
        />
        <button type="submit" disabled={!input.trim() || thinking} className="btn btn-primary flex-shrink-0">
          <Send size={15} />
          <span className="hidden sm:inline">{isVi ? 'Gửi' : 'Send'}</span>
        </button>
      </form>
    </div>
  );
}
