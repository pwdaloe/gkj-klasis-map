import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

// POST /api/geocode — geocode semua kelurahan yang belum punya koordinat
export async function POST() {
  const kelurahan = await sql`
    SELECT kode, nama, kecamatan, kota_kab, provinsi
    FROM kelurahan
    WHERE lat IS NULL
  `

  if (!kelurahan.length)
    return NextResponse.json({ message: 'Semua kelurahan sudah ter-geocode', updated: 0 })

  const results = { updated: 0, failed: [] as string[] }

  for (const kel of kelurahan) {
    const query = `${kel.nama}, ${kel.kecamatan}, ${kel.kota_kab}, ${kel.provinsi}, Indonesia`
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&polygon_geojson=1`

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'GKJ-Klasis-Map/1.0 (purwandaru.w@gmail.com)' },
      })
      const data = await res.json()
      if (!data || data.length === 0) {
        results.failed.push(kel.kode)
        continue
      }

      const place = data[0]
      const lat = parseFloat(place.lat)
      const lng = parseFloat(place.lon)
      const isPolygon = place.geojson && ['Polygon', 'MultiPolygon'].includes(place.geojson.type)
      const geojson = isPolygon
        ? { type: 'Feature', geometry: place.geojson, properties: { kode: kel.kode, nama: kel.nama } }
        : null

      await sql`
        UPDATE kelurahan
        SET lat = ${lat}, lng = ${lng}, geojson = ${geojson ? JSON.stringify(geojson) : null}
        WHERE kode = ${kel.kode}
      `

      results.updated++
      await new Promise((r) => setTimeout(r, 1100))
    } catch {
      results.failed.push(kel.kode)
    }
  }

  return NextResponse.json(results)
}

// GET /api/geocode?kode=bambu-apus — geocode satu kelurahan
export async function GET(req: NextRequest) {
  const kode = req.nextUrl.searchParams.get('kode')
  if (!kode) return NextResponse.json({ error: 'Parameter kode diperlukan' }, { status: 400 })

  const [kel] = await sql`
    SELECT kode, nama, kecamatan, kota_kab, provinsi
    FROM kelurahan
    WHERE kode = ${kode}
  `
  if (!kel) return NextResponse.json({ error: 'Kelurahan tidak ditemukan' }, { status: 404 })

  const query = `${kel.nama}, ${kel.kecamatan}, ${kel.kota_kab}, ${kel.provinsi}, Indonesia`
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&polygon_geojson=1`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'GKJ-Klasis-Map/1.0 (purwandaru.w@gmail.com)' },
  })
  const data = await res.json()

  if (!data || data.length === 0)
    return NextResponse.json({ error: 'Lokasi tidak ditemukan di Nominatim' }, { status: 404 })

  const place = data[0]
  const lat = parseFloat(place.lat)
  const lng = parseFloat(place.lon)
  const isPolygon = place.geojson && ['Polygon', 'MultiPolygon'].includes(place.geojson.type)
  const geojson = isPolygon
    ? { type: 'Feature', geometry: place.geojson, properties: { kode: kel.kode, nama: kel.nama } }
    : null

  await sql`
    UPDATE kelurahan
    SET lat = ${lat}, lng = ${lng}, geojson = ${geojson ? JSON.stringify(geojson) : null}
    WHERE kode = ${kode}
  `

  return NextResponse.json({ kode, lat, lng, geojson, note: geojson ? null : 'Koordinat disimpan, polygon tidak tersedia di Nominatim' })
}
