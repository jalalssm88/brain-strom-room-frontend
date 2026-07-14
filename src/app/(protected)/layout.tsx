'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/features/auth/useAuth';
import { isLocalUserUnverified } from '@/lib/authHelpers';
import LoadingScreen from '@/components/LoadingScreen';
import AppShell from '@/components/layout/AppShell';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useMe();

  useEffect(() => {
    if (isError) router.replace('/login');
  }, [isError, router]);

  useEffect(() => {
    if (user && isLocalUserUnverified(user)) router.replace('/verify-email');
  }, [user, router]);

  if (isLoading || !user || isLocalUserUnverified(user)) {
    return <LoadingScreen />;
  }

  return <AppShell>{children}</AppShell>;
}
