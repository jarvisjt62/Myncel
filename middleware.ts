import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Protected routes that require authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/equipment',
  '/schedules',
  '/work-orders',
  '/settings',
  '/reports',
];

// Auth routes — redirect to dashboard if already logged in
const AUTH_ROUTES = ['/signin', '/signup'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get JWT token (doesn't require DB — reads from cookie)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // 1. If authenticated user visits signin/signup → redirect to dashboard
  if (isAuthenticated && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 2. If unauthenticated user visits a protected route → redirect to signin
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isAuthenticated && isProtected) {
    const signInUrl = new URL('/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 3. All other routes — allow through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets (svg, png, jpg, etc.)
     * - api/auth (NextAuth handles its own routes)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};