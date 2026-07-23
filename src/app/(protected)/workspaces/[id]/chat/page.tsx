'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMe } from '@/features/auth/useAuth';
import { useWorkspace } from '@/features/workspaces/useWorkspaces';
import LoadingScreen from '@/components/LoadingScreen';
import WorkspaceChat from '@/components/chat/WorkspaceChat';
import styles from '../workspace.module.css';

export default function WorkspaceChatPage() {
  const params = useParams();
  const workspaceId = Number(params.id);
  const { data: user } = useMe();
  const { data: workspace, isLoading } = useWorkspace(workspaceId);

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  if (!workspace) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Workspace not found or you do not have access.</p>
        <Link href="/chat" className={styles.link}>
          Back to Chat
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/chat" className={styles.backLink}>
            ← All chats
          </Link>
          <h1 className={styles.title}>Chat · {workspace.name}</h1>
          <p className={styles.subtitle}>Realtime group chat for this workspace</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className={styles.roleBadge}>{workspace.role}</span>
          <Link href={`/workspaces/${workspaceId}/board`} className={styles.ctaBtn}>
            Notes board
          </Link>
        </div>
      </header>

      <WorkspaceChat
        workspaceId={workspaceId}
        workspaceName={workspace.name}
        currentUserId={user.id}
        role={workspace.role}
      />
    </div>
  );
}
