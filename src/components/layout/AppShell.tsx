'use client';

import { ReactNode, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider, useSidebar } from './SidebarContext';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import styles from './AppShell.module.css';

function ShellBody({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const isFullScreenBoard = /\/workspaces\/\d+\/board\/?$/.test(pathname);

  if (isFullScreenBoard) {
    return <div className={styles.boardShell}>{children}</div>;
  }

  return (
    <div className={styles.shell}>
      <Suspense fallback={<div className={styles.headerFallback} />}>
        <AppHeader />
      </Suspense>
      <div className={styles.body}>
        <AppSidebar />
        <main className={`${styles.main} ${collapsed ? styles.mainCollapsed : ''}`}>{children}</main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <ShellBody>{children}</ShellBody>
    </SidebarProvider>
  );
}
