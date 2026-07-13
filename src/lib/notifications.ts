import { apiClient } from './api';
import { ApiSuccessResponse } from '@/types/auth';
import { Notification } from '@/types/notification';

export async function listNotificationsRequest(): Promise<Notification[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ notifications: Notification[] }>>(
    '/notifications',
  );
  return data.data.notifications;
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
