'use client';

import styles from '../page-content.module.css';

export default function ChatPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Chat</h1>
      <div className={styles.card}>
        <p className={styles.lead}>Group chat is coming in a later phase.</p>
        <p className={styles.muted}>
          This page is reserved for workspace chat history and realtime messaging.
        </p>
      </div>
    </div>
  );
}
