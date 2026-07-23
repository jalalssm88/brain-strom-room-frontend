'use client';

import { useEffect, useState } from 'react';
import WorkspaceChat from '@/components/chat/WorkspaceChat';
import { MemberRole } from '@/types/workspace';
import styles from './BoardChatFloat.module.css';

interface BoardChatFloatProps {
  workspaceId: number;
  workspaceName: string;
  currentUserId: number;
  role: MemberRole;
}

export default function BoardChatFloat({
  workspaceId,
  workspaceName,
  currentUserId,
  role,
}: BoardChatFloatProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className={styles.dock}>
      {open && (
        <div className={styles.panelWrap} role="dialog" aria-label="Workspace chat">
          <WorkspaceChat
            workspaceId={workspaceId}
            workspaceName={workspaceName}
            currentUserId={currentUserId}
            role={role}
            variant="float"
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      <button
        type="button"
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        title={open ? 'Close chat' : 'Open chat'}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v7.5a2.25 2.25 0 0 1-2.25 2.25H9.31L6 19.5v-2.25H6.75A2.25 2.25 0 0 1 4.5 15V6.75Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
