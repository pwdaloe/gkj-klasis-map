import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyToken, hashPassword, signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  const user = token ? await verifyToken(token) : null

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { password, confirmPassword } = await req.json()

  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'Konfirmasi password tidak cocok' }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)

  await sql`
    UPDATE user_profiles
    SET password_hash = ${passwordHash}, must_change_password = FALSE
    WHERE id = ${user.id}
  `

  const newToken = await signToken({
    id: user.id,
    email: user.email,
    nama: user.nama,
    role: user.role,
    mustChangePassword: false,
  })

  const response = NextResponse.json({ success: true })
  response.cookies.set('session', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}
