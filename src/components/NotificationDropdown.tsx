'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useInfiniteNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/features/notifications/useNotifications';
import { useNotificationRealtime } from '@/features/realtime/useNotificationRealtime';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import styles from './NotificationDropdown.module.css';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownBodyRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useNotificationRealtime(true);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteNotifications();

  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.notifications) ?? [],
    [data],
  );

  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  useInfiniteScroll(sentinelRef, {
    hasMore: !!hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNextPage,
    rootRef: dropdownBodyRef,
    enabled: isOpen,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (id: number, isRead: boolean) => {
    if (!isRead) {
      markRead.mutate(id);
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.bellBtn}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3 className={styles.dropdownTitle}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markAllBtn}
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className={styles.dropdownBody} ref={dropdownBodyRef}>
            {isLoading ? (
              <p className={styles.empty}>Loading…</p>
            ) : notifications.length > 0 ? (
              <>
                <ul className={styles.list}>
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <button
                        type="button"
                        className={`${styles.item} ${notification.isRead ? styles.read : styles.unread}`}
                        onClick={() =>
                          handleNotificationClick(notification.id, notification.isRead)
                        }
                      >
                        <div className={styles.itemDot} aria-hidden="true" />
                        <div className={styles.itemContent}>
                          <p className={styles.itemTitle}>{notification.title}</p>
                          <p className={styles.itemMessage}>{notification.message}</p>
                          <p className={styles.itemTime}>
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>

                <div ref={sentinelRef} className={styles.scrollSentinel} aria-hidden="true" />

                {isFetchingNextPage && (
                  <p className={styles.loadingMore}>Loading more…</p>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>No notifications</p>
                <p className={styles.empty}>You&apos;re all caught up!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
