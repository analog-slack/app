import { AUTH_REFRESH_COOKIE, isAuthRefreshToken } from '@app/shared';
import { NextResponse, type NextRequest } from 'next/server';

import { ROUTES, withReturnTo } from '@/shared/config';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === '/api/auth' || pathname.startsWith('/api/auth/')) {
    const upstream =
      process.env.AUTH_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const destination = new URL(pathname.slice('/api/'.length), `${upstream.replace(/\/$/, '')}/`);
    destination.search = search;
    return NextResponse.rewrite(destination);
  }

  if (isAuthRefreshToken(request.cookies.get(AUTH_REFRESH_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const loginUrl = new URL(withReturnTo(ROUTES.LOGIN, pathname + search), request.url);
  const response = NextResponse.redirect(loginUrl);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/profile/:path*', '/api/auth/:path*'],
};
