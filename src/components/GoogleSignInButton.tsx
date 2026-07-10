import { getGoogleAuthUrl } from '@/lib/oauth';
import styles from '@/app/auth.module.css';

export default function GoogleSignInButton() {
  const handleGoogleSignIn = () => {
    window.location.href = getGoogleAuthUrl();
  };

  return (
    <>
      <div className={styles.divider}>
        <span>or</span>
      </div>
      <button type="button" className={styles.googleButton} onClick={handleGoogleSignIn}>
        <GoogleIcon />
        Continue with Google
      </button>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.083 36 24 36c-5.514 0-10-4.486-10-10s4.486-10 10-10c2.511 0 4.797.926 6.548 2.451l6.082-6.082C33.91 9.626 29.154 8 24 8 12.955 8 4 16.955 4 28s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c2.511 0 4.797.926 6.548 2.451l6.082-6.082C33.91 9.626 29.154 8 24 8 16.318 8 9.656 12.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 48c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 39.091 26.715 40 24 40c-5.08 0-9.365-3.442-10.899-8.081l-6.52 5.02C9.505 43.99 16.227 48 24 48z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 31.826 44 28c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
