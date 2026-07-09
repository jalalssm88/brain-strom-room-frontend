'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMe, useVerifyEmail, useResendVerification } from '@/features/auth/useAuth';
import { isLocalUserUnverified } from '@/lib/authHelpers';
import { toApiError } from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';
import styles from '@/app/auth.module.css';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerification();
  const { data: user, isLoading, isError } = useMe();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    if (!token || hasVerifiedRef.current) return;

    hasVerifiedRef.current = true;
    verifyMutation
      .mutateAsync(token)
      .then(() => {
        setSuccess('Email verified successfully! Redirecting to dashboard…');
        setTimeout(() => router.push('/dashboard'), 2000);
      })
      .catch((err) => {
        setError(toApiError(err).message);
      });
  }, [token, verifyMutation, router]);

  useEffect(() => {
    if (isLoading || token) return;

    if (isError) {
      router.replace('/login');
      return;
    }

    if (user && !isLocalUserUnverified(user)) {
      router.replace('/dashboard');
    }
  }, [isLoading, isError, user, token, router]);

  const handleResend = async () => {
    setResendMessage('');
    setError('');

    try {
      await resendMutation.mutateAsync();
      setResendMessage('Verification email sent. Check your inbox.');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  if (token) {
    if (verifyMutation.isPending) {
      return <LoadingScreen />;
    }

    return (
      <main className={styles.authPage}>
        <div className={styles.card}>
          <h1 className={styles.title}>Verify email</h1>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}
          {!error && !success && <p className={styles.subtitle}>Verifying your email…</p>}
          {error && (
            <p className={styles.footer}>
              <Link href="/login" className={styles.link}>
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </main>
    );
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <main className={styles.authPage}>
      <div className={styles.card}>
        <h1 className={styles.title}>Verify your email</h1>
        <p className={styles.info}>
          We sent a verification link to <strong>{user?.email}</strong>. Please check your inbox and
          click the link to continue.
        </p>

        {error && <div className={styles.error}>{error}</div>}
        {resendMessage && <div className={styles.success}>{resendMessage}</div>}

        <button
          type="button"
          className={styles.button}
          onClick={handleResend}
          disabled={resendMutation.isPending}
        >
          {resendMutation.isPending ? 'Sending…' : 'Resend verification email'}
        </button>

        <p className={styles.footer}>
          <Link href="/login" className={styles.link}>
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
