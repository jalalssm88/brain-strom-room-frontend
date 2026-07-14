'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMe } from '@/features/auth/useAuth';
import { useWorkspace } from '@/features/workspaces/useWorkspaces';
import LoadingScreen from '@/components/LoadingScreen';
import NotesBoard from '@/components/notes-board/NotesBoard';
import styles from './board.module.css';

export default function WorkspaceBoardPage() {
  const params = useParams();
  const workspaceId = Number(params.id);
  const { data: user } = useMe();
  const { data: workspace, isLoading } = useWorkspace(workspaceId);

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  if (!workspace) {
    return (
      <div className={styles.missing}>
        <p>Workspace not found or you do not have access.</p>
        <Link href="/my-workspaces">Back to My Workspace</Link>
      </div>
    );
  }

  return (
    <div className={styles.boardPage}>
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <Link href={`/workspaces/${workspaceId}`} className={styles.backLink}>
            ← Workspace details
          </Link>
          <h1 className={styles.title}>{workspace.name}</h1>
        </div>
        <span className={styles.roleBadge}>{workspace.role}</span>
      </header>

      <div className={styles.boardFrame}>
        <NotesBoard
          workspaceId={workspaceId}
          currentUserId={user.id}
          role={workspace.role}
          fullScreen
        />
      </div>
    </div>
  );
}
