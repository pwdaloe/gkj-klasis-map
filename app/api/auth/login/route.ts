import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan password diperlukan' }, { status: 400 })
  }

  const [user] = await sql`
    SELECT id, email, nama, role, password_hash, must_change_password, aktif
    FROM user_profiles
    WHERE email = ${email}
  `

  if (!user || !user.aktif) {
    return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 })
  }

  const token = await signToken({
    id: user.id,
    email: user.email,
    nama: user.nama,
    role: user.role,
    mustChangePassword: user.must_change_password,
  })

  const response = NextResponse.json({ success: true })
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: '/',
  })

  return response
}
