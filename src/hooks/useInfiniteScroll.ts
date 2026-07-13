'use client';

import { RefObject, useEffect } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isFetching: boolean;
  fetchNextPage: () => void;
  rootRef?: RefObject<HTMLElement | null>;
  enabled?: boolean;
}

export function useInfiniteScroll(
  sentinelRef: RefObject<HTMLElement | null>,
  {
    hasMore,
    isFetching,
    fetchNextPage,
    rootRef,
    enabled = true,
  }: UseInfiniteScrollOptions,
) {
  useEffect(() => {
    if (!enabled) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isFetching) {
          fetchNextPage();
        }
      },
      {
        root: rootRef?.current ?? null,
        rootMargin: '120px',
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef, hasMore, isFetching, fetchNextPage, rootRef, enabled]);
}
