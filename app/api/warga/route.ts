import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { haversineKm } from '@/lib/haversine'

function parseGeojson(raw: unknown): object | null {
  if (!raw) return null
  if (typeof raw === 'object') return raw as object
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return null }
  }
  return null
}

// GET /api/warga?tahun=2026&mode=raw
// GET /api/warga?tahun=2026&gereja_id=x&kota_kab=y
export async function GET(req: NextRequest) {
  const tahun = req.nextUrl.searchParams.get('tahun')
  const gereja_id = req.nextUrl.searchParams.get('gereja_id')
  const kota_kab = req.nextUrl.searchParams.get('kota_kab')
  const mode = req.nextUrl.searchParams.get('mode')

  if (!tahun) return NextResponse.json({ error: 'Parameter tahun diperlukan' }, { status: 400 })

  const tahunInt = parseInt(tahun)

  if (mode === 'raw') {
    const rows = await sql`
      SELECT
        fw.id, fw.tahun, fw.kelurahan_kode, fw.gereja_id, fw.kelompok_id, fw.jumlah_warga,
        k.nama AS kelurahan_nama,
        g.nama AS gereja_nama
      FROM fakta_warga fw
      LEFT JOIN kelurahan k ON k.kode = fw.kelurahan_kode
      LEFT JOIN gereja g ON g.gereja_id = fw.gereja_id
      WHERE fw.tahun = ${tahunInt}
      ORDER BY fw.kelurahan_kode
    `
    const mapped = rows.map((r) => ({
      ...r,
      kelurahan: { nama: r.kelurahan_nama },
      gereja: { nama: r.gereja_nama },
    }))
    return NextResponse.json(mapped)
  }

  // Agregasi untuk peta
  const fwQuery = gereja_id
    ? await sql`
        SELECT fw.kelurahan_kode, fw.gereja_id, fw.jumlah_warga,
          k.nama AS kel_nama, k.kecamatan, k.kota_kab, k.lat AS kel_lat, k.lng AS kel_lng, k.geojson,
          g.nama AS gereja_nama, g.lat AS gereja_lat, g.lng AS gereja_lng
        FROM fakta_warga fw
        LEFT JOIN kelurahan k ON k.kode = fw.kelurahan_kode
        LEFT JOIN gereja g ON g.gereja_id = fw.gereja_id
        WHERE fw.tahun = ${tahunInt} AND fw.gereja_id = ${gereja_id}
      `
    : await sql`
        SELECT fw.kelurahan_kode, fw.gereja_id, fw.jumlah_warga,
          k.nama AS kel_nama, k.kecamatan, k.kota_kab, k.lat AS kel_lat, k.lng AS kel_lng, k.geojson,
          g.nama AS gereja_nama, g.lat AS gereja_lat, g.lng AS gereja_lng
        FROM fakta_warga fw
        LEFT JOIN kelurahan k ON k.kode = fw.kelurahan_kode
        LEFT JOIN gereja g ON g.gereja_id = fw.gereja_id
        WHERE fw.tahun = ${tahunInt}
      `

  const semuaGereja = await sql`SELECT gereja_id, nama, lat, lng FROM gereja`

  const kelurahanBaseQuery = kota_kab
    ? await sql`
        SELECT kode, nama, kecamatan, kota_kab, lat, lng, geojson
        FROM kelurahan
        WHERE geojson IS NOT NULL AND kota_kab = ${kota_kab}
      `
    : await sql`
        SELECT kode, nama, kecamatan, kota_kab, lat, lng, geojson
        FROM kelurahan
        WHERE geojson IS NOT NULL
      `

  const filtered = kota_kab ? fwQuery.filter((r) => r.kota_kab === kota_kab) : fwQuery

  const buildEntry = (kode: string, kel: Record<string, unknown>) => {
    let gerejaTerdekat = null
    const kelLat = kel.lat as number | null
    const kelLng = kel.lng as number | null
    if (kelLat && kelLng) {
      let minJarak = Infinity
      for (const g of semuaGereja) {
        const jarak = haversineKm(kelLat, kelLng, g.lat as number, g.lng as number)
        if (jarak < minJarak) {
          minJarak = jarak
          gerejaTerdekat = { nama: g.nama, jarak_km: Math.round(jarak * 10) / 10 }
        }
      }
    }
    return {
      kelurahan_kode: kode,
      nama_kelurahan: (kel.nama as string) ?? kode,
      kecamatan: (kel.kecamatan as string) ?? '',
      kota_kab: (kel.kota_kab as string) ?? '',
      total_warga: 0,
      per_gereja: [] as { gereja_id: string; nama_gereja: string; jumlah: number }[],
      gereja_terdekat: gerejaTerdekat,
      geojson: parseGeojson(kel.geojson),
      lat: kelLat,
      lng: kelLng,
    }
  }

  const map = new Map<string, ReturnType<typeof buildEntry>>()

  for (const kel of kelurahanBaseQuery) {
    map.set(kel.kode as string, buildEntry(kel.kode as string, kel as Record<string, unknown>))
  }

  for (const row of filtered) {
    const kode = row.kelurahan_kode as string
    if (!map.has(kode)) {
      map.set(kode, buildEntry(kode, {
        nama: row.kel_nama,
        kecamatan: row.kecamatan,
        kota_kab: row.kota_kab,
        lat: row.kel_lat,
        lng: row.kel_lng,
        geojson: row.geojson,
      }))
    }
    const entry = map.get(kode)!
    entry.total_warga += row.jumlah_warga as number
    entry.per_gereja.push({
      gereja_id: row.gereja_id as string,
      nama_gereja: (row.gereja_nama as string) ?? (row.gereja_id as string),
      jumlah: row.jumlah_warga as number,
    })
  }

  return NextResponse.json(Array.from(map.values()))
}

export async function POST(req: NextRequest) {
  const { tahun, kelurahan_kode, gereja_id, kelompok_id, jumlah_warga } = await req.json()
  const [row] = await sql`
    INSERT INTO fakta_warga (tahun, kelurahan_kode, gereja_id, kelompok_id, jumlah_warga)
    VALUES (${tahun}, ${kelurahan_kode}, ${gereja_id}, ${kelompok_id ?? null}, ${jumlah_warga})
    ON CONFLICT (tahun, kelurahan_kode, gereja_id, kelompok_id)
    DO UPDATE SET jumlah_warga = EXCLUDED.jumlah_warga
    RETURNING *
  `
  return NextResponse.json(row, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { id, jumlah_warga } = await req.json()
  if (!id) return NextResponse.json({ error: 'id diperlukan' }, { status: 400 })
  await sql`UPDATE fakta_warga SET jumlah_warga = ${jumlah_warga} WHERE id = ${id}`
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id diperlukan' }, { status: 400 })
  await sql`DELETE FROM fakta_warga WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
