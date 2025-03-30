import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      const response = NextResponse.redirect(new URL('/', req.url));
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }

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
          const response = NextResponse.redirect(new URL('/', req.url));
          response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          response.headers.set('Pragma', 'no-cache');
          response.headers.set('Expires', '0');
          return response;
        }
        break;
      }
    }

    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}; 