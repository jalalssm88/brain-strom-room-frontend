'use client';

import { useMe } from '@/features/auth/useAuth';
import styles from '../page-content.module.css';

export default function AccountPage() {
  const { data: user } = useMe();

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const plan = user.subscription;
  const limitLabel =
    plan?.workspaceLimit == null ? 'Unlimited' : String(plan.workspaceLimit);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Account</h1>

      <div className={styles.card}>
        <div className={styles.profileHero}>
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="" className={styles.avatar} />
          ) : (
            <div className={styles.avatar}>{initials}</div>
          )}
          <div>
            <p className={styles.profileName}>{user.fullName}</p>
            <p className={styles.profileEmail}>{user.email}</p>
          </div>
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
    </div>
  );
}
