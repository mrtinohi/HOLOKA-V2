import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultVal?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Brand
    'brand.name': 'HOLOKA',
    'brand.subtitle': 'Property Intelligence',
    'brand.tagline': 'Hệ điều hành quản lý bất động sản thế hệ mới',

    // Navigation Categories
    'nav.group_overview': 'Tổng quan',
    'nav.group_assets': 'Quản lý tài sản',
    'nav.group_leases': 'Khách thuê & Hợp đồng',
    'nav.group_finance': 'Tài chính & Thu chi',
    'nav.group_operations': 'Vận hành thông minh',
    'nav.group_intelligence': 'AI & Intelligence',
    'nav.group_reports': 'Báo cáo & Phân tích',

    // Navigation Items
    'nav.dashboard': 'Bàn làm việc',
    'nav.properties': 'Bất động sản',
    'nav.buildings': 'Tòa nhà',
    'nav.rooms': 'Phòng & Căn hộ',
    'nav.tenants': 'Khách thuê',
    'nav.contracts': 'Hợp đồng',
    'nav.finance': 'Hóa đơn & Dòng tiền',
    'nav.maintenance': 'Bảo trì & Sự cố',
    'nav.tasks': 'Công việc nhân viên',
    'nav.notifications': 'Thông báo & Cảnh báo',
    'nav.intelligence': 'Phân tích dự báo',
    'nav.ai': 'Trợ lý ảo HOLOKA AI',
    'nav.reports': 'Báo cáo tổng hợp',
    'nav.settings': 'Cài đặt tài khoản',

    // Main Layout & Header
    'layout.workspace': 'Không gian làm việc',
    'layout.add_new': 'Thêm mới',
    'layout.notifications': 'Thông báo',
    'layout.logout': 'Đăng xuất',
    'layout.online_sync': 'Đồng bộ trực tuyến',
    'layout.ai_core': 'AI Core Engine',
    'layout.ai_status': 'Sẵn sàng vận hành 24/7',
    'layout.admin_role': 'Quản Trị Viên',

    // Login Page
    'login.title': 'Đăng nhập quản trị',
    'login.desc': 'Nhập thông tin xác thực để truy cập bảng điều khiển vận hành.',
    'login.email_label': 'Email quản trị',
    'login.password_label': 'Mật khẩu',
    'login.btn_login': 'Đăng nhập Bàn làm việc',
    'login.btn_loading': 'Đang xác thực hệ thống...',
    'login.demo_badge': 'Tài khoản Demo có sẵn',
    'login.demo_fill': 'Điền nhanh',
    'login.security': 'Bảo mật JWT Stateless • Chuẩn doanh nghiệp B2B',
    'login.hero_badge': 'NỀN TẢNG QUẢN LÝ BẤT ĐỘNG SẢN B2B THẾ HỆ MỚI',
    'login.hero_title_1': 'Vận hành thông minh.',
    'login.hero_title_2': 'Kiểm soát tuyệt đối.',
    'login.hero_subtitle': 'Hệ thống chuyển đổi toàn bộ quy trình quản lý thủ công sang kiến trúc tự động hóa: từ kiểm soát phòng trống, hợp đồng điện tử, tự động thu tiền đến giám sát bảo trì tức thời.',
    'login.feature_1_title': 'Cấu Trúc Đa Tầng',
    'login.feature_1_desc': 'Quản lý phân cấp Bất động sản → Tòa nhà → Phòng với chỉ số lấp đầy thời gian thực.',
    'login.feature_2_title': 'Cảnh Báo Thông Minh',
    'login.feature_2_desc': 'Smart Alert Engine phát hiện phòng trống kéo dài, hóa đơn trễ hạn và hợp đồng sắp hết.',
    'login.metric_1_val': '99.8%',
    'login.metric_1_label': 'Tỷ lệ chính xác thanh toán',
    'login.metric_2_val': '0 Trùng lặp',
    'login.metric_2_label': 'Khóa thời gian thuê nghiêm ngặt',
    'login.metric_3_val': '24/7',
    'login.metric_3_label': 'Sẵn sàng vận hành tự động',
    'login.system_status': 'Hệ thống HOLOKA Core: Sẵn sàng',

    // Dashboard Page
    'dash.smart_workspace': 'Bàn làm việc thông minh',
    'dash.online_sync': 'Đồng bộ trực tuyến',
    'dash.greeting_morning': 'Chào buổi sáng',
    'dash.greeting_afternoon': 'Chào buổi chiều',
    'dash.greeting_evening': 'Chào buổi tối',
    'dash.workspace_sub': 'Tổng quan tài sản, dòng tiền và nhiệm vụ vận hành hôm nay tại',
    'dash.add_property': 'Thêm Bất động sản',
    'dash.stat_properties': 'Bất động sản',
    'dash.stat_occupancy': 'Tỷ lệ lấp đầy',
    'dash.stat_revenue': 'Doanh thu tháng',
    'dash.stat_maintenance': 'Yêu cầu bảo trì',
    'dash.buildings_suffix': 'tòa nhà',
    'dash.rooms_suffix': 'phòng',
    'dash.occupied_suffix': 'phòng đang thuê',
    'dash.contracts_suffix': 'hợp đồng đang hiệu lực',
    'dash.maintenance_urgent': 'Có sự cố cần điều phối',
    'dash.maintenance_ok': 'Toàn bộ thiết bị ổn định',
    'dash.available_rooms': 'Phòng đang trống',
    'dash.available_desc': 'Sẵn sàng đón khách mới',
    'dash.maintenance_rooms': 'Phòng đang bảo trì',
    'dash.maintenance_desc': 'Tạm dừng cho thuê',
    'dash.unpaid_invoices': 'Hóa đơn chưa thu',
    'dash.unpaid_desc': 'Cần gửi nhắc nợ khách',
    'dash.expiring_contracts': 'HĐ sắp hết hạn (30d)',
    'dash.expiring_desc': 'Cần liên hệ gia hạn',
    'dash.staff_tasks': 'Công việc nhân viên',
    'dash.tasks_desc': 'Đang trong tiến trình',
    'dash.operating_costs': 'Chi phí vận hành',
    'dash.costs_desc': 'Ghi nhận trong tháng',
    'dash.attention_title': 'Mục cần chú ý',
    'dash.all_good_title': 'Hệ thống hoàn hảo!',
    'dash.all_good_desc': 'Không có hóa đơn quá hạn, sự cố bảo trì hay hợp đồng cần xử lý gấp.',
    'dash.workspace_footer_desc': 'Hệ thống quản trị tài sản và điều phối vận hành tích hợp HOLOKA V2.',
  },
  en: {
    // Brand
    'brand.name': 'HOLOKA',
    'brand.subtitle': 'Property Intelligence',
    'brand.tagline': 'Next-Gen Property Operations OS',

    // Navigation Categories
    'nav.group_overview': 'Overview',
    'nav.group_assets': 'Asset Management',
    'nav.group_leases': 'Tenants & Leases',
    'nav.group_finance': 'Finance & Cashflow',
    'nav.group_operations': 'Smart Operations',
    'nav.group_intelligence': 'AI & Intelligence',
    'nav.group_reports': 'Reports & Analytics',

    // Navigation Items
    'nav.dashboard': 'Dashboard',
    'nav.properties': 'Properties',
    'nav.buildings': 'Buildings',
    'nav.rooms': 'Rooms & Units',
    'nav.tenants': 'Tenants',
    'nav.contracts': 'Contracts & Leases',
    'nav.finance': 'Invoices & Payments',
    'nav.maintenance': 'Maintenance & Issues',
    'nav.tasks': 'Staff Tasks',
    'nav.notifications': 'Notifications & Alerts',
    'nav.intelligence': 'Predictive Intelligence',
    'nav.ai': 'HOLOKA AI Assistant',
    'nav.reports': 'Summary Reports',
    'nav.settings': 'Account Settings',

    // Main Layout & Header
    'layout.workspace': 'Workspace',
    'layout.add_new': 'Add New',
    'layout.notifications': 'Notifications',
    'layout.logout': 'Sign Out',
    'layout.online_sync': 'Realtime Sync',
    'layout.ai_core': 'AI Core Engine',
    'layout.ai_status': 'Operational 24/7',
    'layout.admin_role': 'Administrator',

    // Login Page
    'login.title': 'Admin Sign In',
    'login.desc': 'Enter your credentials to access the property operations dashboard.',
    'login.email_label': 'Admin Email',
    'login.password_label': 'Password',
    'login.btn_login': 'Sign in to Dashboard',
    'login.btn_loading': 'Authenticating...',
    'login.demo_badge': 'Pre-configured Demo Account',
    'login.demo_fill': 'Quick Fill',
    'login.security': 'Stateless Nimbus JWT • Enterprise B2B Grade',
    'login.hero_badge': 'NEXT-GEN B2B PROPERTY OPERATIONS PLATFORM',
    'login.hero_title_1': 'Smart Operations.',
    'login.hero_title_2': 'Absolute Control.',
    'login.hero_subtitle': 'Transform legacy manual workflows into an integrated smart OS: from vacancy detection, digital contracts, and automated billing to real-time maintenance dispatch.',
    'login.feature_1_title': 'Multi-Tier Hierarchy',
    'login.feature_1_desc': 'Organize Properties → Buildings → Rooms with real-time occupancy and rent analytics.',
    'login.feature_2_title': 'Smart Alert Engine',
    'login.feature_2_desc': 'Autonomous background engine detecting prolonged vacancies, overdue invoices, and expiring leases.',
    'login.metric_1_val': '99.8%',
    'login.metric_1_label': 'Billing Accuracy Rate',
    'login.metric_2_val': '0 Overlaps',
    'login.metric_2_label': 'Strict Leasetime Boundary Locks',
    'login.metric_3_val': '24/7',
    'login.metric_3_label': 'Autonomous Automation Ready',
    'login.system_status': 'HOLOKA Core Engine: Ready',

    // Dashboard Page
    'dash.smart_workspace': 'Smart Operations Workspace',
    'dash.online_sync': 'Online Realtime Sync',
    'dash.greeting_morning': 'Good morning',
    'dash.greeting_afternoon': 'Good afternoon',
    'dash.greeting_evening': 'Good evening',
    'dash.workspace_sub': 'Real-time overview of assets, cashflow, and active operational tasks at',
    'dash.add_property': 'Add Property',
    'dash.stat_properties': 'Properties',
    'dash.stat_occupancy': 'Occupancy Rate',
    'dash.stat_revenue': 'Monthly Revenue',
    'dash.stat_maintenance': 'Maintenance Requests',
    'dash.buildings_suffix': 'buildings',
    'dash.rooms_suffix': 'rooms',
    'dash.occupied_suffix': 'occupied units',
    'dash.contracts_suffix': 'active leases',
    'dash.maintenance_urgent': 'Incidents require dispatch',
    'dash.maintenance_ok': 'All equipment operational',
    'dash.available_rooms': 'Vacant Rooms',
    'dash.available_desc': 'Ready for new tenants',
    'dash.maintenance_rooms': 'Under Maintenance',
    'dash.maintenance_desc': 'Temporarily off market',
    'dash.unpaid_invoices': 'Unpaid Invoices',
    'dash.unpaid_desc': 'Payment reminder required',
    'dash.expiring_contracts': 'Expiring Leases (30d)',
    'dash.expiring_desc': 'Contact for lease renewal',
    'dash.staff_tasks': 'Staff Tasks',
    'dash.tasks_desc': 'Currently in progress',
    'dash.operating_costs': 'Operating Expenses',
    'dash.costs_desc': 'Recorded this month',
    'dash.attention_title': 'Action Needed Today',
    'dash.all_good_title': 'All Systems Operational!',
    'dash.all_good_desc': 'No overdue invoices, open maintenance emergencies, or critical expiring contracts.',
    'dash.workspace_footer_desc': 'Unified Property Operations and Asset Intelligence System HOLOKA V2.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('holoka_lang') as Language;
    return saved === 'en' || saved === 'vi' ? saved : 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('holoka_lang', lang);
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, defaultVal?: string): string => {
    return translations[language]?.[key] ?? defaultVal ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
