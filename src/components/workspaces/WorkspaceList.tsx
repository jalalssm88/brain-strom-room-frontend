'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInfiniteWorkspaces, useRespondInvitation } from '@/features/workspaces/useWorkspaces';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { toApiError } from '@/lib/api';
import CreateWorkspaceModal from '@/components/CreateWorkspaceModal';
import { WorkspaceTab } from '@/types/workspace';
import styles from './WorkspaceList.module.css';

interface WorkspaceListProps {
  tab: WorkspaceTab;
  title: string;
  emptyTitle: string;
  emptyHint: string;
  searchQuery?: string;
  showCreateFab?: boolean;
}

export default function WorkspaceList({
  tab,
  title,
  emptyTitle,
  emptyHint,
  searchQuery = '',
  showCreateFab = false,
}: WorkspaceListProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const respondInvitationMutation = useRespondInvitation();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteWorkspaces(tab);

  const workspaces = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.workspaces) ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (workspace) =>
        workspace.name.toLowerCase().includes(q) ||
        workspace.description?.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  useInfiniteScroll(sentinelRef, {
    hasMore: !!hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNextPage,
  });

  const handleRespond = async (invitationId: number, action: 'accept' | 'decline') => {
    setError('');
    try {
      const workspace = await respondInvitationMutation.mutateAsync({ invitationId, action });
      if (action === 'accept' && workspace) {
        router.push(`/workspaces/${workspace.id}`);
      }
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} aria-hidden="true" />
          <p className={styles.muted}>Loading…</p>
        </div>
      ) : workspaces.length > 0 ? (
        <>
          <ul className={styles.workspaceList}>
            {workspaces.map((workspace) => (
              <li key={workspace.invitationId ?? workspace.id}>
                {tab === 'pending' && workspace.invitationId ? (
                  <div className={styles.pendingCard}>
                    <div className={styles.cardIcon}>N</div>
                    <div className={styles.cardBody}>
                      <p className={styles.workspaceName}>{workspace.name}</p>
                      <p className={styles.workspaceDesc}>
                        Invited as {workspace.role}
                        {workspace.expiresAt &&
                          ` · Expires ${new Date(workspace.expiresAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className={styles.pendingActions}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => handleRespond(workspace.invitationId!, 'accept')}
                        disabled={respondInvitationMutation.isPending}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => handleRespond(workspace.invitationId!, 'decline')}
                        disabled={respondInvitationMutation.isPending}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link href={`/workspaces/${workspace.id}`} className={styles.workspaceCard}>
                    <div className={styles.cardIcon}>{workspace.name.charAt(0).toUpperCase()}</div>
                    <div className={styles.cardBody}>
                      <p className={styles.workspaceName}>{workspace.name}</p>
                      {workspace.description && (
                        <p className={styles.workspaceDesc}>{workspace.description}</p>
                      )}
                    </div>
                    <span className={styles.roleBadge}>
                      {workspace.role} · {workspace.memberCount} member
                      {workspace.memberCount === 1 ? '' : 's'}
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div ref={sentinelRef} className={styles.scrollSentinel} aria-hidden="true" />
          {isFetchingNextPage && <p className={styles.muted}>Loading more…</p>}
        </>
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>{emptyTitle}</p>
          <p className={styles.muted}>{emptyHint}</p>
        </div>
      )}

      {showCreateFab && (
        <button
          type="button"
          className={styles.fab}
          onClick={() => setIsCreateModalOpen(true)}
          aria-label="Create workspace"
        >
          +
        </button>
      )}

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
