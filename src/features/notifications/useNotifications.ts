'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listNotificationsRequest,
  markNotificationReadRequest,
  markAllNotificationsReadRequest,
} from '@/lib/notifications';
import { PAGE_SIZE } from '@/types/pagination';

export function useInfiniteNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam = 0 }) => listNotificationsRequest(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationReadRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsReadRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
