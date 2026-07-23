'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { listChatMessagesRequest } from '@/lib/chat';
import { connectSocket } from '@/lib/socket';
import { SOCKET_BROADCAST_EVENTS, SOCKET_EVENTS } from '@/lib/socketEvents';
import { getAccessToken } from '@/lib/tokenStorage';
import { ChatMessage } from '@/types/chat';

const CHAT_PAGE_SIZE = 30;

function chatKey(workspaceId: number) {
  return ['workspaces', workspaceId, 'messages'] as const;
}

export function useChatMessages(workspaceId: number) {
  return useInfiniteQuery({
    queryKey: chatKey(workspaceId),
    queryFn: ({ pageParam }) =>
      listChatMessagesRequest(workspaceId, {
        cursor: pageParam,
        limit: CHAT_PAGE_SIZE,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor != null ? lastPage.nextCursor : undefined,
    enabled: workspaceId > 0,
  });
}

export function useChatRealtime(workspaceId: number, enabled = true) {
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: number; fullName: string }>>(
    [],
  );
  const typingTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!enabled || workspaceId <= 0 || !getAccessToken()) return;

    const socket = connectSocket();

    const join = () => {
      socket.emit(SOCKET_EVENTS.WORKSPACE_JOIN, { workspaceId });
    };

    const onChatMessage = (payload: { message: ChatMessage }) => {
      const message = payload.message;
      if (!message || message.workspaceId !== workspaceId) return;

      queryClient.setQueryData(chatKey(workspaceId), (prev: unknown) => {
        const data = prev as
          | {
              pages: Array<{
                messages: ChatMessage[];
                nextCursor: number | null;
                hasMore: boolean;
              }>;
              pageParams: Array<number | undefined>;
            }
          | undefined;

        if (!data || data.pages.length === 0) {
          return {
            pages: [
              {
                messages: [message],
                nextCursor: null,
                hasMore: false,
              },
            ],
            pageParams: [undefined],
          };
        }

        const pages = [...data.pages];
        const firstPage = pages[0];
        if (firstPage.messages.some((item) => item.id === message.id)) {
          return data;
        }

        // pages[0] is the newest batch (first fetch without cursor)
        pages[0] = {
          ...firstPage,
          messages: [...firstPage.messages, message],
        };

        return { ...data, pages };
      });
    };

    const clearTypingTimer = (userId: number) => {
      const existing = typingTimers.current.get(userId);
      if (existing) {
        clearTimeout(existing);
        typingTimers.current.delete(userId);
      }
    };

    const onTypingStart = (payload: {
      workspaceId: number;
      userId: number;
      fullName: string;
    }) => {
      if (payload.workspaceId !== workspaceId) return;
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === payload.userId)) return prev;
        return [...prev, { userId: payload.userId, fullName: payload.fullName }];
      });
      clearTypingTimer(payload.userId);
      typingTimers.current.set(
        payload.userId,
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
          typingTimers.current.delete(payload.userId);
        }, 3000),
      );
    };

    const onTypingStop = (payload: { workspaceId: number; userId: number }) => {
      if (payload.workspaceId !== workspaceId) return;
      clearTypingTimer(payload.userId);
      setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
    };

    socket.on('connect', join);
    socket.on(SOCKET_BROADCAST_EVENTS.CHAT_MESSAGE, onChatMessage);
    socket.on(SOCKET_BROADCAST_EVENTS.TYPING_START, onTypingStart);
    socket.on(SOCKET_BROADCAST_EVENTS.TYPING_STOP, onTypingStop);

    if (socket.connected) join();
    else socket.connect();

    return () => {
      socket.emit(SOCKET_EVENTS.WORKSPACE_LEAVE, { workspaceId });
      socket.off('connect', join);
      socket.off(SOCKET_BROADCAST_EVENTS.CHAT_MESSAGE, onChatMessage);
      socket.off(SOCKET_BROADCAST_EVENTS.TYPING_START, onTypingStart);
      socket.off(SOCKET_BROADCAST_EVENTS.TYPING_STOP, onTypingStop);
      typingTimers.current.forEach((timer) => clearTimeout(timer));
      typingTimers.current.clear();
      setTypingUsers([]);
    };
  }, [workspaceId, enabled, queryClient]);

  const sendMessage = useCallback(
    (message: string) =>
      new Promise<ChatMessage>((resolve, reject) => {
        const socket = connectSocket();
        socket.emit(
          SOCKET_EVENTS.CHAT_MESSAGE,
          { workspaceId, message },
          (response: { success?: boolean; data?: { message: ChatMessage }; error?: string }) => {
            if (response?.success && response.data?.message) {
              resolve(response.data.message);
              return;
            }
            reject(new Error(response?.error ?? 'Failed to send message'));
          },
        );
      }),
    [workspaceId],
  );

  const emitTypingStart = useCallback(() => {
    connectSocket().emit(SOCKET_EVENTS.TYPING_START, { workspaceId });
  }, [workspaceId]);

  const emitTypingStop = useCallback(() => {
    connectSocket().emit(SOCKET_EVENTS.TYPING_STOP, { workspaceId });
  }, [workspaceId]);

  return { sendMessage, typingUsers, emitTypingStart, emitTypingStop };
}
