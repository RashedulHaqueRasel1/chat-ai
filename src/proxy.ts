import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Proxy middleware for Role-Based Access Control (RBAC) routing
 */
export async function proxyMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protected admin routes check
  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || 'cinetext_secret_key_development_only',
    });

    if (!token) {
      const loginUrl = new URL('/', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return NextResponse.next();
}

export default proxyMiddleware;
