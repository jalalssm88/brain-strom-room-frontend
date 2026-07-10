'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { getMeRequest } from '@/lib/auth';
import { setTokens } from '@/lib/tokenStorage';
import { getPostAuthPath } from '@/lib/authHelpers';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/authSlice';
import LoadingScreen from '@/components/LoadingScreen';
import styles from '@/app/auth.module.css';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const hasHandledRef = useRef(false);

  useEffect(() => {
    if (hasHandledRef.current) return;
    hasHandledRef.current = true;

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      router.replace('/login?error=google_auth_failed');
      return;
    }

    const completeSignIn = async () => {
      try {
        setTokens(accessToken, refreshToken);
        const user = await getMeRequest();
        dispatch(setUser(user));
        queryClient.setQueryData(['auth', 'me'], user);
        router.replace(getPostAuthPath(user));
      } catch {
        router.replace('/login?error=google_auth_failed');
      }
    };

    void completeSignIn();
  }, [dispatch, queryClient, router, searchParams]);

  return (
    <main className={styles.authPage}>
      <div className={styles.card}>
        <h1 className={styles.title}>Signing you in…</h1>
        <p className={styles.subtitle}>Completing Google sign-in.</p>
      </div>
    </main>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
