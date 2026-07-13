'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMe, useLogout } from '@/features/auth/useAuth';
import { useWorkspaces, useRespondInvitation } from '@/features/workspaces/useWorkspaces';
import { isLocalUserUnverified } from '@/lib/authHelpers';
import { toApiError } from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';
import NotificationDropdown from '@/components/NotificationDropdown';
import CreateWorkspaceModal from '@/components/CreateWorkspaceModal';
import { WorkspaceTab } from '@/types/workspace';
import styles from './dashboard.module.css';

const TABS: { key: WorkspaceTab; label: string }[] = [
  { key: 'owned', label: 'My Workspace' },
  { key: 'shared', label: 'Shared' },
  { key: 'pending', label: 'New' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useMe();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('owned');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces(activeTab);
  const { data: pendingWorkspaces } = useWorkspaces('pending');
  const respondInvitationMutation = useRespondInvitation();
  const logoutMutation = useLogout();
  const [error, setError] = useState('');

  const pendingCount = pendingWorkspaces?.length ?? 0;

  useEffect(() => {
    if (isError) router.replace('/login');
  }, [isError, router]);

  useEffect(() => {
    if (user && isLocalUserUnverified(user)) router.replace('/verify-email');
  }, [user, router]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push('/login');
  };

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

  if (isLoading || !user || isLocalUserUnverified(user)) {
    return <LoadingScreen />;
  }

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Welcome, {user.fullName}</p>
        </div>
        <div className={styles.headerActions}>
          <NotificationDropdown />
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <span className={styles.tabBadge}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <section className={styles.section}>
        {error && <div className={styles.error}>{error}</div>}

        {workspacesLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.muted}>Loading workspaces…</p>
          </div>
        ) : workspaces && workspaces.length > 0 ? (
          <ul className={styles.workspaceList}>
            {workspaces.map((workspace) => (
              <li key={workspace.invitationId ?? workspace.id}>
                {activeTab === 'pending' && workspace.invitationId ? (
                  <div className={styles.pendingCard}>
                    <div className={styles.cardIcon}>✉️</div>
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
                    <div className={styles.cardIcon}>
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
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
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              {activeTab === 'owned' && '📁'}
              {activeTab === 'shared' && '👥'}
              {activeTab === 'pending' && '📬'}
            </div>
            <p className={styles.emptyTitle}>
              {activeTab === 'owned' && 'No workspaces yet'}
              {activeTab === 'shared' && 'No shared workspaces'}
              {activeTab === 'pending' && 'No new invitations'}
            </p>
            <p className={styles.muted}>
              {activeTab === 'owned' && 'Tap the + button below to create your first workspace.'}
              {activeTab === 'shared' && 'Workspaces shared with you will appear here.'}
              {activeTab === 'pending' && 'You have no pending invitations right now.'}
            </p>
          </div>
        )}
      </section>

      {activeTab === 'owned' && (
        <button
          type="button"
          className={styles.fab}
          onClick={() => setIsCreateModalOpen(true)}
          aria-label="Create workspace"
        >
          <PlusIcon />
        </button>
      )}

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </main>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
