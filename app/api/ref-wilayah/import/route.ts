import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

// POST /api/ref-wilayah/import
// Body: { id: number, kode?: string }
// Menyalin satu baris ref_wilayah ke tabel kelurahan (dengan polygon jika tersedia)
export async function POST(req: NextRequest) {
  const { id, kode: kodeOverride } = await req.json()
  if (!id) return NextResponse.json({ error: 'id diperlukan' }, { status: 400 })

  const [ref] = await sql`SELECT * FROM ref_wilayah WHERE id = ${id}`
  if (!ref) return NextResponse.json({ error: 'Referensi tidak ditemukan' }, { status: 404 })

  // Buat kode dari nama kelurahan (strip prefix Kelurahan/Desa, lowercase, ganti spasi dengan -)
  const namaStripped = (ref.kelurahan as string).replace(/^(Kelurahan|Desa)\s+/i, '').trim()
  const kode = kodeOverride?.trim() || namaStripped.toLowerCase().replace(/\s+/g, '-')

  // Cek apakah sudah ada
  const existing = await sql`SELECT kode FROM kelurahan WHERE kode = ${kode}`
  if (existing.length > 0)
    return NextResponse.json({ error: `Kelurahan dengan kode "${kode}" sudah ada`, kode }, { status: 409 })

  const [row] = await sql`
    INSERT INTO kelurahan (kode, nama, kecamatan, kota_kab, provinsi, geojson)
    VALUES (
      ${kode},
      ${namaStripped},
      ${ref.kecamatan},
      ${ref.kota_kab},
      ${ref.provinsi},
      ${ref.geojson ?? null}
    )
    RETURNING *
  `

  return NextResponse.json({ ok: true, kode, row }, { status: 201 })
}
