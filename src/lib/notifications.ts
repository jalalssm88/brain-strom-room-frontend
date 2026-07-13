import { apiClient } from './api';
import { ApiSuccessResponse } from '@/types/auth';
import { Notification } from '@/types/notification';
import { PAGE_SIZE } from '@/types/pagination';

export interface NotificationListResult {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export async function listNotificationsRequest(
  offset = 0,
  limit = PAGE_SIZE,
): Promise<NotificationListResult> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      notifications: Notification[];
      total: number;
      unreadCount: number;
      offset: number;
      limit: number;
      hasMore: boolean;
    }>
  >('/notifications', { params: { offset, limit } });

  return data.data;
}

export async function markNotificationReadRequest(id: number): Promise<Notification> {
  const { data } = await apiClient.patch<ApiSuccessResponse<{ notification: Notification }>>(
    `/notifications/${id}/read`,
  );
  return data.data.notification;
}

export async function markAllNotificationsReadRequest(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}
