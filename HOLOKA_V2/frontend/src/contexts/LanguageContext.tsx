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
    'brand.subtitle': 'Quản lý nhà cho thuê',
    'brand.tagline': 'Hệ thống quản lý nhà cho thuê thông minh',

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
    'layout.workspace': 'Khu vực quản lý',
    'layout.add_new': 'Thêm mới',
    'layout.guide': 'Hướng dẫn sử dụng',
    'layout.guide_short': 'Hướng dẫn',
    'layout.notifications': 'Thông báo',
    'layout.logout': 'Đăng xuất',
    'layout.online_sync': 'Đang đồng bộ',
    'layout.ai_core': 'Trợ lý ảo hỗ trợ',
    'layout.ai_status': 'Sẵn sàng hỗ trợ 24/7',
    'layout.admin_role': 'Chủ nhà / Quản lý',

    // Login Page
    'login.title': 'Đăng nhập hệ thống',
    'login.desc': 'Nhập email và mật khẩu để vào trang quản lý.',
    'login.email_label': 'Email đăng nhập',
    'login.password_label': 'Mật khẩu',
    'login.btn_login': 'Đăng nhập',
    'login.btn_loading': 'Đang kiểm tra...',
    'login.demo_badge': 'Tài khoản Demo (thử ngay)',
    'login.demo_fill': 'Điền tự động',
    'login.security': 'Bảo mật an toàn 100% • Dữ liệu được mã hóa',
    'login.hero_badge': 'HỆ THỐNG QUẢN LÝ NHÀ CHO THUÊ THÔNG MINH',
    'login.hero_title_1': 'Quản lý dễ dàng.',
    'login.hero_title_2': 'Kiểm soát tốt hơn.',
    'login.hero_subtitle': 'Phần mềm giúp chủ nhà và quản lý nhà trọ, căn hộ theo dõi phòng trống, thu tiền, hợp đồng và sự cố bảo trì – tất cả trên một màn hình, mọi lúc mọi nơi.',
    'login.feature_1_title': 'Quản lý nhiều tòa nhà',
    'login.feature_1_desc': 'Theo dõi từng phòng, từng tòa nhà. Biết ngay phòng nào đang trống, ai đang thuê.',
    'login.feature_2_title': 'Cảnh báo tự động',
    'login.feature_2_desc': 'Tự động nhắc nhở khi có phòng trống lâu, hóa đơn chưa thu hoặc hợp đồng sắp hết hạn.',
    'login.metric_1_val': '99.8%',
    'login.metric_1_label': 'Độ chính xác thu tiền',
    'login.metric_2_val': 'Không trùng lặp',
    'login.metric_2_label': 'Phòng cho thuê không bị chồng chéo',
    'login.metric_3_val': '24/7',
    'login.metric_3_label': 'Truy cập mọi lúc mọi nơi',
    'login.system_status': 'Hệ thống HOLOKA: Hoạt động bình thường',

    // Dashboard Page
    'dash.smart_workspace': 'Bảng tổng hợp hôm nay',
    'dash.online_sync': 'Đang cập nhật',
    'dash.greeting_morning': 'Chào buổi sáng',
    'dash.greeting_afternoon': 'Chào buổi chiều',
    'dash.greeting_evening': 'Chào buổi tối',
    'dash.workspace_sub': 'Tổng hợp số liệu phòng, dòng tiền và việc cần làm hôm nay tại',
    'dash.add_property': 'Thêm Bất động sản',
    'dash.stat_properties': 'Tổng bất động sản',
    'dash.stat_occupancy': 'Tỷ lệ lấp đầy',
    'dash.stat_revenue': 'Doanh thu tháng này',
    'dash.stat_maintenance': 'Sự cố chờ xử lý',
    'dash.buildings_suffix': 'tòa nhà',
    'dash.rooms_suffix': 'phòng',
    'dash.occupied_suffix': 'phòng đang có khách',
    'dash.contracts_suffix': 'hợp đồng còn hiệu lực',
    'dash.maintenance_urgent': 'Có sự cố cần xử lý gấp',
    'dash.maintenance_ok': 'Không có sự cố nào',
    'dash.available_rooms': 'Phòng đang trống',
    'dash.available_desc': 'Sẵn sàng đón khách mới',
    'dash.maintenance_rooms': 'Phòng đang sửa chữa',
    'dash.maintenance_desc': 'Tạm dừng cho thuê',
    'dash.unpaid_invoices': 'Tiền chưa thu (nợ)',
    'dash.unpaid_desc': 'Cần liên hệ nhắc nợ khách',
    'dash.expiring_contracts': 'Hợp đồng sắp hết hạn',
    'dash.expiring_desc': 'Cần liên hệ gia hạn (30 ngày)',
    'dash.staff_tasks': 'Việc nhân viên chưa xong',
    'dash.tasks_desc': 'Đang trong tiến trình xử lý',
    'dash.operating_costs': 'Chi phí vận hành',
    'dash.costs_desc': 'Đã ghi nhận trong tháng',
    'dash.attention_title': 'Việc cần làm ngay',
    'dash.all_good_title': 'Mọi thứ đều ổn!',
    'dash.all_good_desc': 'Không có hóa đơn chưa thu, sự cố bảo trì hay hợp đồng cần xử lý gấp.',
    'dash.workspace_footer_desc': 'Hệ thống quản lý nhà cho thuê HOLOKA V2 – cập nhật theo thời gian thực.',
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
    'layout.workspace': 'Management Area',
    'layout.add_new': 'Add New',
    'layout.guide': 'User Guide',
    'layout.guide_short': 'User Guide',
    'layout.notifications': 'Notifications',
    'layout.logout': 'Sign Out',
    'layout.online_sync': 'Realtime Sync',
    'layout.ai_core': 'AI Assistant',
    'layout.ai_status': 'Ready to assist 24/7',
    'layout.admin_role': 'Owner / Manager',

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
