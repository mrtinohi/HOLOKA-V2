import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type ThemeMode } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface ThemeToggleProps {
  variant?: 'pill' | 'icon' | 'selector';
  className?: string;
  /** Retained for backwards compatibility; the toggle follows the active theme. */
  themeContext?: 'dark' | 'light' | 'auto';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const segmentClass = (active: boolean) =>
    `flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
      active ? 'shadow-sm' : ''
    }`;

  const segmentStyle = (active: boolean): React.CSSProperties =>
    active
      ? { background: 'var(--surface)', color: 'var(--text-primary)' }
      : { color: 'var(--text-muted)' };

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-0.5 p-0.5 rounded-xl ${className}`}
        style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          title={t('theme.light')}
          aria-pressed={resolvedTheme === 'light'}
          className={segmentClass(resolvedTheme === 'light')}
          style={segmentStyle(resolvedTheme === 'light')}
        >
          <Sun size={14} />
          <span className="hidden sm:inline">{t('theme.light_short')}</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          title={t('theme.dark')}
          aria-pressed={resolvedTheme === 'dark'}
          className={segmentClass(resolvedTheme === 'dark')}
          style={segmentStyle(resolvedTheme === 'dark')}
        >
          <Moon size={14} />
          <span className="hidden sm:inline">{t('theme.dark_short')}</span>
        </button>
      </div>
    );
  }

  if (variant === 'selector') {
    const modes: { id: ThemeMode; label: string; icon: React.ElementType }[] = [
      { id: 'light',  label: t('theme.light'),  icon: Sun },
      { id: 'dark',   label: t('theme.dark'),   icon: Moon },
      { id: 'system', label: t('theme.system'), icon: Monitor },
    ];

    return (
      <div className={`grid grid-cols-3 gap-2.5 ${className}`}>
        {modes.map(({ id, label, icon: Icon }) => {
          const active = theme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              aria-pressed={active}
              className="flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              style={
                active
                  ? { background: 'var(--brand-soft)', border: '1px solid var(--brand)', color: 'var(--brand-text)' }
                  : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={resolvedTheme === 'dark' ? t('theme.switch_to_light') : t('theme.switch_to_dark')}
      aria-label={resolvedTheme === 'dark' ? t('theme.switch_to_light') : t('theme.switch_to_dark')}
      className={`btn btn-ghost btn-icon ${className}`}
    >
      {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
};

export default ThemeToggle;
