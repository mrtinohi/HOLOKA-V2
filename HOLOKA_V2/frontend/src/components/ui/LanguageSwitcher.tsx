import React from 'react';
import { useLanguage, type Language } from '../../contexts/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'compact';
  className?: string;
  /** Retained for backwards compatibility; the switcher uses design tokens. */
  theme?: 'dark' | 'light' | 'auto';
}

const LANGUAGES: { id: Language; label: string; title: string }[] = [
  { id: 'vi', label: 'VI', title: 'Tiếng Việt' },
  { id: 'en', label: 'EN', title: 'English' },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Chọn ngôn ngữ"
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-xl ${className}`}
      style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
    >
      {LANGUAGES.map(({ id, label, title }) => {
        const active = language === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setLanguage(id)}
            title={title}
            lang={id}
            aria-pressed={active}
            className="px-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
            style={
              active
                ? { background: 'var(--surface)', color: 'var(--brand-text)', boxShadow: 'var(--shadow-sm)' }
                : { color: 'var(--text-muted)' }
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
