import { NextRequest, NextResponse } from 'next/server';

const GUEST_ONLY_PATHS = ['/login', '/signup'];
const PROTECTED_PATHS = ['/dashboard', '/workspaces', '/invitations'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get('accessToken')?.value);

  const isGuestOnlyPath = GUEST_ONLY_PATHS.some((path) => pathname.startsWith(path));
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  const isVerifyEmailPath = pathname.startsWith('/verify-email');
  const hasEmailTokenParam = request.nextUrl.searchParams.has('token');

  if (isGuestOnlyPath && hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isProtectedPath && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isVerifyEmailPath && !hasEmailTokenParam && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/workspaces/:path*',
    '/invitations/:path*',
    '/verify-email',
  ],
};
