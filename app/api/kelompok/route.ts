import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getUserFromRequest, logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const gereja_id = req.nextUrl.searchParams.get('gereja_id')
  const rows = gereja_id
    ? await sql`SELECT * FROM kelompok WHERE gereja_id = ${gereja_id} ORDER BY nama`
    : await sql`SELECT * FROM kelompok ORDER BY nama`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { gereja_id, kode, nama } = await req.json()
  const kelompok_id = `${gereja_id}-${kode.toLowerCase()}`
  const [row] = await sql`
    INSERT INTO kelompok (kelompok_id, gereja_id, kode, nama)
    VALUES (${kelompok_id}, ${gereja_id}, ${kode}, ${nama})
    RETURNING *
  `
  const user = await getUserFromRequest(req)
  await logAudit({ user, action: 'INSERT', tabel: 'kelompok', recordId: kelompok_id, dataBaru: row })
  return NextResponse.json(row, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { kelompok_id, kode, nama } = await req.json()
  const [lama] = await sql`SELECT * FROM kelompok WHERE kelompok_id = ${kelompok_id}`
  const [row] = await sql`
    UPDATE kelompok
    SET kode = ${kode}, nama = ${nama}
    WHERE kelompok_id = ${kelompok_id}
    RETURNING *
  `
  const user = await getUserFromRequest(req)
  await logAudit({ user, action: 'UPDATE', tabel: 'kelompok', recordId: kelompok_id, dataLama: lama, dataBaru: row })
  return NextResponse.json(row)
}

export async function DELETE(req: NextRequest) {
  const kelompok_id = req.nextUrl.searchParams.get('kelompok_id')
  if (!kelompok_id) return NextResponse.json({ error: 'kelompok_id diperlukan' }, { status: 400 })
  const [lama] = await sql`SELECT * FROM kelompok WHERE kelompok_id = ${kelompok_id}`
  await sql`DELETE FROM kelompok WHERE kelompok_id = ${kelompok_id}`
  const user = await getUserFromRequest(req)
  await logAudit({ user, action: 'DELETE', tabel: 'kelompok', recordId: kelompok_id, dataLama: lama })
  return NextResponse.json({ success: true })
}
