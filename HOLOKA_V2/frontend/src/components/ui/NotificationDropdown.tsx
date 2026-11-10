import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Check, X, ChevronRight,
  AlertCircle, FileText, Wrench, Clock, Zap,
  BellOff, ShieldCheck, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { listNotifications, markRead, markAllRead } from '../../services/notificationService';
import type { NotificationView, AlertCategory, NotificationType } from '../../types';
import { AlertCategoryBadge } from './Badge';
import { errorMessage } from '../../services/api';

interface NotificationDropdownProps {
  unread: number;
  onUnreadChange: (newCount: number) => void;
  workspaceId: number;
}

type TabFilter = 'all' | 'unread' | 'urgent';

const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  CONTRACT: FileText,
  PAYMENT: Zap,
  MAINTENANCE: Wrench,
  TASK: Clock,
  SYSTEM: AlertCircle,
};

const CATEGORY_STYLES: Record<AlertCategory, { fg: string; bg: string; border: string }> = {
  URGENT: {
    fg: 'var(--danger)',
    bg: 'var(--danger-soft)',
    border: 'var(--danger-border)',
  },
  NEEDS_ATTENTION: {
    fg: 'var(--warning)',
    bg: 'var(--warning-soft)',
    border: 'var(--warning-border)',
  },
  UPCOMING: {
    fg: 'var(--brand)',
    bg: 'var(--brand-soft)',
    border: 'var(--brand-200)',
  },
};

function formatRelativeTime(dateStr: string, isVi: boolean): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 45) return isVi ? 'Vừa xong' : 'Just now';
  if (diffMin < 60) return isVi ? `${diffMin} phút trước` : `${diffMin}m ago`;
  if (diffHour < 24) return isVi ? `${diffHour} giờ trước` : `${diffHour}h ago`;
  if (diffDay === 1) return isVi ? 'Hôm qua' : 'Yesterday';
  if (diffDay < 7) return isVi ? `${diffDay} ngày trước` : `${diffDay}d ago`;

  return date.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: diffDay > 365 ? 'numeric' : undefined,
  });
}

export default function NotificationDropdown({
  unread,
  onUnreadChange,
  workspaceId,
}: NotificationDropdownProps) {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<TabFilter>('all');
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Fetch latest notifications whenever popup is opened
  useEffect(() => {
    if (!isOpen || !workspaceId) return;

    let active = true;
    setLoading(true);
    setError('');

    listNotifications(workspaceId, { page: 0, size: 25 })
      .then(res => {
        if (!active) return;
        setNotifications(res.items || []);
      })
      .catch(err => {
        if (!active) return;
        setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, workspaceId]);

  // Mark all as read
  const handleMarkAll = async () => {
    if (!workspaceId || unread === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllRead(workspaceId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      onUnreadChange(0);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  };

  // Mark single item read without leaving
  const handleSingleMarkRead = async (e: React.MouseEvent, notif: NotificationView) => {
    e.stopPropagation();
    if (notif.read || !workspaceId) return;
    try {
      await markRead(workspaceId, notif.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, read: true } : n))
      );
      onUnreadChange(Math.max(0, unread - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  // Click on a notification row
  const handleRowClick = async (notif: NotificationView) => {
    if (!notif.read && workspaceId) {
      try {
        await markRead(workspaceId, notif.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, read: true } : n))
        );
        onUnreadChange(Math.max(0, unread - 1));
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }
    setIsOpen(false);
    if (notif.sourcePath && notif.sourcePath.trim() !== '') {
      navigate(notif.sourcePath);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  // Compute urgent and unread counts
  const urgentCount = useMemo(
    () => notifications.filter(n => n.category === 'URGENT' && !n.read).length,
    [notifications]
  );

  // Filtered notifications
  const filteredList = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.read);
    if (filter === 'urgent') return notifications.filter(n => n.category === 'URGENT');
    return notifications;
  }, [notifications, filter]);

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* ─── Notification Bell Trigger Button ─── */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className={`btn btn-ghost btn-icon relative transition-colors ${
          isOpen ? 'text-[var(--brand)]' : ''
        }`}
        style={isOpen ? { background: 'var(--surface-hover)' } : undefined}
        title={t('layout.notifications')}
        aria-label={t('layout.notifications')}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold text-white flex items-center justify-center pointer-events-none shadow-sm animate-pulse-subtle"
            style={{ background: 'var(--danger)', boxShadow: '0 0 0 2px var(--navbar-bg)' }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* ─── Professional Notification Popover Dropdown ─── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={t('notif.dropdown_title')}
          className="absolute right-0 top-full mt-2.5 w-[calc(100vw-24px)] sm:w-[420px] max-w-[440px] rounded-2xl flex flex-col overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg), 0 24px 48px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* ─── Top Header ─── */}
          <div
            className="p-4 flex items-center justify-between gap-3 shrink-0"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-subtle)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
              >
                <Bell size={16} />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <h3
                  className="text-base font-bold truncate leading-tight"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                >
                  {t('notif.dropdown_title')}
                </h3>
                {unread > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0"
                    style={{
                      background: 'var(--danger-soft)',
                      color: 'var(--danger)',
                      border: '1px solid var(--danger-border)',
                    }}
                  >
                    {unread} {t('notif.new')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  disabled={markingAll}
                  className="btn btn-ghost text-xs font-semibold py-1 px-2.5 h-8 flex items-center gap-1.5"
                  style={{ color: 'var(--brand-text)' }}
                  title={t('notif.mark_all_read')}
                >
                  <CheckCheck size={14} className={markingAll ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">{t('notif.mark_all_read')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-icon h-8 w-8 -mr-1"
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ─── Segmented Tabs Filter ─── */}
          <div
            className="px-4 py-2 flex items-center gap-1.5 shrink-0"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
          >
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              style={
                filter === 'all'
                  ? {
                      background: 'var(--surface-subtle)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                    }
                  : { color: 'var(--text-muted)' }
              }
            >
              {t('notif.tab_all')}
            </button>

            <button
              type="button"
              onClick={() => setFilter('unread')}
              className="px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              style={
                filter === 'unread'
                  ? {
                      background: 'var(--surface-subtle)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                    }
                  : { color: 'var(--text-muted)' }
              }
            >
              <span>{t('notif.tab_unread')}</span>
              {unread > 0 && (
                <span
                  className="w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ background: 'var(--brand)' }}
                >
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilter('urgent')}
              className="px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              style={
                filter === 'urgent'
                  ? {
                      background: 'var(--surface-subtle)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                    }
                  : { color: 'var(--text-muted)' }
              }
            >
              <span>{t('notif.tab_urgent')}</span>
              {urgentCount > 0 && (
                <span
                  className="w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ background: 'var(--danger)' }}
                >
                  {urgentCount}
                </span>
              )}
            </button>
          </div>

          {/* ─── Notification List ─── */}
          <div className="flex-1 overflow-y-auto max-h-[380px] sm:max-h-[420px] divide-y divide-[var(--border)]">
            {loading && notifications.length === 0 ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div
                      className="w-9 h-9 rounded-xl shrink-0"
                      style={{ background: 'var(--surface-subtle)' }}
                    />
                    <div className="flex-1 space-y-2">
                      <div
                        className="h-3.5 w-3/4 rounded"
                        style={{ background: 'var(--surface-subtle)' }}
                      />
                      <div
                        className="h-3 w-5/6 rounded"
                        style={{ background: 'var(--surface-subtle)' }}
                      />
                      <div
                        className="h-2.5 w-1/3 rounded"
                        style={{ background: 'var(--surface-subtle)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <AlertCircle size={32} className="mx-auto mb-2" style={{ color: 'var(--danger)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>{error}</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: 'var(--surface-subtle)', color: 'var(--text-muted)' }}
                >
                  {filter === 'unread' ? <ShieldCheck size={24} style={{ color: 'var(--success)' }} /> : <BellOff size={24} />}
                </div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {filter === 'unread'
                    ? t('notif.empty_unread')
                    : filter === 'urgent'
                    ? t('notif.empty_urgent')
                    : t('notif.empty_title')}
                </h4>
                <p className="text-xs mt-1 max-w-[280px]" style={{ color: 'var(--text-muted)' }}>
                  {t('notif.empty_desc')}
                </p>
              </div>
            ) : (
              filteredList.map(notif => {
                const IconComponent = TYPE_ICONS[notif.type] ?? Bell;
                const tone = CATEGORY_STYLES[notif.category] ?? CATEGORY_STYLES.UPCOMING;

                return (
                  <article
                    key={notif.id}
                    onClick={() => handleRowClick(notif)}
                    className="group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                    style={{
                      background: notif.read ? 'transparent' : 'var(--brand-soft)',
                    }}
                  >
                    {/* Category / Type Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: tone.bg,
                        border: `1px solid ${tone.border}`,
                        color: tone.fg,
                      }}
                    >
                      <IconComponent size={16} />
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[13px] leading-tight truncate ${
                                notif.read ? 'font-medium' : 'font-bold'
                              }`}
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {notif.title}
                            </span>
                            {!notif.read && (
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: 'var(--brand)' }}
                              />
                            )}
                          </div>

                          <p
                            className="text-xs line-clamp-2 mt-1 leading-snug"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {notif.message}
                          </p>
                        </div>

                        {/* Quick Mark Read Action */}
                        {!notif.read && (
                          <button
                            type="button"
                            onClick={e => handleSingleMarkRead(e, notif)}
                            className="btn btn-ghost btn-icon h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shrink-0 -mt-1"
                            title={t('notif.mark_read')}
                            aria-label={t('notif.mark_read')}
                          >
                            <Check size={14} style={{ color: 'var(--text-muted)' }} />
                          </button>
                        )}
                      </div>

                      {/* Meta Footer */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <AlertCategoryBadge category={notif.category} />
                          <span
                            className="text-[11px]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {formatRelativeTime(notif.createdAt, isVi)}
                          </span>
                        </div>

                        {notif.sourcePath && (
                          <span
                            className="text-[11px] font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--brand-text)' }}
                          >
                            <span>{t('notif.open_details')}</span>
                            <ArrowRight size={11} />
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* ─── Bottom Footer ─── */}
          <div
            className="px-4 py-2.5 flex items-center justify-between gap-3 shrink-0"
            style={{
              borderTop: '1px solid var(--border)',
              background: 'var(--surface-subtle)',
            }}
          >
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Live</span>
            </div>

            <button
              type="button"
              onClick={handleViewAll}
              className="inline-flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
              style={{ color: 'var(--brand-text)' }}
            >
              <span>{t('notif.view_all')}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

