import { Package } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon = Package, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' }}
      >
        <Icon size={28} style={{ color: '#94a3b8' }} />
      </div>
      <h3 className="text-base font-semibold" style={{ color: '#0f172a' }}>{title}</h3>
      {description && (
        <p className="text-sm mt-1.5 max-w-xs" style={{ color: '#94a3b8' }}>{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
