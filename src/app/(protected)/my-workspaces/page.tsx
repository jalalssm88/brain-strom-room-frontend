'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WorkspaceList from '@/components/workspaces/WorkspaceList';

function MyWorkspacesContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  return (
    <WorkspaceList
      tab="owned"
      title="My Workspace"
      emptyTitle="No workspaces yet"
      emptyHint="Tap the + button to create your first workspace."
      searchQuery={q}
      showCreateFab
    />
  );
}

export default function MyWorkspacesPage() {
  return (
    <Suspense fallback={null}>
      <MyWorkspacesContent />
    </Suspense>
  );
}
