import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type ThemeMode } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface ThemeToggleProps {
  variant?: 'pill' | 'icon' | 'selector';
  className?: string;
  themeContext?: 'dark' | 'light' | 'auto';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
  themeContext = 'auto',
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const isDarkUi = themeContext === 'dark' || (themeContext === 'auto' && resolvedTheme === 'dark');

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-xl border transition-all duration-200 select-none ${
          isDarkUi
            ? 'bg-slate-900/90 border-white/10 backdrop-blur-md'
            : 'bg-slate-100 border-slate-200'
        } ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          title={t('theme.light', 'Chế độ Sáng')}
          className={`p-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1 ${
            resolvedTheme === 'light'
              ? 'bg-white text-amber-500 shadow-xs border border-slate-200/80 font-bold'
              : isDarkUi
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sun size={14} className={resolvedTheme === 'light' ? 'text-amber-500' : ''} />
          <span className="text-[11px] hidden sm:inline">{t('theme.light_short', 'Sáng')}</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          title={t('theme.dark', 'Chế độ Tối')}
          className={`p-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1 ${
            resolvedTheme === 'dark'
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : isDarkUi
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Moon size={14} className={resolvedTheme === 'dark' ? 'text-indigo-200' : ''} />
          <span className="text-[11px] hidden sm:inline">{t('theme.dark_short', 'Tối')}</span>
        </button>
      </div>
    );
  }

  if (variant === 'selector') {
    const modes: { id: ThemeMode; label: string; icon: React.ElementType }[] = [
      { id: 'light', label: t('theme.light', 'Sáng'), icon: Sun },
      { id: 'dark', label: t('theme.dark', 'Tối'), icon: Moon },
      { id: 'system', label: t('theme.system', 'Hệ thống'), icon: Monitor },
    ];

    return (
      <div className={`grid grid-cols-3 gap-2.5 ${className}`}>
        {modes.map(mode => {
          const Icon = mode.icon;
          const isActive = theme === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setTheme(mode.id)}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-400 dark:text-indigo-300 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default: icon button (single-click toggle)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={
        resolvedTheme === 'dark'
          ? t('theme.switch_to_light', 'Chuyển sang giao diện Sáng')
          : t('theme.switch_to_dark', 'Chuyển sang giao diện Tối')
      }
      aria-label="Toggle color theme"
      className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer ${
        isDarkUi
          ? 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/80'
          : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
      } ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {resolvedTheme === 'dark' ? (
          <Sun size={19} className="text-amber-400 hover:rotate-90 transition-transform duration-300" />
        ) : (
          <Moon size={19} className="text-slate-700 hover:-rotate-12 transition-transform duration-300" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
