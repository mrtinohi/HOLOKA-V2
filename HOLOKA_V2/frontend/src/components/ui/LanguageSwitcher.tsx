import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'compact';
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  theme = 'auto',
}) => {
  const { language, setLanguage } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = theme === 'auto' ? resolvedTheme === 'dark' : theme === 'dark';

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl border transition-all duration-200 select-none ${
        isDark
          ? 'bg-slate-900 border-slate-800'
          : 'bg-slate-100 border-slate-200/80'
      } ${className}`}
    >
      <button
        id="btn-lang-vi"
        type="button"
        onClick={() => setLanguage('vi')}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
          language === 'vi'
            ? isDark
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
            : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        VI
      </button>

      <button
        id="btn-lang-en"
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
          language === 'en'
            ? isDark
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
            : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
