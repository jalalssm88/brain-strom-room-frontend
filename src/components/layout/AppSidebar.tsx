'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useInfiniteWorkspaces } from '@/features/workspaces/useWorkspaces';
import { useSidebar } from './SidebarContext';
import styles from './AppSidebar.module.css';

const NAV = [
  { href: '/my-workspaces', label: 'My Workspace', icon: 'WS', match: (p: string) => p.startsWith('/my-workspaces') },
  { href: '/shared', label: 'Shared', icon: 'SH', match: (p: string) => p.startsWith('/shared') },
  { href: '/new', label: 'New', icon: 'NW', match: (p: string) => p.startsWith('/new'), badgeKey: 'pending' as const },
  { href: '/chat', label: 'Chat', icon: 'CH', match: (p: string) => p.startsWith('/chat') },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const { data: pendingData } = useInfiniteWorkspaces('pending');
  const pendingCount = pendingData?.pages[0]?.total ?? 0;

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.top}>
        {!collapsed && <p className={styles.sectionLabel}>Navigate</p>}
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav className={styles.nav}>
        {NAV.map((item) => {
          const active = item.match(pathname);
          const badge = item.badgeKey === 'pending' && pendingCount > 0 ? pendingCount : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${active ? styles.active : ''}`}
              title={item.label}
            >
              <span className={styles.icon}>{item.icon}</span>
              {!collapsed && <span className={styles.label}>{item.label}</span>}
              {!collapsed && badge !== null && <span className={styles.badge}>{badge}</span>}
              {collapsed && badge !== null && <span className={styles.dot} />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
