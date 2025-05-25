import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';

// Add matcher to specify which routes to protect
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    '/'
  ]
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Create response object
    const response = NextResponse.next();

    // Set cache control headers for all responses
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // If no token and trying to access protected route, redirect to login
    if (!token && path !== '/') {
      const loginUrl = new URL('/', req.url);
      loginUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(loginUrl);
    }

    // If has token and trying to access login page, redirect to dashboard
    if (token && path === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Role-based access control
    if (token) {
      const roleAccess = {
        '/dashboard/admin': ['ADMIN'],
        '/dashboard/test-cases': ['ADMIN', 'MANAGER', 'TESTER', 'VIEWER'],
        '/dashboard/test-cases/create': ['ADMIN', 'MANAGER', 'TESTER'],
        '/dashboard/test-cases/edit': ['ADMIN', 'MANAGER', 'TESTER'],
        '/dashboard/plugins': ['ADMIN', 'MANAGER'],
        '/dashboard/plugins/manage': ['ADMIN'],
      };

      for (const [route, roles] of Object.entries(roleAccess)) {
        if (path.startsWith(route)) {
          if (!roles.includes(token.role as UserRole)) {
            return NextResponse.redirect(new URL('/', req.url));
          }
          break;
        }
      }
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => true, // Let the middleware function handle authorization
    },
  }
); 