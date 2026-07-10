'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLogin } from '@/features/auth/useAuth';
import { getPostAuthPath } from '@/lib/authHelpers';
import { GOOGLE_AUTH_ERRORS } from '@/lib/oauth';
import { toApiError } from '@/lib/api';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import styles from '@/app/auth.module.css';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError && GOOGLE_AUTH_ERRORS[oauthError]) {
      setError(GOOGLE_AUTH_ERRORS[oauthError]);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await loginMutation.mutateAsync({ email, password });
      router.push(getPostAuthPath(result.user));
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <main className={styles.authPage}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to Brain Strom Room</p>

        <GoogleSignInButton />

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={styles.button} disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.footer}>
          <Link href="/forgot-password" className={styles.link}>
            Forgot password?
          </Link>
        </p>

        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
