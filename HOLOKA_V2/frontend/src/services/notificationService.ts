import api from './api';
import type { PageResponse, NotificationView, NotificationType, AlertCategory } from '../types';

export type { NotificationView, NotificationType, AlertCategory };

export const listNotifications = async (
  workspaceId: number,
  opts?: {
    read?: boolean;
    active?: boolean;
    type?: NotificationType;
    category?: AlertCategory;
    search?: string;
    page?: number;
    size?: number;
  }
): Promise<PageResponse<NotificationView>> => {
  const { data } = await api.get('/notifications', { params: { workspaceId, ...opts } });
  return data.data;
};

export const getUnreadCount = async (workspaceId: number): Promise<number> => {
  const { data } = await api.get('/notifications/unread-count', { params: { workspaceId } });
  return data.data.unreadCount;
};

export const markRead = async (workspaceId: number, id: number): Promise<NotificationView> => {
  const { data } = await api.patch(`/notifications/${id}/read`, {}, { params: { workspaceId } });
  return data.data;
};

export const markAllRead = async (workspaceId: number): Promise<number> => {
  const { data } = await api.post('/notifications/read-all', {}, { params: { workspaceId } });
  return data.data.updatedCount;
};
