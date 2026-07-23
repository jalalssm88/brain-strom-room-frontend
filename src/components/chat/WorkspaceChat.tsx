'use client';

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useChatMessages, useChatRealtime } from '@/features/chat/useChat';
import UserAvatar from '@/components/UserAvatar';
import { MemberRole } from '@/types/workspace';
import styles from './WorkspaceChat.module.css';

interface WorkspaceChatProps {
  workspaceId: number;
  workspaceName: string;
  currentUserId: number;
  role: MemberRole;
  /** `page` = full page panel; `float` = compact floating dock */
  variant?: 'page' | 'float';
  onClose?: () => void;
}

export default function WorkspaceChat({
  workspaceId,
  workspaceName,
  currentUserId,
  role,
  variant = 'page',
  onClose,
}: WorkspaceChatProps) {
  const canSend = role === 'ADMIN' || role === 'EDITOR';
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useChatMessages(workspaceId);
  const { sendMessage, typingUsers, emitTypingStart, emitTypingStop } = useChatRealtime(
    workspaceId,
    true,
  );

  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottomRef = useRef(true);
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = useMemo(() => {
    const pages = data?.pages ?? [];
    // pages[0] = newest batch; reverse so older history appears first
    return [...pages].reverse().flatMap((page) => page.messages);
  }, [data]);

  const otherTyping = typingUsers.filter((user) => user.userId !== currentUserId);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, otherTyping.length]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  };

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend || sending) return;

    const message = draft.trim();
    if (!message) return;

    setError('');
    setSending(true);
    emitTypingStop();
    try {
      await sendMessage(message);
      setDraft('');
      stickToBottomRef.current = true;
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!canSend) return;

    if (value.trim()) {
      emitTypingStart();
      if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
      typingIdleRef.current = setTimeout(() => emitTypingStop(), 1500);
    } else {
      emitTypingStop();
    }
  };

  useEffect(() => {
    return () => {
      if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
      emitTypingStop();
    };
  }, [emitTypingStop]);

  return (
    <div className={`${styles.panel} ${variant === 'float' ? styles.panelFloat : ''}`}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{workspaceName}</h2>
          <p className={styles.roleHint}>
            {canSend ? 'Group chat · Enter to send' : 'View only · Viewers cannot send messages'}
          </p>
        </div>
        {onClose && (
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close chat">
            ×
          </button>
        )}
      </div>

      <div className={styles.messages} ref={listRef} onScroll={handleScroll}>
        {hasNextPage && (
          <button
            type="button"
            className={styles.loadMore}
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load earlier messages'}
          </button>
        )}

        {isLoading ? (
          <p className={styles.empty}>Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className={styles.empty}>No messages yet. Say hello to the team.</p>
        ) : (
          messages.map((msg) => {
            const mine = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`${styles.row} ${mine ? styles.rowMine : ''}`}
              >
                <UserAvatar
                  fullName={msg.senderName}
                  avatar={msg.senderAvatar}
                  className={styles.avatar}
                  fallbackClassName={styles.avatar}
                />
                <div className={`${styles.bubble} ${mine ? styles.bubbleMine : ''}`}>
                  <div className={styles.meta}>
                    <p className={styles.sender}>{mine ? 'You' : msg.senderName}</p>
                    <p className={styles.time}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <p className={styles.body}>{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={styles.typing}>
        {otherTyping.length > 0 &&
          `${otherTyping.map((u) => u.fullName.split(' ')[0]).join(', ')} typing…`}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {canSend ? (
        <form className={styles.composer} onSubmit={handleSend}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message…"
            maxLength={2000}
            rows={1}
          />
          <button type="submit" className={styles.sendBtn} disabled={sending || !draft.trim()}>
            {sending ? '…' : 'Send'}
          </button>
        </form>
      ) : (
        <div className={styles.readonly}>Viewers can read chat but cannot send messages.</div>
      )}
    </div>
  );
}
