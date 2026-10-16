import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Eye, AlertCircle, FileText, Wrench, Clock, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from '../services/notificationService';
import type { NotificationView, AlertCategory } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { AlertCategoryBadge } from '../components/ui/Badge';

/* ── Icon by type ─────────────────────────────────────────────────────────── */
function NotifIcon({ type, category }: { type: string; category: AlertCategory }) {
  const iconMap: Record<string, React.ElementType> = {
    CONTRACT: FileText,
    PAYMENT: Zap,
    MAINTENANCE: Wrench,
    TASK: Clock,
    SYSTEM: AlertCircle,
  };
  const Icon = iconMap[type] ?? Bell;

  const colorMap: Record<AlertCategory, { color: string; bg: string }> = {
    URGENT:          { color: '#dc2626', bg: '#fef2f2' },
    NEEDS_ATTENTION: { color: '#d97706', bg: '#fffbeb' },
    UPCOMING:        { color: '#059669', bg: '#ecfdf5' },
  };
  const { color, bg } = colorMap[category] ?? { color: '#6366f1', bg: '#f5f3ff' };

  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: bg }}
    >
      <Icon size={18} style={{ color }} />
    </div>
  );
}

/* ── Notification Row ─────────────────────────────────────────────────────── */
function NotifRow({ notif, onRead }: { notif: NotificationView; onRead: () => void }) {
  const fmtDate = (d: string) =>
    new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer group"
      style={{
        background: notif.read ? 'transparent' : 'rgba(99,102,241,0.03)',
        border: `1px solid ${notif.read ? '#f1f5f9' : 'rgba(99,102,241,0.12)'}`,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
      onMouseLeave={e => (e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(99,102,241,0.03)')}
    >
      <NotifIcon type={notif.type} category={notif.category} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>
                {notif.title}
              </p>
              {!notif.read && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: '#6366f1' }}
                />
              )}
            </div>
            <p className="text-sm" style={{ color: '#64748b' }}>{notif.message}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <AlertCategoryBadge category={notif.category} />
              <span className="text-xs" style={{ color: '#94a3b8' }}>{fmtDate(notif.createdAt)}</span>
            </div>
          </div>

          {!notif.read && (
            <button
              onClick={(e) => { e.stopPropagation(); onRead(); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}
            >
              <Eye size={12} /> Đánh dấu đã đọc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const { user } = useAuth();
  const wsId = user!.workspaces[0].id;

  const [notifs, setNotifs] = useState<NotificationView[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | ''>('');
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      listNotifications(wsId, {
        read: readFilter === 'unread' ? false : undefined,
        category: (categoryFilter as AlertCategory) || undefined,
        page,
        size: 20,
      }),
      getUnreadCount(wsId),
    ])
      .then(([res, cnt]) => { setNotifs(res.items); setTotal(res.totalElements); setUnread(cnt); })
      .finally(() => setLoading(false));
  }, [wsId, categoryFilter, readFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id: number) => {
    await markRead(wsId, id);
    load();
  };

  const handleMarkAll = async () => {
    await markAllRead(wsId);
    load();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Thông báo</h1>
            {unread > 0 && (
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#f43f5e,#fb7185)' }}
              >
                {unread} chưa đọc
              </span>
            )}
          </div>
          <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>
            Cảnh báo và nhắc nhở từ HOLOKA.
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
          >
            <CheckCheck size={16} /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="fade-in flex items-center gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'unread', label: `Chưa đọc (${unread})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setReadFilter(tab.key as typeof readFilter); setPage(0); }}
            className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={readFilter === tab.key
              ? { background: '#6366f1', color: '#fff' }
              : { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }
            }
          >
            {tab.label}
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

        {[
          { key: '', label: 'Tất cả loại' },
          { key: 'URGENT', label: '🔴 Khẩn cấp' },
          { key: 'NEEDS_ATTENTION', label: '🟡 Cần chú ý' },
          { key: 'UPCOMING', label: '🟢 Sắp tới' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setCategoryFilter(tab.key as AlertCategory | ''); setPage(0); }}
            className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={categoryFilter === tab.key
              ? { background: '#f1f5f9', color: '#0f172a', fontWeight: 600 }
              : { color: '#64748b' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2 fade-in">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))
        ) : notifs.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Bell}
              title="Không có thông báo"
              description={readFilter === 'unread' ? 'Bạn đã đọc tất cả thông báo.' : 'Chưa có thông báo nào.'}
            />
          </div>
        ) : notifs.map((n, i) => (
          <div key={n.id} style={{ animationDelay: `${i * 0.03}s` }}>
            <NotifRow notif={n} onRead={() => handleMarkRead(n.id)} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: '#94a3b8' }}>Trang {page + 1} / {Math.ceil(total / 20)}</p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>← Trước</button>
            <button disabled={page >= Math.ceil(total / 20) - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>Sau →</button>
          </div>
        </div>
      )}
    </div>
  );
}
