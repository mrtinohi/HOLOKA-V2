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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* ─── Modal Header ─── */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <BookOpen size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {isVi ? 'Sổ Tay Hướng Dẫn Sử Dụng HOLOKA' : 'HOLOKA Property Management Guide'}
                </h2>
                <span className="bg-blue-100 text-blue-700 font-bold text-xs px-2.5 py-0.5 rounded-full">
                  {isVi ? 'Dễ Hiểu' : 'Easy'}
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                {isVi
                  ? 'Dành riêng cho chủ nhà, quản lý phòng trọ: Quản lý dễ dàng & Tận dụng AI để chống thất thoát tiền bạc.'
                  : 'Complete guide for property owners: Streamlined operations & AI profit protection.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
            title={isVi ? 'Đóng' : 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── Navigation Tabs ─── */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 sm:px-6 gap-2 sm:gap-3 overflow-x-auto shrink-0 py-2.5">
          <button
            onClick={() => setActiveTab('start')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'start'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <CheckCircle2 size={18} />
            <span>{isVi ? '1. Bắt đầu nhanh' : '1. Quick Start'}</span>
          </button>

          <button
            onClick={() => setActiveTab('features')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'features'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Building size={18} />
            <span>{isVi ? '2. Chức năng quản lý' : '2. Key Features'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ai'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Sparkles size={18} />
            <span>{isVi ? '3. Cách dùng Trợ lý AI' : '3. AI Assistant Guide'}</span>
          </button>

          <button
            onClick={() => setActiveTab('tips')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tips'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Lightbulb size={18} />
            <span>{isVi ? '4. Mẹo cho chủ nhà' : '4. Owner Tips'}</span>
          </button>
        </div>

        {/* ─── Modal Scrollable Content ─── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">

          {/* TAB 1: BẮT ĐẦU NHANH (4 BƯỚC) */}
          {activeTab === 'start' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
                <Lightbulb size={24} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-slate-700 text-sm sm:text-base leading-relaxed">
                  <p className="font-bold text-blue-900 text-base sm:text-lg mb-1">
                    {isVi ? 'Quy trình 4 bước đơn giản để quản lý nhà trọ, căn hộ:' : '4 Simple steps to manage your rental property:'}
                  </p>
                  {isVi
                    ? 'HOLOKA được thiết kế theo đúng quy trình thực tế của chủ nhà tại Việt Nam: từ lúc thêm nhà, ký hợp đồng đến chốt tiền điện nước hàng tháng.'
                    : 'HOLOKA aligns with real-world property workflows: from listing rooms to collecting monthly utilities.'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Step 1 */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm hover:border-blue-300 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                      1
                    </span>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      {isVi ? 'Khai báo Tòa nhà & Phòng' : 'Set Up Properties & Rooms'}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    {isVi
                      ? 'Vào mục "Bất động sản" ở thanh menu bên trái để tạo tên tòa nhà (ví dụ: Nhà trọ Cầu Giấy), sau đó thêm từng phòng kèm giá thuê chuẩn mỗi tháng.'
                      : 'Navigate to "Properties" on the left menu. Create your buildings, then add rooms with standard monthly rental rates.'}
                  </p>
                </div>

                {/* Step 2 */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm hover:border-blue-300 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                      2
                    </span>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      {isVi ? 'Tạo Hợp đồng & Khách thuê' : 'Add Tenants & Contracts'}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    {isVi
                      ? 'Khi có khách vào ở, vào mục "Hợp đồng" để tạo mới. Điền họ tên khách, số điện thoại, ngày bắt đầu và tiền đặt cọc để hệ thống tự động theo dõi thời hạn.'
                      : 'When a new tenant moves in, go to "Contracts" to record tenant details, phone number, lease period, and security deposit.'}
                  </p>
                </div>

                {/* Step 3 */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm hover:border-blue-300 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                      3
                    </span>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      {isVi ? 'Chốt điện nước & Hóa đơn' : 'Issue Monthly Invoices'}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    {isVi
                      ? 'Cuối tháng, chỉ cần nhập số điện, số nước mới. Hệ thống sẽ tự trừ số cũ và tạo hóa đơn gồm tiền phòng + điện + nước để gửi cho khách.'
                      : 'At the end of the month, input meter readings. HOLOKA automatically calculates utilities and generates the monthly invoice.'}
                  </p>
                </div>

                {/* Step 4 */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm hover:border-blue-300 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                      4
                    </span>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      {isVi ? 'Thu tiền & Theo dõi nợ' : 'Collect Rent & Track Debt'}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
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
                <div className="border border-slate-200 rounded-2xl p-4.5 bg-slate-50/50 flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Building size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {isVi ? 'Quản lý Bất động sản & Phòng' : 'Properties & Rooms'}
                    </h4>
                    <p className="text-slate-600 text-sm sm:text-base mt-1 leading-relaxed">
                      {isVi
                        ? 'Xem danh sách toàn bộ phòng, phòng nào có người ở (xanh lá), phòng nào đang trống (xanh dương). Bấm vào từng phòng để xem ai đang ở và giá thuê.'
                        : 'View all room statuses (occupied vs. vacant). Click each room to inspect tenant info and monthly rates.'}
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="border border-slate-200 rounded-2xl p-4.5 bg-slate-50/50 flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {isVi ? 'Hợp đồng & Khách thuê' : 'Contracts & Tenants'}
                    </h4>
                    <p className="text-slate-600 text-sm sm:text-base mt-1 leading-relaxed">
                      {isVi
                        ? 'Lưu số điện thoại, ảnh căn cước công dân. Hệ thống tự động báo trước 30 ngày khi hợp đồng sắp hết hạn để chủ nhà kịp gia hạn hoặc đăng tin.'
                        : 'Stores tenant IDs and lease agreements. Alerts 30 days before lease expiration for renewal or re-listing.'}
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="border border-slate-200 rounded-2xl p-4.5 bg-slate-50/50 flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {isVi ? 'Hóa đơn & Tiền phòng' : 'Invoices & Payments'}
                    </h4>
                    <p className="text-slate-600 text-sm sm:text-base mt-1 leading-relaxed">
                      {isVi
                        ? 'Tự động tính tiền điện nước, dịch vụ rác, wifi. Có thể in hóa đơn hoặc sao chép tin nhắn Zalo gửi trực tiếp cho khách thuê.'
                        : 'Calculates rent + electricity, water, internet, and trash. Supports direct sharing of invoice summaries to messaging apps.'}
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="border border-slate-200 rounded-2xl p-4.5 bg-slate-50/50 flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Wrench size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {isVi ? 'Báo hỏng & Sửa chữa' : 'Maintenance Requests'}
                    </h4>
                    <p className="text-slate-600 text-sm sm:text-base mt-1 leading-relaxed">
                      {isVi
                        ? 'Khi khách báo hỏng điều hòa, bóng đèn, ghi lại tại đây để theo dõi thợ sửa xong chưa và chi phí hết bao nhiêu tiền.'
                        : 'Track repairs, contractor expenses, and status updates until completed.'}
                    </p>
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="border border-slate-200 rounded-2xl p-4.5 bg-slate-50/50 flex gap-4 md:col-span-2">
                  <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {isVi ? 'Báo cáo Doanh thu & Lợi nhuận' : 'Revenue & Financial Reports'}
                    </h4>
                    <p className="text-slate-600 text-sm sm:text-base mt-1 leading-relaxed">
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
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-5 shadow-sm">
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
                    <h4 className="font-bold text-slate-900 text-base sm:text-lg">
                      {isVi ? '1. Phát hiện tiền bị thất thoát (Chống mất tiền)' : '1. Profit Leakage Detection'}
                    </h4>
                  </div>
                  <div className="mt-3 text-slate-700 text-sm sm:text-base space-y-2 leading-relaxed">
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
                    <h4 className="font-bold text-slate-900 text-base sm:text-lg">
                      {isVi ? '2. Thử tính lời / lỗ khi đổi giá thuê (Không cần tính nhẩm)' : '2. What-If Rent Adjustment Simulator'}
                    </h4>
                  </div>
                  <div className="mt-3 text-slate-700 text-sm sm:text-base space-y-2 leading-relaxed">
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
                    <h4 className="font-bold text-slate-900 text-base sm:text-lg">
                      {isVi ? '3. Trợ lý AI hỏi đáp tức thì (Góc phải dưới màn hình)' : '3. Floating 24/7 AI Chat Assistant'}
                    </h4>
                  </div>
                  <div className="mt-3 text-slate-700 text-sm sm:text-base space-y-2 leading-relaxed">
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
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck size={22} className="text-blue-600" />
                  <h4 className="font-bold text-slate-900 text-base sm:text-lg">
                    {isVi ? 'Mẹo 1: Chốt tiền phòng vào ngày 1 đến ngày 5 hàng tháng' : 'Tip 1: Settle billing between the 1st and 5th monthly'}
                  </h4>
                </div>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {isVi
                    ? 'Tạo thói quen chốt số điện nước ngày cuối tháng và gửi hóa đơn đồng loạt ngày mùng 1. Báo trước khách hạn chót đóng là ngày mùng 5 để dòng tiền luôn ổn định.'
                    : 'Collect meter readings on the 30th/31st and send invoices on the 1st. Set a firm deadline of the 5th for smooth cash flow.'}
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
                <div className="flex items-center gap-3 mb-2">
                  <PhoneCall size={22} className="text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-base sm:text-lg">
                    {isVi ? 'Mẹo 2: Nhắc nợ sớm, đừng để dồn qua tháng sau' : 'Tip 2: Follow up overdue rent promptly'}
                  </h4>
                </div>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {isVi
                    ? 'Ngay khi quá hạn 3-5 ngày, hãy dùng nút "Sao chép tin nhắn nhắc nợ" trong HOLOKA gửi cho khách. Nhắc nhở khéo léo và sớm sẽ tránh được trường hợp khách bỏ phòng trốn nợ.'
                    : 'Use the pre-written friendly reminder message template after 3-5 days overdue to prevent large unpaid debts.'}
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles size={22} className="text-amber-500" />
                  <h4 className="font-bold text-slate-900 text-base sm:text-lg">
                    {isVi ? 'Mẹo 3: Tìm khách trước 30 ngày khi phòng sắp trống' : 'Tip 3: Re-market rooms 30 days prior to contract end'}
                  </h4>
                </div>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {isVi
                    ? 'Xem danh sách "Hợp đồng sắp hết hạn" trên Bảng điều khiển để hỏi khách có ở tiếp không. Nếu khách chuyển đi, bạn có 30 ngày để đăng tin tìm khách mới, tránh bị trống phòng mất tiền.'
                    : 'Review expiring leases to confirm renewal intent. If departing, you get 30 days buffer to find replacement tenants without vacant downtime.'}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ─── Modal Footer ─── */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              onClose();
              if (onOpenAiChat) {
                onOpenAiChat();
              } else {
                window.dispatchEvent(new CustomEvent('holoka-open-ai-chat'));
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors cursor-pointer"
          >
            <Sparkles size={18} />
            <span>{isVi ? 'Thử hỏi Trợ lý AI ngay' : 'Try AI Assistant Now'}</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-sm sm:text-base text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all cursor-pointer"
          >
            {isVi ? 'Đã hiểu, đóng hướng dẫn' : 'Got it, Close Guide'}
          </button>
        </div>
      </div>
    </div>
  );
}
