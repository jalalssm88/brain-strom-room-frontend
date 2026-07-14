'use client';

import styles from '../page-content.module.css';

export default function SettingsPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <div className={styles.card}>
        <p className={styles.lead}>Settings coming soon</p>
        <p className={styles.muted}>
          Preferences, notification options, and profile editing will live here.
        </p>
      </div>
    </div>
  );
}
