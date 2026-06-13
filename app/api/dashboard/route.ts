import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const tahunTersedia = await sql`
    SELECT DISTINCT tahun FROM fakta_warga ORDER BY tahun DESC
  `
  const tahunList = tahunTersedia.map((r) => r.tahun as number)
  const tahunDefault = tahunList[0] ?? new Date().getFullYear()
  const tahun = parseInt(searchParams.get('tahun') ?? String(tahunDefault))

  const [totals] = await sql`
    SELECT
      COALESCE(SUM(fw.jumlah_warga), 0)::int AS total_warga,
      COUNT(DISTINCT fw.gereja_id)::int       AS total_gereja,
      COUNT(DISTINCT fw.kelurahan_kode)::int  AS total_kelurahan
    FROM fakta_warga fw
    WHERE fw.tahun = ${tahun}
  `

  const perGereja = await sql`
    SELECT
      g.gereja_id, g.nama,
      COALESCE(SUM(fw.jumlah_warga), 0)::int       AS jumlah_warga,
      COUNT(DISTINCT fw.kelurahan_kode)::int        AS jumlah_kelurahan
    FROM gereja g
    LEFT JOIN fakta_warga fw ON fw.gereja_id = g.gereja_id AND fw.tahun = ${tahun}
    GROUP BY g.gereja_id, g.nama
    ORDER BY jumlah_warga DESC
  `

  const rankingKelurahan = await sql`
    SELECT
      kel.nama AS kelurahan, kel.kecamatan, kel.kota_kab,
      SUM(fw.jumlah_warga)::int AS total_warga
    FROM fakta_warga fw
    JOIN kelurahan kel ON kel.kode = fw.kelurahan_kode
    WHERE fw.tahun = ${tahun}
    GROUP BY kel.kode, kel.nama, kel.kecamatan, kel.kota_kab
    ORDER BY total_warga DESC
    LIMIT 20
  `

  const trenPerTahun = await sql`
    SELECT tahun, SUM(jumlah_warga)::int AS total_warga
    FROM fakta_warga
    GROUP BY tahun
    ORDER BY tahun
  `

  return NextResponse.json({
    tahun,
    tahunTersedia: tahunList,
    totalWarga: totals.total_warga,
    totalGereja: totals.total_gereja,
    totalKelurahan: totals.total_kelurahan,
    perGereja,
    rankingKelurahan,
    trenPerTahun,
  })
}
