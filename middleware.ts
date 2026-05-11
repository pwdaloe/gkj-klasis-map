import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Changelog selalu bisa diakses
  if (pathname.startsWith('/changelog')) return response

  // Halaman login: redirect ke / jika sudah login
  if (pathname === '/login') {
    if (user) return NextResponse.redirect(new URL('/', request.url))
    return response
  }

  // Semua route lain butuh login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Cek role untuk route /admin — gunakan service role agar bypass RLS
  if (pathname.startsWith('/admin')) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await admin
      .from('user_profiles')
      .select('role, aktif')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.aktif) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (profile.role === 'viewer') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (pathname.startsWith('/admin/users') && profile.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
