const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

export function getGoogleAuthUrl(): string {
  return `${API_URL}/auth/google`;
}

export const GOOGLE_AUTH_ERRORS: Record<string, string> = {
  google_auth_denied: 'Google sign-in was cancelled.',
  google_auth_failed: 'Google sign-in failed. Please try again.',
};
