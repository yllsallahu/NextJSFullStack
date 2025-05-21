// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// This function runs before every request to the site
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the token from the user's session
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Check if the token exists and the user is authenticated
  const isAuthenticated = !!token;
  
  // Add debug info to response headers (visible in browser network tab)
  const response = NextResponse.next();
  response.headers.set('x-middleware-cache', 'no-cache');
  response.headers.set('x-auth-status', isAuthenticated ? 'authenticated' : 'unauthenticated');
  
  // Allow access to auth pages when not authenticated, redirect to home if authenticated
  if (pathname.startsWith('/auth/')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }
  
  return response;
}

// Apply middleware only to these paths
export const config = {
  matcher: [
    '/auth/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)'
  ]
};
