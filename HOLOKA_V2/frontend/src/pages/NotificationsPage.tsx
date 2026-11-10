import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Eye, AlertCircle, FileText, Wrench, Clock, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { listNotifications, getUnreadCount, markRead, markAllRead } from '../services/notificationService';
import type { NotificationView, AlertCategory } from '../types';
import EmptyState from '../components/ui/EmptyState';
import { AlertCategoryBadge } from '../components/ui/Badge';
import { ErrorNotice, Pagination } from '../components/ui/ResourceControls';
import { errorMessage } from '../services/api';

const PAGE_SIZE = 20;

const ICON_MAP: Record<string, React.ElementType> = {
  CONTRACT: FileText,
  PAYMENT: Zap,
  MAINTENANCE: Wrench,
  TASK: Clock,
  SYSTEM: AlertCircle,
};

const CATEGORY_TONE: Record<AlertCategory, { fg: string; bg: string; border: string }> = {
  URGENT:          { fg: 'var(--danger)',  bg: 'var(--danger-soft)',  border: 'var(--danger-border)' },
  NEEDS_ATTENTION: { fg: 'var(--warning)', bg: 'var(--warning-soft)', border: 'var(--warning-border)' },
  UPCOMING:        { fg: 'var(--success)', bg: 'var(--success-soft)', border: 'var(--success-border)' },
};

function NotifIcon({ type, category }: { type: string; category: AlertCategory }) {
  const Icon = ICON_MAP[type] ?? Bell;
  const tone = CATEGORY_TONE[category] ?? CATEGORY_TONE.UPCOMING;
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: tone.bg, border: `1px solid ${tone.border}`, color: tone.fg }}
    >
      <Icon size={16} />
    </div>
  );
}

function NotifRow({ notif, onRead }: { notif: NotificationView; onRead: () => void }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString(isVi ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <article
      className="group flex items-start gap-3 p-3.5 rounded-xl transition-colors"
      style={{
        background: notif.read ? 'var(--surface)' : 'var(--brand-soft)',
        border: `1px solid ${notif.read ? 'var(--border)' : 'var(--brand-200)'}`,
      }}
    >
      <NotifIcon type={notif.type} category={notif.category} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{notif.title}</p>
              {!notif.read && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--brand)' }} />}
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{notif.message}</p>
            <div className="flex items-center gap-2.5 mt-2 flex-wrap">
              <AlertCategoryBadge category={notif.category} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmtDate(notif.createdAt)}</span>
            </div>
          </div>

          {!notif.read && (
            <button
              type="button"
              onClick={onRead}
              className="btn btn-ghost flex-shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            >
              <Eye size={14} />
              <span className="hidden sm:inline">{isVi ? 'Đã đọc' : 'Mark Read'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const wsId = user!.workspaces[0].id;

  const [notifs, setNotifs] = useState<NotificationView[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | ''>('');
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(0);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      listNotifications(wsId, {
        category: categoryFilter || undefined,
        active: readFilter === 'unread' ? true : undefined,
        page,
        size: PAGE_SIZE,
      }),
      getUnreadCount(wsId),
    ])
      .then(([pageRes, unreadRes]) => {
        if (!active) return;
        setNotifs(pageRes.items);
        setTotal(pageRes.totalElements);
        setUnread(unreadRes);
        setError('');
      })
      .catch(e => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [wsId, categoryFilter, readFilter, page]);

  useEffect(() => load(), [load]);

  const handleMarkOne = async (id: number) => {
    try {
      await markRead(wsId, id);
      setNotifs(n => n.map(item => item.id === id ? { ...item, read: true } : item));
      setUnread(u => Math.max(0, u - 1));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead(wsId);
      setNotifs(n => n.map(item => ({ ...item, read: true })));
      setUnread(0);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {isVi ? 'Thông báo & cảnh báo' : 'Notifications & Alerts'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isVi ? 'Tổng hợp cảnh báo tự động từ hệ thống và hạn thanh toán.' : 'Automated operational alerts, lease expirations, and overdue invoices.'}
          </p>
        </div>

        {unread > 0 && (
          <button type="button" onClick={handleMarkAll} className="btn btn-secondary">
            <CheckCheck size={16} />
            {isVi ? 'Đã đọc tất cả' : 'Mark all as read'}
          </button>
        )}
      </div>

      <ErrorNotice message={error} retry={load} />

      {/* Toolbar */}
      <div className="card p-3 flex flex-wrap gap-2.5">
        <div className="inline-flex rounded-xl p-1" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => { setReadFilter('all'); setPage(0); }}
            className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            style={readFilter === 'all' ? { background: 'var(--surface)', color: 'var(--brand-text)' } : { color: 'var(--text-muted)' }}
          >
            {isVi ? 'Tất cả' : 'All'}
          </button>
          <button
            type="button"
            onClick={() => { setReadFilter('unread'); setPage(0); }}
            className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            style={readFilter === 'unread' ? { background: 'var(--surface)', color: 'var(--brand-text)' } : { color: 'var(--text-muted)' }}
          >
            {isVi ? 'Chưa đọc' : 'Unread'} {unread > 0 ? `(${unread})` : ''}
          </button>
        </div>

        <select
          className="input sm:w-48 text-xs"
          aria-label={isVi ? 'Mức độ cảnh báo' : 'Alert severity'}
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value as AlertCategory | ''); setPage(0); }}
        >
          <option value="">{isVi ? 'Tất cả mức độ' : 'All Severities'}</option>
          <option value="URGENT">{isVi ? 'Khẩn cấp' : 'Urgent'}</option>
          <option value="NEEDS_ATTENTION">{isVi ? 'Cần chú ý' : 'Needs Attention'}</option>
          <option value="UPCOMING">{isVi ? 'Sắp tới' : 'Upcoming'}</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
        ) : notifs.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Bell}
              title={isVi ? 'Không có thông báo nào' : 'No notifications'}
              description={isVi ? 'Bạn đã xử lý hết các cảnh báo cần chú ý.' : 'All operations alerts are cleared.'}
            />
          </div>
        ) : (
          notifs.map(n => <NotifRow key={n.id} notif={n} onRead={() => handleMarkOne(n.id)} />)
        )}
      </div>

      {total > 0 && (
        <Pagination page={page} total={total} size={PAGE_SIZE} onChange={setPage} />
      )}
    </div>
  );
}
