import { NextResponse } from 'next/server'
import sql from '@/lib/db'

// GET /api/setup — buat tabel ref_wilayah (jalankan sekali)
export async function GET() {
  await sql`
    CREATE TABLE IF NOT EXISTS ref_wilayah (
      id       SERIAL PRIMARY KEY,
      kelurahan TEXT NOT NULL,
      kecamatan TEXT NOT NULL,
      kota_kab  TEXT NOT NULL,
      provinsi  TEXT NOT NULL,
      geojson   TEXT,
      kode_bps  TEXT,
      UNIQUE (kelurahan, kecamatan, kota_kab)
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_ref_wilayah_kota ON ref_wilayah(kota_kab)`
  await sql`CREATE INDEX IF NOT EXISTS idx_ref_wilayah_kel  ON ref_wilayah(kelurahan)`

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM ref_wilayah`
  return NextResponse.json({ ok: true, rows: count })
}
