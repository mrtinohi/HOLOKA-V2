import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export type StatTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  tone?: StatTone;
  /** Percentage change vs. previous period. Omit to hide the trend row. */
  trend?: number;
  hint?: string;
  footer?: React.ReactNode;
  className?: string;
}

const toneVars: Record<StatTone, { fg: string; bg: string; border: string }> = {
  brand:   { fg: 'var(--brand)',   bg: 'var(--brand-soft)',   border: 'var(--brand-200)' },
  success: { fg: 'var(--success)', bg: 'var(--success-soft)', border: 'var(--success-border)' },
  warning: { fg: 'var(--warning)', bg: 'var(--warning-soft)', border: 'var(--warning-border)' },
  danger:  { fg: 'var(--danger)',  bg: 'var(--danger-soft)',  border: 'var(--danger-border)' },
  neutral: { fg: 'var(--text-muted)', bg: 'var(--surface-subtle)', border: 'var(--border)' },
};

export default function StatCard({
  title, value, icon: Icon, tone = 'brand', trend, hint, footer, className = '',
}: StatCardProps) {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const t = toneVars[tone];

  return (
    <div className={`card card-interactive p-5 flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide pt-1" style={{ color: 'var(--text-muted)' }}>
          {title}
        </p>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.fg }}
        >
          <Icon size={17} />
        </div>
      </div>

      <p className="text-2xl font-bold mt-3 tracking-tight tabular-nums" style={{ color: t.fg }}>
        {value}
      </p>

      {hint && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}

      {trend !== undefined && (
        <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold">
          {trend >= 0
            ? <TrendingUp size={13} style={{ color: 'var(--success)' }} />
            : <TrendingDown size={13} style={{ color: 'var(--danger)' }} />}
          <span style={{ color: trend >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          <span className="font-normal" style={{ color: 'var(--text-muted)' }}>
            {isVi ? 'so với tháng trước' : 'vs last month'}
          </span>
        </div>
      )}

      {footer && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}
