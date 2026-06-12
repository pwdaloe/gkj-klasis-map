import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/changelog')) return NextResponse.next()

  const token = request.cookies.get('session')?.value
  const user = token ? await verifyToken(token) : null

  if (pathname === '/login') {
    if (user) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Jika harus ganti password, redirect ke /change-password (kecuali sudah di sana)
  if (user.mustChangePassword && pathname !== '/change-password') {
    return NextResponse.redirect(new URL('/change-password', request.url))
  }

  if (pathname.startsWith('/admin')) {
    if (!user.role || user.role === 'viewer') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (pathname.startsWith('/admin/users') && user.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
