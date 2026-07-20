'use client';

import { useState } from 'react';
import EditProfileModal from '@/components/EditProfileModal';
import UserAvatar from '@/components/UserAvatar';
import { useMe } from '@/features/auth/useAuth';
import styles from '../page-content.module.css';

export default function AccountPage() {
  const { data: user } = useMe();
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (!user) return null;

  const plan = user.subscription;
  const limitLabel =
    plan?.workspaceLimit == null ? 'Unlimited' : String(plan.workspaceLimit);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Account</h1>

      <div className={styles.card}>
        <div className={styles.profileHero}>
          <UserAvatar
            fullName={user.fullName}
            avatar={user.avatar}
            className={styles.avatar}
            fallbackClassName={styles.avatar}
          />
          <div className={styles.profileMeta}>
            <p className={styles.profileName}>{user.fullName}</p>
            <p className={styles.profileEmail}>{user.email}</p>
          </div>
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => setIsEditOpen(true)}
            aria-label="Edit profile"
            title="Edit profile"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </div>

        <dl className={styles.dl}>
          <div className={styles.row}>
            <dt className={styles.dt}>Full name</dt>
            <dd className={styles.dd}>{user.fullName}</dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.dt}>Email</dt>
            <dd className={styles.dd}>{user.email}</dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.dt}>Provider</dt>
            <dd className={styles.dd}>{user.provider}</dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.dt}>Email verified</dt>
            <dd className={styles.dd}>
              {user.emailVerified
                ? new Date(user.emailVerified).toLocaleString()
                : user.provider === 'GOOGLE'
                  ? 'Verified via Google'
                  : 'Not verified'}
            </dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.dt}>Subscription</dt>
            <dd className={styles.dd}>
              {plan ? (
                <span className={styles.planBadge}>
                  {plan.planName} · {plan.status}
                </span>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.dt}>Workspace limit</dt>
            <dd className={styles.dd}>{limitLabel}</dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.dt}>Member since</dt>
            <dd className={styles.dd}>{new Date(user.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        user={user}
      />
    </div>
  );
}
