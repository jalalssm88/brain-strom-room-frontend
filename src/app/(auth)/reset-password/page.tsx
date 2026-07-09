'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useResetPassword } from '@/features/auth/useAuth';
import { toApiError } from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';
import styles from '@/app/auth.module.css';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const resetPasswordMutation = useResetPassword();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Reset token is missing. Use the link from your email.');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ token, password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  if (!token) {
    return (
      <main className={styles.authPage}>
        <div className={styles.card}>
          <h1 className={styles.title}>Invalid reset link</h1>
          <p className={styles.subtitle}>This password reset link is invalid or has expired.</p>
          <p className={styles.footer}>
            <Link href="/forgot-password" className={styles.link}>
              Request a new reset link
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.authPage}>
      <div className={styles.card}>
        <h1 className={styles.title}>Reset password</h1>
        <p className={styles.subtitle}>Choose a new password for your account.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          {success && (
            <div className={styles.success}>
              Password reset successfully. Redirecting to sign in…
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={resetPasswordMutation.isPending || success}
          >
            {resetPasswordMutation.isPending ? 'Resetting…' : 'Reset password'}
          </button>
        </form>

        <p className={styles.footer}>
          <Link href="/login" className={styles.link}>
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
