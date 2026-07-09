'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useForgotPassword } from '@/features/auth/useAuth';
import { toApiError } from '@/lib/api';
import styles from '@/app/auth.module.css';

export default function ForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPassword();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      await forgotPasswordMutation.mutateAsync(email);
      setSuccess(true);
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <main className={styles.authPage}>
      <div className={styles.card}>
        <h1 className={styles.title}>Forgot password</h1>
        <p className={styles.subtitle}>
          Enter your email and we&apos;ll send you a reset link if an account exists.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          {success && (
            <div className={styles.success}>
              If an account exists for that email, a reset link has been sent. Check your inbox.
            </div>
          )}

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

          <button type="submit" className={styles.button} disabled={forgotPasswordMutation.isPending}>
            {forgotPasswordMutation.isPending ? 'Sending…' : 'Send reset link'}
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
