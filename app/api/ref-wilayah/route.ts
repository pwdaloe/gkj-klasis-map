import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

// GET /api/ref-wilayah?q=&kota_kab=&page=1&limit=50
export async function GET(req: NextRequest) {
  const q       = req.nextUrl.searchParams.get('q') ?? ''
  const kota    = req.nextUrl.searchParams.get('kota_kab') ?? ''
  const page    = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'))
  const limit   = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') ?? '50'))
  const offset  = (page - 1) * limit

  // kode kelurahan yang sudah di-import (untuk status badge)
  const imported = await sql`SELECT kode FROM kelurahan`
  const importedSet = new Set(imported.map((r) => r.kode as string))

  const rows = await sql`
    SELECT id, kelurahan, kecamatan, kota_kab, provinsi, kode_bps,
           (geojson IS NOT NULL) AS has_geojson
    FROM ref_wilayah
    WHERE
      (${q} = '' OR kelurahan ILIKE ${'%' + q + '%'} OR kecamatan ILIKE ${'%' + q + '%'})
      AND (${kota} = '' OR kota_kab = ${kota})
    ORDER BY kota_kab, kecamatan, kelurahan
    LIMIT ${limit} OFFSET ${offset}
  `

  const [{ total }] = await sql`
    SELECT COUNT(*)::int AS total FROM ref_wilayah
    WHERE
      (${q} = '' OR kelurahan ILIKE ${'%' + q + '%'} OR kecamatan ILIKE ${'%' + q + '%'})
      AND (${kota} = '' OR kota_kab = ${kota})
  `

  const kotaList = await sql`SELECT DISTINCT kota_kab FROM ref_wilayah ORDER BY kota_kab`

  const data = rows.map((r) => {
    const kode = r.kelurahan
      .replace(/^(Kelurahan|Desa)\s+/i, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
    return {
      ...r,
      sudah_import: importedSet.has(kode),
      kode_suggest: kode,
    }
  })

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    kota_list: kotaList.map((r) => r.kota_kab as string),
  })
}

// POST /api/ref-wilayah — bulk insert dari script Python
export async function POST(req: NextRequest) {
  const body = await req.json()
  const rows: { kelurahan: string; kecamatan: string; kota_kab: string; provinsi: string; geojson?: string | null; kode_bps?: string }[] = body.rows

  if (!Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: 'rows kosong' }, { status: 400 })

  let inserted = 0
  let skipped = 0

  for (const r of rows) {
    try {
      await sql`
        INSERT INTO ref_wilayah (kelurahan, kecamatan, kota_kab, provinsi, geojson, kode_bps)
        VALUES (${r.kelurahan}, ${r.kecamatan}, ${r.kota_kab}, ${r.provinsi}, ${r.geojson ?? null}, ${r.kode_bps ?? null})
        ON CONFLICT (kelurahan, kecamatan, kota_kab) DO UPDATE
          SET geojson  = EXCLUDED.geojson,
              kode_bps = EXCLUDED.kode_bps
      `
      inserted++
    } catch {
      skipped++
    }
  }

  return NextResponse.json({ inserted, skipped })
}

// DELETE /api/ref-wilayah — kosongkan tabel (untuk re-import)
export async function DELETE() {
  await sql`TRUNCATE ref_wilayah RESTART IDENTITY`
  return NextResponse.json({ ok: true })
}
