import styles from './LoadingScreen.module.css';

export default function LoadingScreen({ message = 'Loading…' }: { message?: string }) {
  return <div className={styles.loading}>{message}</div>;
}
