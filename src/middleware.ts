import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper function to check if path is a static resource
const isStaticResource = (path: string): boolean => {
  const staticPatterns = [
    '/fonts/',
    '/images/',
    '/audio/',
    '/_next/',
    '/favicon.ico',
    '.ttf',
    '.woff',
    '.woff2',
    '.eot',
    '.otf',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.mp3',
    '.wav'
  ];
  
  return staticPatterns.some(pattern => path.includes(pattern));
};

// Helper function to check if path is auth-related
const isAuthPath = (path: string): boolean => {
  const authPatterns = [
    '/auth',
    '/login',
    '/signup',
    '/api/auth',
    '/__/auth',  // Firebase auth paths
    '/oauth',    // OAuth paths
    '/signin',   // Additional auth paths
    '/callback'  // Auth callback paths
  ];
  
  return authPatterns.some(pattern => path.includes(pattern));
};

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;
  
  // Always allow static resources
  if (isStaticResource(path)) {
    return NextResponse.next();
  }
  
  // Always allow auth-related paths
  if (isAuthPath(path)) {
    return NextResponse.next();
  }
  
  // Get Firebase session from cookie
  const firebaseSession = request.cookies.get('firebase-session');
  
  // Public paths that don't require auth
  const publicPaths = ['/'];
  
  // If the path is public and user is authenticated, redirect to dashboard
  if (publicPaths.includes(path) && firebaseSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If the path requires auth and user is not authenticated, redirect to login
  if (!publicPaths.includes(path) && !isAuthPath(path) && !firebaseSession) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // Allow access to all dashboard paths when authenticated
  if (path.startsWith('/dashboard') && firebaseSession) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 