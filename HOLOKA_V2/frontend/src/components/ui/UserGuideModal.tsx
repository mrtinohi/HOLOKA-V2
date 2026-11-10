import { useState } from 'react';
import {
  BookOpen, Sparkles, X, CheckCircle2,
  Building, FileText, CreditCard, Wrench, BarChart3,
  AlertTriangle, Sliders, MessageSquare, ArrowRight, Lightbulb,
  PhoneCall, ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAiChat?: () => void;
}

type GuideTab = 'start' | 'features' | 'ai' | 'tips';

export default function UserGuideModal({ isOpen, onClose, onOpenAiChat }: UserGuideModalProps) {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [activeTab, setActiveTab] = useState<GuideTab>('start');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm animate-fade-in"
      style={{ background: 'rgba(15, 23, 42, 0.55)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-4xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          color: 'var(--text-primary)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ─── Modal Header ─── */}
        <div
          className="p-5 sm:p-6 flex items-start justify-between gap-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-subtle)' }}
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ background: 'var(--brand)' }}
            >
              <BookOpen size={19} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {isVi ? 'Hướng dẫn sử dụng HOLOKA' : 'HOLOKA Property Management Guide'}
                </h2>
                <span className="badge badge-brand">{isVi ? 'Dễ hiểu' : 'Easy'}</span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {isVi
                  ? 'Dành cho chủ nhà và quản lý phòng trọ: vận hành gọn gàng, tận dụng AI để chống thất thoát.'
                  : 'Complete guide for property owners: streamlined operations and AI profit protection.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon shrink-0" title={isVi ? 'Đóng' : 'Close'} aria-label={isVi ? 'Đóng' : 'Close'}>
            <X size={18} />
          </button>
        </div>

        {/* ─── Navigation Tabs ─── */}
        <div
          className="flex px-4 sm:px-6 gap-1.5 overflow-x-auto shrink-0 py-2.5"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
          role="tablist"
        >
          {([
            { key: 'start' as const,    Icon: CheckCircle2, label: isVi ? '1. Bắt đầu nhanh' : '1. Quick Start' },
            { key: 'features' as const, Icon: Building,     label: isVi ? '2. Chức năng quản lý' : '2. Key Features' },
            { key: 'ai' as const,       Icon: Sparkles,     label: isVi ? '3. Cách dùng Trợ lý AI' : '3. AI Assistant' },
            { key: 'tips' as const,     Icon: Lightbulb,    label: isVi ? '4. Mẹo cho chủ nhà' : '4. Owner Tips' },
          ]).map(({ key, Icon, label }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
                style={active
                  ? { background: 'var(--brand)', color: '#fff' }
                  : { color: 'var(--text-secondary)' }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Modal Scrollable Content ─── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">

          {/* TAB 1: BẮT ĐẦU NHANH (4 BƯỚC) */}
          {activeTab === 'start' && (
            <div className="space-y-6">
              <div
                className="rounded-xl p-4 sm:p-5 flex items-start gap-3.5"
                style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-200)' }}
              >
                <Lightbulb size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--brand-text)' }} />
                <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <p className="font-semibold text-base mb-1" style={{ color: 'var(--brand-text)' }}>
                    {isVi ? 'Quy trình 4 bước đơn giản để quản lý nhà trọ, căn hộ:' : '4 Simple steps to manage your rental property:'}
                  </p>
                  {isVi
                    ? 'HOLOKA được thiết kế theo đúng quy trình thực tế của chủ nhà tại Việt Nam: từ lúc thêm nhà, ký hợp đồng đến chốt tiền điện nước hàng tháng.'
                    : 'HOLOKA aligns with real-world property workflows: from listing rooms to collecting monthly utilities.'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Step 1 */}
                <div className="card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                      1
                    </span>
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Khai báo Tòa nhà & Phòng' : 'Set Up Properties & Rooms'}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {isVi
                      ? 'Vào mục "Bất động sản" ở thanh menu bên trái để tạo tên tòa nhà (ví dụ: Nhà trọ Cầu Giấy), sau đó thêm từng phòng kèm giá thuê chuẩn mỗi tháng.'
                      : 'Navigate to "Properties" on the left menu. Create your buildings, then add rooms with standard monthly rental rates.'}
                  </p>
                </div>

                {/* Step 2 */}
                <div className="card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                      2
                    </span>
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Tạo Hợp đồng & Khách thuê' : 'Add Tenants & Contracts'}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {isVi
                      ? 'Khi có khách vào ở, vào mục "Hợp đồng" để tạo mới. Điền họ tên khách, số điện thoại, ngày bắt đầu và tiền đặt cọc để hệ thống tự động theo dõi thời hạn.'
                      : 'When a new tenant moves in, go to "Contracts" to record tenant details, phone number, lease period, and security deposit.'}
                  </p>
                </div>

                {/* Step 3 */}
                <div className="card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                      3
                    </span>
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Chốt điện nước & Hóa đơn' : 'Issue Monthly Invoices'}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {isVi
                      ? 'Cuối tháng, chỉ cần nhập số điện, số nước mới. Hệ thống sẽ tự trừ số cũ và tạo hóa đơn gồm tiền phòng + điện + nước để gửi cho khách.'
                      : 'At the end of the month, input meter readings. HOLOKA automatically calculates utilities and generates the monthly invoice.'}
                  </p>
                </div>

                {/* Step 4 */}
                <div className="card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                      4
                    </span>
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Thu tiền & Theo dõi nợ' : 'Collect Rent & Track Debt'}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {isVi
                      ? 'Khách chuyển khoản hoặc đưa tiền mặt -> Bấm "Xác nhận đã thanh toán". Khách nào chưa đóng sẽ hiển thị ngay thẻ màu đỏ trên Bảng điều khiển để nhắc nợ.'
                      : 'Once rent is received, mark it paid. Any overdue amounts immediately appear in the alert banner for follow-up.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CÁC CHỨC NĂNG QUẢN LÝ CỤ THỂ */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Feature 1 */}
                <div className="card p-4 flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Building size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Quản lý Bất động sản & Phòng' : 'Properties & Rooms'}
                    </h4>
                    <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {isVi
                        ? 'Xem danh sách toàn bộ phòng, phòng nào có người ở (xanh lá), phòng nào đang trống (xanh dương). Bấm vào từng phòng để xem ai đang ở và giá thuê.'
                        : 'View all room statuses (occupied vs. vacant). Click each room to inspect tenant info and monthly rates.'}
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="card p-4 flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Hợp đồng & Khách thuê' : 'Contracts & Tenants'}
                    </h4>
                    <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {isVi
                        ? 'Lưu số điện thoại, ảnh căn cước công dân. Hệ thống tự động báo trước 30 ngày khi hợp đồng sắp hết hạn để chủ nhà kịp gia hạn hoặc đăng tin.'
                        : 'Stores tenant IDs and lease agreements. Alerts 30 days before lease expiration for renewal or re-listing.'}
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="card p-4 flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Hóa đơn & Tiền phòng' : 'Invoices & Payments'}
                    </h4>
                    <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {isVi
                        ? 'Tự động tính tiền điện nước, dịch vụ rác, wifi. Có thể in hóa đơn hoặc sao chép tin nhắn Zalo gửi trực tiếp cho khách thuê.'
                        : 'Calculates rent + electricity, water, internet, and trash. Supports direct sharing of invoice summaries to messaging apps.'}
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="card p-4 flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Wrench size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Báo hỏng & Sửa chữa' : 'Maintenance Requests'}
                    </h4>
                    <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {isVi
                        ? 'Khi khách báo hỏng điều hòa, bóng đèn, ghi lại tại đây để theo dõi thợ sửa xong chưa và chi phí hết bao nhiêu tiền.'
                        : 'Track repairs, contractor expenses, and status updates until completed.'}
                    </p>
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="card p-4 flex gap-4 md:col-span-2">
                  <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? 'Báo cáo Doanh thu & Lợi nhuận' : 'Revenue & Financial Reports'}
                    </h4>
                    <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {isVi
                        ? 'Xem tổng tiền thu được mỗi tháng, trừ đi chi phí sửa chữa và tiền điện nước để biết chính xác số tiền lời thực tế thu về túi.'
                        : 'Calculates total collected revenue minus maintenance expenses and utility costs to show your true net rental profit.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CÁCH DÙNG TRỢ LÝ AI HOLOKA */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Sparkles size={24} className="text-amber-300" />
                  <h3 className="font-black text-lg sm:text-xl">
                    {isVi ? 'Trợ lý AI HOLOKA giúp gì cho chủ nhà?' : 'How does HOLOKA AI assist landlords?'}
                  </h3>
                </div>
                <p className="text-blue-100 text-sm sm:text-base mt-2 leading-relaxed">
                  {isVi
                    ? 'AI không làm bạn rối mắt mà đóng vai trò như một người "quản gia thông minh": Tự phát hiện chỗ thất thoát tiền bạc và nhắc nhở việc cần làm ngay.'
                    : 'HOLOKA AI acts as your intelligent digital property manager, alerting you to revenue leaks and prioritizing urgent actions.'}
                </p>
              </div>

              <div className="space-y-4">
                {/* AI Feature 1 */}
                <div className="border-2 border-rose-200 rounded-2xl p-5 bg-rose-50/40">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                      <AlertTriangle size={20} />
                    </span>
                    <h4 className="font-bold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? '1. Phát hiện tiền bị thất thoát (Chống mất tiền)' : '1. Profit Leakage Detection'}
                    </h4>
                  </div>
                  <div className="mt-3 text-sm space-y-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <p>
                      <strong>{isVi ? '• Vấn đề:' : '• Problem:'}</strong>{' '}
                      {isVi
                        ? 'Nhiều chủ nhà để phòng trống cả tháng mà không biết mình đang mất bao nhiêu tiền, hoặc khách nợ dai dẳng kéo dài.'
                        : 'Empty rooms for weeks accumulate unnoticed revenue loss, alongside overdue rent payments.'}
                    </p>
                    <p>
                      <strong>{isVi ? '• AI giải quyết:' : '• AI Solution:'}</strong>{' '}
                      {isVi
                        ? 'AI tính ngay số tiền đang bị lãng phí (Ví dụ: 12 triệu phòng trống + 24.7 triệu tiền nợ) và hiển thị nút hành động: Đăng tin tìm khách ngay, hoặc gọi điện nhắc nợ.'
                        : 'Calculates total leaked cash (e.g., 12M VND vacant + 24.7M VND debt) with one-click resolution actions.'}
                    </p>
                  </div>
                </div>

                {/* AI Feature 2 */}
                <div className="border-2 border-blue-200 rounded-2xl p-5 bg-blue-50/40">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                      <Sliders size={20} />
                    </span>
                    <h4 className="font-bold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? '2. Thử tính lời / lỗ khi đổi giá thuê (Không cần tính nhẩm)' : '2. What-If Rent Adjustment Simulator'}
                    </h4>
                  </div>
                  <div className="mt-3 text-sm space-y-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <p>
                      <strong>{isVi ? '• Cách dùng:' : '• How to use:'}</strong>{' '}
                      {isVi
                        ? 'Bấm vào thẻ "Thử tính lời / lỗ", kéo thanh trượt từ -20% đến +20%. AI sẽ tính ngay nếu bạn giảm 200.000đ để khách vào ở ngay thì cả năm bạn vẫn lãi hơn việc để phòng trống 2 tháng!'
                        : 'Adjust the rental slider (-20% to +20%). AI simulates whether a small discount fills vacancy faster and maximizes net annual yield.'}
                    </p>
                  </div>
                </div>

                {/* AI Feature 3 */}
                <div className="border-2 border-emerald-200 rounded-2xl p-5 bg-emerald-50/40">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                      <MessageSquare size={20} />
                    </span>
                    <h4 className="font-bold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                      {isVi ? '3. Trợ lý AI hỏi đáp tức thì (Góc phải dưới màn hình)' : '3. Floating 24/7 AI Chat Assistant'}
                    </h4>
                  </div>
                  <div className="mt-3 text-sm space-y-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <p>
                      <strong>{isVi ? '• Cách dùng:' : '• How to use:'}</strong>{' '}
                      {isVi
                        ? 'Bấm vào nút tròn AI ở góc dưới bên phải màn hình bất cứ lúc nào. Bạn chỉ cần bấm câu hỏi gợi ý như: "Ai đang nợ tiền?", "Tháng này thu được bao nhiêu?", AI sẽ trả lời ngay bằng tiếng Việt rõ ràng!'
                        : 'Click the bottom-right AI avatar anytime. Tap quick prompts such as "Who has overdue rent?" or "Monthly revenue summary" for instant plain Vietnamese answers.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MẸO QUẢN LÝ NHÀ TRỌ CHO CHỦ NHÀ */}
          {activeTab === 'tips' && (
            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck size={22} className="text-blue-600" />
                  <h4 className="font-bold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                    {isVi ? 'Mẹo 1: Chốt tiền phòng vào ngày 1 đến ngày 5 hàng tháng' : 'Tip 1: Settle billing between the 1st and 5th monthly'}
                  </h4>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {isVi
                    ? 'Tạo thói quen chốt số điện nước ngày cuối tháng và gửi hóa đơn đồng loạt ngày mùng 1. Báo trước khách hạn chót đóng là ngày mùng 5 để dòng tiền luôn ổn định.'
                    : 'Collect meter readings on the 30th/31st and send invoices on the 1st. Set a firm deadline of the 5th for smooth cash flow.'}
                </p>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <PhoneCall size={22} className="text-emerald-600" />
                  <h4 className="font-bold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                    {isVi ? 'Mẹo 2: Nhắc nợ sớm, đừng để dồn qua tháng sau' : 'Tip 2: Follow up overdue rent promptly'}
                  </h4>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {isVi
                    ? 'Ngay khi quá hạn 3-5 ngày, hãy dùng nút "Sao chép tin nhắn nhắc nợ" trong HOLOKA gửi cho khách. Nhắc nhở khéo léo và sớm sẽ tránh được trường hợp khách bỏ phòng trốn nợ.'
                    : 'Use the pre-written friendly reminder message template after 3-5 days overdue to prevent large unpaid debts.'}
                </p>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles size={22} className="text-amber-500" />
                  <h4 className="font-bold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                    {isVi ? 'Mẹo 3: Tìm khách trước 30 ngày khi phòng sắp trống' : 'Tip 3: Re-market rooms 30 days prior to contract end'}
                  </h4>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {isVi
                    ? 'Xem danh sách "Hợp đồng sắp hết hạn" trên Bảng điều khiển để hỏi khách có ở tiếp không. Nếu khách chuyển đi, bạn có 30 ngày để đăng tin tìm khách mới, tránh bị trống phòng mất tiền.'
                    : 'Review expiring leases to confirm renewal intent. If departing, you get 30 days buffer to find replacement tenants without vacant downtime.'}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ─── Modal Footer ─── */}
        <div
          className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shrink-0"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-subtle)' }}
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenAiChat) {
                onOpenAiChat();
              } else {
                window.dispatchEvent(new CustomEvent('holoka-open-ai-chat'));
              }
            }}
            className="btn btn-secondary"
          >
            <Sparkles size={16} style={{ color: 'var(--brand-text)' }} />
            <span>{isVi ? 'Thử hỏi Trợ lý AI ngay' : 'Try AI Assistant Now'}</span>
            <ArrowRight size={15} />
          </button>

          <button type="button" onClick={onClose} className="btn btn-primary">
            {isVi ? 'Đã hiểu, đóng hướng dẫn' : 'Got it, Close Guide'}
          </button>
        </div>
      </div>
    </div>
  );
}


