import { AuthUser } from '@/types/auth';

export function isLocalUserUnverified(user: AuthUser): boolean {
  return user.provider === 'LOCAL' && !user.emailVerified;
}

export function getPostAuthPath(user: AuthUser): string {
  return isLocalUserUnverified(user) ? '/verify-email' : '/my-workspaces';
}
