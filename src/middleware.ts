import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

// Routes that don't require authentication
const SKIP_PATHS = [
  '/api/auth',
  '/api/admin/reset',
  '/api/production-costs',
  '/api/microgreens',
  '/api/mixes',
  '/api/suppliers',
  '/api/pricing/tiers',
]

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null
  return parts[1]
}

export function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url)

  // Skip auth for public read-only paths
  if (SKIP_PATHS.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Skip auth in development if no JWT_SECRET set
  if (!JWT_SECRET && process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  const token = extractToken(request)

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized — no token provided' },
      { status: 401 }
    )
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; email?: string }
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', decoded.userId)
    if (decoded.email) requestHeaders.set('x-user-email', decoded.email)
    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized — invalid token' },
      { status: 401 }
    )
  }
}

export const config = {
  matcher: ['/api/:path*'],
}
