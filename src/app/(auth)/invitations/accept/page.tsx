'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { acceptInvitationByTokenRequest } from '@/lib/invitations';
import { toApiError } from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';
import styles from '@/app/auth.module.css';

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const hasHandledRef = useRef(false);

  useEffect(() => {
    if (!token || hasHandledRef.current) return;

    hasHandledRef.current = true;
    acceptInvitationByTokenRequest(token)
      .then((workspace) => {
        setSuccess(`Joined "${workspace.name}" successfully! Redirecting…`);
        setTimeout(() => router.push(`/workspaces/${workspace.id}`), 2000);
      })
      .catch((err) => {
        setError(toApiError(err).message);
      });
  }, [token, router]);

  if (!token) {
    return (
      <main className={styles.authPage}>
        <div className={styles.card}>
          <h1 className={styles.title}>Invalid invitation link</h1>
          <p className={styles.subtitle}>This invitation link is missing or invalid.</p>
          <p className={styles.footer}>
            <Link href="/my-workspaces" className={styles.link}>
              Go to My Workspace
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if (!error && !success) {
    return <LoadingScreen />;
  }

  return (
    <main className={styles.authPage}>
      <div className={styles.card}>
        <h1 className={styles.title}>Workspace invitation</h1>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        {error && (
          <p className={styles.footer}>
            <Link href="/my-workspaces" className={styles.link}>
              Go to My Workspace
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
