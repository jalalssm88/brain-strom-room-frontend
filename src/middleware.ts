import { NextRequest, NextResponse } from 'next/server';

// Route-guard only: checks for the presence of the client-set `accessToken`
// cookie (see lib/tokenStorage.ts) to redirect between public and protected
// routes. Actual authorization for every API call is enforced by the
// backend via the Authorization header, not this cookie.
const GUEST_ONLY_PATHS = ['/login', '/signup'];
const PROTECTED_PATHS = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get('accessToken')?.value);

  const isGuestOnlyPath = GUEST_ONLY_PATHS.some((path) => pathname.startsWith(path));
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (isGuestOnlyPath && hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isProtectedPath && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/signup', '/dashboard/:path*'],
};
