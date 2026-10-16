import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: '400px',
  md: '540px',
  lg: '680px',
  xl: '820px',
};

export default function Modal({ isOpen, onClose, title, subtitle, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="fade-in w-full flex flex-col"
        style={{
          maxWidth: sizeMap[size],
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #f1f5f9' }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>{title}</h2>
            {subtitle && <p className="text-sm mt-0.5" style={{ color: '#94a3b8' }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors ml-4 flex-shrink-0"
            style={{ color: '#94a3b8' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
