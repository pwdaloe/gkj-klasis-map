import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function GET() {
  const users = await sql`SELECT * FROM user_profiles ORDER BY created_at`
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const { email, password, nama, role } = await req.json()

  const passwordHash = await hashPassword(password)

  await sql`
    INSERT INTO user_profiles (email, password_hash, nama, role, must_change_password, aktif)
    VALUES (${email}, ${passwordHash}, ${nama}, ${role}, TRUE, TRUE)
  `

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { id, nama, role, aktif } = await req.json()

  await sql`
    UPDATE user_profiles
    SET nama = ${nama}, role = ${role}, aktif = ${aktif}
    WHERE id = ${id}
  `

  return NextResponse.json({ success: true })
}
