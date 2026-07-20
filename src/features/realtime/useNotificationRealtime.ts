'use client';

import { useEffect } from 'react';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { connectSocket } from '@/lib/socket';
import { SOCKET_BROADCAST_EVENTS } from '@/lib/socketEvents';
import { getAccessToken } from '@/lib/tokenStorage';
import { Notification } from '@/types/notification';
import { PAGE_SIZE } from '@/types/pagination';

interface NotificationsPage {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Keeps the global notification feed live via `notification:new`
 * (user is auto-joined to `user:{userId}` on socket connect).
 */
export function useNotificationRealtime(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !getAccessToken()) return;

    const socket = connectSocket();

    const onNotification = (payload: { notification: Notification }) => {
      const notification = payload.notification;
      if (!notification) return;

      queryClient.setQueryData<InfiniteData<NotificationsPage>>(['notifications'], (prev) => {
        if (!prev || prev.pages.length === 0) {
          return {
            pages: [
              {
                notifications: [notification],
                total: 1,
                unreadCount: notification.isRead ? 0 : 1,
                offset: 0,
                limit: PAGE_SIZE,
                hasMore: false,
              },
            ],
            pageParams: [0],
          };
        }

        const [first, ...rest] = prev.pages;
        if (first.notifications.some((item) => item.id === notification.id)) {
          return prev;
        }

        return {
          ...prev,
          pages: [
            {
              ...first,
              notifications: [notification, ...first.notifications],
              total: first.total + 1,
              unreadCount: first.unreadCount + (notification.isRead ? 0 : 1),
            },
            ...rest,
          ],
        };
      });
    };

    socket.on(SOCKET_BROADCAST_EVENTS.NOTIFICATION_NEW, onNotification);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off(SOCKET_BROADCAST_EVENTS.NOTIFICATION_NEW, onNotification);
    };
  }, [enabled, queryClient]);
}
