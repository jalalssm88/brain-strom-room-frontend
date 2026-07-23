'use client';

import Link from 'next/link';
import { useInfiniteWorkspaces } from '@/features/workspaces/useWorkspaces';
import LoadingScreen from '@/components/LoadingScreen';
import styles from '../page-content.module.css';

export default function ChatPage() {
  const owned = useInfiniteWorkspaces('owned');
  const shared = useInfiniteWorkspaces('shared');

  const isLoading = owned.isLoading || shared.isLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  const ownedWorkspaces = owned.data?.pages.flatMap((page) => page.workspaces) ?? [];
  const sharedWorkspaces = shared.data?.pages.flatMap((page) => page.workspaces) ?? [];
  const workspaces = [...ownedWorkspaces, ...sharedWorkspaces];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Chat</h1>
      <div className={styles.card}>
        <p className={styles.lead}>Choose a workspace to open group chat</p>
        <p className={styles.muted}>
          Messages sync in realtime. Viewers can read but not send.
        </p>

        {workspaces.length === 0 ? (
          <p className={styles.muted} style={{ marginTop: '1rem' }}>
            No workspaces yet. Create or join one first.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '1.25rem 0 0', display: 'grid', gap: '0.75rem' }}>
            {workspaces.map((workspace) => (
              <li key={workspace.id}>
                <Link
                  href={`/workspaces/${workspace.id}/chat`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'inherit',
                    background: '#f8fafc',
                  }}
                >
                  <span>
                    <strong>{workspace.name}</strong>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>
                      {workspace.role}
                    </span>
                  </span>
                  <span style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.875rem' }}>
                    Open →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
