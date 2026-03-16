import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// NextAuth v5 beta middleware - uses auth() function
export default auth((req) => {
  try {
    // In NextAuth v5, session is available via req.auth
    const session = req.auth;
    
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
    const isApiRoute = req.nextUrl.pathname.startsWith('/api');

    // Allow API routes and auth pages to pass through
    if (isApiRoute || isAuthPage) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users to sign in
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Redirect authenticated users away from auth pages (though this shouldn't happen due to isAuthPage check above)
    if (session && isAuthPage) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Role-based access control
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin');
    const userRole = (session.user as any)?.role;
    if (isAdminPage && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  } catch (error: any) {
    throw error;
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (.*\\.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
