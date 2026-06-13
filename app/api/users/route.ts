import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { getUserFromRequest, logAudit } from '@/lib/audit'

export async function GET() {
  try {
    const users = await sql`SELECT id, email, nama, role, aktif, created_at FROM user_profiles ORDER BY created_at`
    return NextResponse.json(users)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, nama, role } = await req.json()
    const passwordHash = await hashPassword(password)
    const [row] = await sql`
      INSERT INTO user_profiles (email, password_hash, nama, role, must_change_password, aktif)
      VALUES (${email}, ${passwordHash}, ${nama}, ${role}, TRUE, TRUE)
      RETURNING id, email, nama, role, aktif
    `
    const user = await getUserFromRequest(req)
    await logAudit({ user, action: 'INSERT', tabel: 'user_profiles', recordId: row.id, dataBaru: { email, nama, role } })
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, nama, role, aktif } = await req.json()
    const [lama] = await sql`SELECT id, email, nama, role, aktif FROM user_profiles WHERE id = ${id}`
    await sql`
      UPDATE user_profiles
      SET nama = ${nama}, role = ${role}, aktif = ${aktif}
      WHERE id = ${id}
    `
    const user = await getUserFromRequest(req)
    await logAudit({ user, action: 'UPDATE', tabel: 'user_profiles', recordId: id, dataLama: lama, dataBaru: { id, nama, role, aktif } })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
