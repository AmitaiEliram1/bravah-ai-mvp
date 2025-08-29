import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /auth/signin)
  const { pathname } = request.nextUrl

  // Define public paths that don't need authentication
  const publicPaths = [
    '/auth/signin',
    '/api/auth',
    '/access-denied'
  ]

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => 
    pathname.startsWith(path)
  )

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for session token
  const token = request.cookies.get('next-auth.session-token') || 
                request.cookies.get('__Secure-next-auth.session-token')

  // If no token and not on public path, redirect to signin
  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Allow access if authenticated
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
}