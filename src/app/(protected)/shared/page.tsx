'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WorkspaceList from '@/components/workspaces/WorkspaceList';

function SharedContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  return (
    <WorkspaceList
      tab="shared"
      title="Shared"
      emptyTitle="No shared workspaces"
      emptyHint="Workspaces shared with you will appear here."
      searchQuery={q}
    />
  );
}

export default function SharedPage() {
  return (
    <Suspense fallback={null}>
      <SharedContent />
    </Suspense>
  );
}
