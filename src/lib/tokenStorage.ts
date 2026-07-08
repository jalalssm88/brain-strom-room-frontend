// Tokens are the single source of truth for API auth (Authorization header),
// stored in localStorage so the same pattern maps directly onto a future
// mobile client (secure storage + header, no cookies).
//
// A lightweight, non-httpOnly `accessToken` cookie is also mirrored here
// purely so `middleware.ts` can decide whether to redirect between public
// and protected routes. It is never read by the backend.

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS = 15 * 60;

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  document.cookie = `accessToken=${accessToken}; path=/; max-age=${ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = 'accessToken=; path=/; max-age=0';
}
