'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe, useLogout } from '@/features/auth/useAuth';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useMe();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (isError) {
      router.replace('/login');
    }
  }, [isError, router]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push('/login');
  };

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          Log out
        </button>
      </header>

      <div className={styles.card}>
        <p className={styles.label}>Name</p>
        <p className={styles.value}>{user.fullName}</p>
        <p className={styles.label}>Email</p>
        <p className={styles.value}>{user.email}</p>
        <p className={styles.label}>Member since</p>
        <p className={styles.value}>{new Date(user.createdAt).toLocaleDateString()}</p>
      </div>
    </main>
  );
}
