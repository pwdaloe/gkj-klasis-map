import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getUserFromRequest, logAudit } from '@/lib/audit'

export async function GET() {
  const rows = await sql`SELECT * FROM gereja ORDER BY nama`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { gereja_id, nama, alamat, lat, lng } = await req.json()
  const [row] = await sql`
    INSERT INTO gereja (gereja_id, nama, alamat, lat, lng)
    VALUES (${gereja_id}, ${nama}, ${alamat}, ${lat}, ${lng})
    RETURNING *
  `
  const user = await getUserFromRequest(req)
  await logAudit({ user, action: 'INSERT', tabel: 'gereja', recordId: gereja_id, dataBaru: row })
  return NextResponse.json(row, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { gereja_id, nama, alamat, lat, lng } = await req.json()
  const [lama] = await sql`SELECT * FROM gereja WHERE gereja_id = ${gereja_id}`
  const [row] = await sql`
    UPDATE gereja
    SET nama = ${nama}, alamat = ${alamat}, lat = ${lat}, lng = ${lng}
    WHERE gereja_id = ${gereja_id}
    RETURNING *
  `
  const user = await getUserFromRequest(req)
  await logAudit({ user, action: 'UPDATE', tabel: 'gereja', recordId: gereja_id, dataLama: lama, dataBaru: row })
  return NextResponse.json(row)
}

export async function DELETE(req: NextRequest) {
  const gereja_id = req.nextUrl.searchParams.get('gereja_id')
  if (!gereja_id) return NextResponse.json({ error: 'gereja_id diperlukan' }, { status: 400 })
  const [lama] = await sql`SELECT * FROM gereja WHERE gereja_id = ${gereja_id}`
  await sql`DELETE FROM gereja WHERE gereja_id = ${gereja_id}`
  const user = await getUserFromRequest(req)
  await logAudit({ user, action: 'DELETE', tabel: 'gereja', recordId: gereja_id, dataLama: lama })
  return NextResponse.json({ success: true })
}
