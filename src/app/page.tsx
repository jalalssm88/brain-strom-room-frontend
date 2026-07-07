import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

export default function Home() {
  return (
    <main className={styles.main}>
      <h1>Brain Strom Room</h1>
      <p>Collaborative workspace client — Phase 0 scaffold</p>
      <p className={styles.meta}>
        API: <code>{API_URL}</code>
      </p>
    </main>
  );
}
