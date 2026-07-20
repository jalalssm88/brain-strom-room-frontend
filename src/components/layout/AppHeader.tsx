'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLogout, useMe } from '@/features/auth/useAuth';
import NotificationDropdown from '@/components/NotificationDropdown';
import UserAvatar from '@/components/UserAvatar';
import { useSidebar } from './SidebarContext';
import styles from './AppHeader.module.css';

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: user } = useMe();
  const logoutMutation = useLogout();
  const { toggle } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [menuOpen]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    const base =
      pathname.startsWith('/shared')
        ? '/shared'
        : pathname.startsWith('/new')
          ? '/new'
          : '/my-workspaces';
    router.push(q ? `${base}?q=${encodeURIComponent(q)}` : base);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logoutMutation.mutateAsync();
    router.push('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={toggle}
          aria-label="Toggle sidebar"
        >
          <DrawerIcon />
        </button>
        <Link href="/my-workspaces" className={styles.brand}>
          Brain Strom Room
        </Link>
      </div>

      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search workspaces…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search workspaces"
        />
      </form>

      <div className={styles.right}>
        <NotificationDropdown />
        <div className={styles.profileWrap} ref={menuRef}>
          <button
            type="button"
            className={styles.avatarBtn}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Profile menu"
            aria-expanded={menuOpen}
          >
            <UserAvatar
              fullName={user?.fullName ?? '?'}
              avatar={user?.avatar}
              className={styles.avatarImg}
              fallbackClassName={styles.avatarFallback}
            />
          </button>

          {menuOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownUser}>
                <p className={styles.dropdownName}>{user?.fullName}</p>
                <p className={styles.dropdownEmail}>{user?.email}</p>
              </div>
              <Link
                href="/account"
                className={styles.dropdownItem}
                onClick={() => setMenuOpen(false)}
              >
                Account
              </Link>
              <Link
                href="/settings"
                className={styles.dropdownItem}
                onClick={() => setMenuOpen(false)}
              >
                Settings
              </Link>
              <button type="button" className={styles.dropdownDanger} onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function DrawerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
