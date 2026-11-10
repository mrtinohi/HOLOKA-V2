import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'vertical' | 'icon-only';
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
  animate?: boolean;
}

const MARK_SIZES = { sm: 30, md: 36, lg: 44, xl: 52 } as const;
const TEXT_SIZES = {
  sm: { title: 'text-base', sub: 'text-[9px]' },
  md: { title: 'text-lg',   sub: 'text-[10px]' },
  lg: { title: 'text-xl',   sub: 'text-[11px]' },
  xl: { title: 'text-2xl',  sub: 'text-xs' },
} as const;

/**
 * HOLOKA wordmark. The mark is an architectural "H" built from two towers
 * with a sky-bridge, drawn on a rounded tile so it reads cleanly at any size.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showSubtitle = true,
  subtitle,
  className = '',
  animate = true,
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const dim = MARK_SIZES[size];
  const text = TEXT_SIZES[size];

  const subText = subtitle ?? (isVi ? 'Quản lý bất động sản' : 'Property Management');

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${
        variant === 'vertical' ? 'flex-col text-center' : 'flex-row'
      } ${className}`}
    >
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: dim, height: dim }}
      >
        <svg
          viewBox="0 0 48 48"
          width={dim}
          height={dim}
          role="img"
          aria-label="HOLOKA"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hlk-mark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>

          <rect width="48" height="48" rx="13" fill="url(#hlk-mark)" />

          {/* Two towers forming an H, joined by a sky-bridge */}
          <path d="M14 13h5v22h-5z" fill="#ffffff" fillOpacity="0.95" />
          <path d="M29 13h5v22h-5z" fill="#ffffff" fillOpacity="0.95" />
          <path d="M19 21.5h10v5H19z" fill="#ffffff" fillOpacity="0.7" />

          {/* Roof accent */}
          <path d="M14 13l10-5 10 5z" fill="#bfdbfe" fillOpacity="0.9" />

          {animate && (
            <circle cx="31.5" cy="13" r="1.6" fill="#bfdbfe">
              <animate attributeName="opacity" values="1;0.25;1" dur="2.6s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>
      </div>

      {variant !== 'icon-only' && (
        <div className="flex flex-col text-left leading-none">
          <span
            className={`font-extrabold ${text.title}`}
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              letterSpacing: '0.02em',
            }}
          >
            HOLOKA
          </span>
          {showSubtitle && (
            <span
              className={`font-semibold ${text.sub} mt-1 uppercase`}
              style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}
            >
              {subText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
