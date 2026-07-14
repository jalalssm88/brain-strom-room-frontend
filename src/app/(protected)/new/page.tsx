'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WorkspaceList from '@/components/workspaces/WorkspaceList';

function NewContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  return (
    <WorkspaceList
      tab="pending"
      title="New"
      emptyTitle="No new invitations"
      emptyHint="You have no pending invitations right now."
      searchQuery={q}
    />
  );
}

export default function NewPage() {
  return (
    <Suspense fallback={null}>
      <NewContent />
    </Suspense>
  );
}
