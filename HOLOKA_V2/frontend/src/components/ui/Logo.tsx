import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'vertical' | 'icon-only';
  showSubtitle?: boolean;
  className?: string;
  animate?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showSubtitle = true,
  className = '',
  animate = true,
}) => {
  const iconSizes = { sm: 38, md: 48, lg: 60, xl: 76 };
  const textSizes = {
    sm: { title: 'text-lg', sub: 'text-[10px]' },
    md: { title: 'text-2xl', sub: 'text-xs' },
    lg: { title: 'text-3xl', sub: 'text-sm' },
    xl: { title: 'text-4xl', sub: 'text-base' },
  };
  const dim = iconSizes[size];

  return (
    <div
      className={`inline-flex items-center gap-3.5 select-none group ${
        variant === 'vertical' ? 'flex-col text-center' : 'flex-row'
      } ${className}`}
    >
      {/* ══════════════════════════════════════════════════════════
          BIỂU TƯỢNG LOGO MỚI (TÔNG MÀU XANH DƯƠNG CAO CẤP)
          - Hình khối kiến trúc 3D chữ "H" lồng ghép mái nhà & tòa tháp
          - Hiệu ứng sống động: Vầng sáng thở đại dương, luồng laser quét
         ══════════════════════════════════════════════════════════ */}
      <div
        className="relative flex items-center justify-center flex-shrink-0 cursor-pointer"
        style={{ width: dim, height: dim }}
      >
        {/* Vầng hào quang ánh xanh thở nhẹ nhàng */}
        <div
          className={`absolute inset-0 rounded-2xl filter blur-md opacity-50 transition-opacity duration-700 ${
            animate ? 'animate-pulse' : ''
          }`}
          style={{
            background: 'radial-gradient(circle, rgba(37,99,235,0.7) 0%, rgba(14,165,233,0.35) 50%, transparent 75%)',
            transform: 'scale(1.25)',
          }}
        />

        {/* Khung viền vi lượng tinh tế với hiệu ứng xoay chậm */}
        {animate && (
          <div
            className="absolute inset-[-3px] rounded-2xl border border-blue-400/25 pointer-events-none group-hover:border-cyan-400/60 transition-colors duration-500"
            style={{
              animation: 'spin 30s linear infinite',
            }}
          />
        )}

        {/* SVG Biểu Tượng Chữ H Kiến Trúc Xanh Đại Dương */}
        <svg
          viewBox="0 0 100 100"
          width={dim}
          height={dim}
          className={`relative z-10 drop-shadow-[0_4px_16px_rgba(37,99,235,0.45)] transition-transform duration-300 ease-out ${
            animate ? 'group-hover:scale-105' : ''
          }`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradient Cột Trái chữ H */}
            <linearGradient id="hlk_col_left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>

            {/* Gradient Cột Phải chữ H (Tòa tháp trung tâm) */}
            <linearGradient id="hlk_col_right" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            {/* Gradient Cầu Nối Giữa */}
            <linearGradient id="hlk_bridge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>

            {/* Gradient Mái Nhà Góc Nhọn */}
            <linearGradient id="hlk_roof" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            {/* Bộ lọc phát sáng sắc nét */}
            <filter id="hlk_laser" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Nền Khiên Bo Tròn Tinh Tế */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="22"
            fill="#090d16"
            stroke="url(#hlk_col_right)"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />

          {/* Lưới tọa độ kiến trúc chìm */}
          <line x1="20" y1="50" x2="80" y2="50" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <line x1="50" y1="20" x2="50" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

          {/* Cột trái của chữ H (Tòa nhà hướng nghiêng 3D) */}
          <path
            d="M26 36 L40 28 V76 L26 68 Z"
            fill="url(#hlk_col_left)"
          />
          <path
            d="M40 28 L46 32 V80 L40 76 Z"
            fill="url(#hlk_col_right)"
            fillOpacity="0.85"
          />

          {/* Cột phải của chữ H (Tòa tháp trung tâm cao hơn) */}
          <path
            d="M58 24 L72 16 V64 L58 56 Z"
            fill="url(#hlk_col_left)"
          />
          <path
            d="M72 16 L78 20 V68 L72 64 Z"
            fill="url(#hlk_col_right)"
            fillOpacity="0.9"
          />

          {/* Mái nhà kiến trúc giao thoa ở đỉnh */}
          <path
            d="M50 14 L78 20 L58 24 Z"
            fill="url(#hlk_roof)"
            opacity="0.9"
          />

          {/* Cầu nối trung tâm (Sky-bridge liên kết chữ H) */}
          <path
            d="M40 48 L58 42 V50 L40 56 Z"
            fill="url(#hlk_bridge)"
            filter="url(#hlk_laser)"
          />

          {/* Tia sáng động chạy dọc nhịp thở (Laser Energy Pulse) */}
          {animate && (
            <circle cx="49" cy="46" r="2.2" fill="#ffffff" filter="url(#hlk_laser)">
              <animate
                attributeName="cx"
                values="41;57;41"
                dur="2.4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                values="50;44;50"
                dur="2.4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.4;1;0.4"
                dur="2.4s"
                repeatCount="indefinite"
              />
            </circle>
          )}

          {/* Điểm hải đăng AI trên nóc tháp (Smart Beacon) */}
          <circle cx="72" cy="16" r="3" fill="#38bdf8" opacity="0.7">
            <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="72" cy="16" r="2" fill="#ffffff" />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════
          CHỮ THƯƠNG HIỆU HOLOKA - XANH DƯƠNG HIỆN ĐẠI, TIN CẬY
         ══════════════════════════════════════════════════════════ */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col text-left">
          {/* Tên thương hiệu: HOLOKA */}
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black ${textSizes[size].title} tracking-wider text-slate-900 dark:text-white transition-colors`}
              style={{
                fontFamily: "'Outfit', 'Be Vietnam Pro', -apple-system, sans-serif",
                letterSpacing: '0.12em',
              }}
            >
              HOLO
            </span>
            <span
              className={`font-black ${textSizes[size].title} tracking-wider text-blue-600 dark:text-blue-400`}
              style={{
                fontFamily: "'Outfit', 'Be Vietnam Pro', -apple-system, sans-serif",
                letterSpacing: '0.12em',
                textShadow: '0 0 20px rgba(37,99,235,0.4)',
              }}
            >
              KA
            </span>
          </div>

          {/* Phụ đề thương hiệu: Chuẩn SaaS quản lý bất động sản */}
          {showSubtitle && (
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`font-bold ${textSizes[size].sub} uppercase text-slate-500 dark:text-slate-400 tracking-wider`}
                style={{ letterSpacing: '0.14em' }}
              >
                Quản Lý Bất Động Sản
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
