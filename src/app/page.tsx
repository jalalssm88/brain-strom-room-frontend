import Link from 'next/link';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

export default function Home() {
  return (
    <main className={styles.main}>
      <h1>Brain Strom Room</h1>
      <p>Collaborative workspace — real-time notes, chat, and more.</p>
      <p className={styles.meta}>
        API: <code>{API_URL}</code>
      </p>
      <div className={styles.actions}>
        <Link href="/login" className={styles.button}>
          Sign in
        </Link>
        <Link href="/signup" className={styles.buttonSecondary}>
          Create account
        </Link>
      </div>
    </main>
  );
}
