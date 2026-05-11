import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/geocode
// Trigger geocoding semua kelurahan yang belum punya koordinat
export async function POST(_req: NextRequest) {
  const { data: kelurahan, error } = await supabaseAdmin
    .from('kelurahan')
    .select('kode, nama, kecamatan, kota_kab, provinsi')
    .is('lat', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!kelurahan || kelurahan.length === 0)
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

      await supabaseAdmin
        .from('kelurahan')
        .update({ lat, lng, geojson })
        .eq('kode', kel.kode)

      results.updated++
      // Jeda 1 detik agar tidak kena rate-limit Nominatim
      await new Promise((r) => setTimeout(r, 1100))
    } catch {
      results.failed.push(kel.kode)
    }
  }

  return NextResponse.json(results)
}

// GET /api/geocode?kode=bambu-apus
// Geocode satu kelurahan spesifik
export async function GET(req: NextRequest) {
  const kode = req.nextUrl.searchParams.get('kode')
  if (!kode) return NextResponse.json({ error: 'Parameter kode diperlukan' }, { status: 400 })

  const { data: kel } = await supabaseAdmin
    .from('kelurahan')
    .select('kode, nama, kecamatan, kota_kab, provinsi')
    .eq('kode', kode)
    .single()

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
  const geojson = place.geojson
    ? { type: 'Feature', geometry: place.geojson, properties: { kode: kel.kode, nama: kel.nama } }
    : null

  await supabaseAdmin.from('kelurahan').update({ lat, lng, geojson }).eq('kode', kode)

  return NextResponse.json({ kode, lat, lng, geojson })
}
