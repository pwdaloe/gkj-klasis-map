import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  const rows = await sql`SELECT * FROM kelurahan ORDER BY nama`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { kode, nama, kecamatan, kota_kab, provinsi } = await req.json()
  const [row] = await sql`
    INSERT INTO kelurahan (kode, nama, kecamatan, kota_kab, provinsi)
    VALUES (${kode}, ${nama}, ${kecamatan}, ${kota_kab}, ${provinsi})
    RETURNING *
  `
  return NextResponse.json(row, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { kode, nama, kecamatan, kota_kab, provinsi, lat, lng } = body
  const geojsonRaw = body.geojson
  const geojsonVal = geojsonRaw !== undefined
    ? (geojsonRaw ? JSON.stringify(geojsonRaw) : null)
    : undefined

  const [row] = geojsonVal !== undefined
    ? await sql`
        UPDATE kelurahan
        SET nama = ${nama}, kecamatan = ${kecamatan}, kota_kab = ${kota_kab},
            provinsi = ${provinsi}, lat = ${lat ?? null}, lng = ${lng ?? null},
            geojson = ${geojsonVal}
        WHERE kode = ${kode}
        RETURNING *
      `
    : await sql`
        UPDATE kelurahan
        SET nama = ${nama}, kecamatan = ${kecamatan}, kota_kab = ${kota_kab},
            provinsi = ${provinsi}, lat = ${lat ?? null}, lng = ${lng ?? null}
        WHERE kode = ${kode}
        RETURNING *
      `

  return NextResponse.json(row)
}

export async function DELETE(req: NextRequest) {
  const kode = req.nextUrl.searchParams.get('kode')
  if (!kode) return NextResponse.json({ error: 'kode diperlukan' }, { status: 400 })
  await sql`DELETE FROM kelurahan WHERE kode = ${kode}`
  return NextResponse.json({ success: true })
}
