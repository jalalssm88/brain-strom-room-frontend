const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

/**
 * Resolve avatar/media paths from the API.
 * Local uploads are stored as `/uploads/...`; Google avatars are absolute URLs.
 */
export function resolveMediaUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('blob:') ||
    pathOrUrl.startsWith('data:')
  ) {
    return pathOrUrl;
  }
  const base = API_URL.replace(/\/$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}
