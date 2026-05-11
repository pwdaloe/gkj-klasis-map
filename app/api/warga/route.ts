import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// GET /api/warga?tahun=2026&mode=raw — raw rows untuk admin table
// GET /api/warga?tahun=2026&gereja_id=x&kota_kab=y — agregasi untuk peta
export async function GET(req: NextRequest) {
  const tahun = req.nextUrl.searchParams.get('tahun')
  const gereja_id = req.nextUrl.searchParams.get('gereja_id')
  const kota_kab = req.nextUrl.searchParams.get('kota_kab')
  const mode = req.nextUrl.searchParams.get('mode')

  if (!tahun) return NextResponse.json({ error: 'Parameter tahun diperlukan' }, { status: 400 })

  // Mode raw: kembalikan baris asli fakta_warga dengan id untuk keperluan edit/hapus
  if (mode === 'raw') {
    const { data, error } = await supabaseAdmin
      .from('fakta_warga')
      .select(`
        id, tahun, kelurahan_kode, gereja_id, kelompok_id, jumlah_warga,
        kelurahan:kelurahan_kode ( nama ),
        gereja:gereja_id ( nama )
      `)
      .eq('tahun', parseInt(tahun))
      .order('kelurahan_kode')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (!tahun) return NextResponse.json({ error: 'Parameter tahun diperlukan' }, { status: 400 })

  let query = supabase
    .from('fakta_warga')
    .select(`
      kelurahan_kode,
      gereja_id,
      jumlah_warga,
      kelurahan:kelurahan_kode ( nama, kecamatan, kota_kab, lat, lng, geojson ),
      gereja:gereja_id ( nama, lat, lng )
    `)
    .eq('tahun', parseInt(tahun))

  if (gereja_id) query = query.eq('gereja_id', gereja_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Ambil semua gereja untuk hitung jarak
  const { data: semuaGereja } = await supabase.from('gereja').select('gereja_id, nama, lat, lng')

  // Filter kota_kab di sini (setelah join)
  const filtered = kota_kab
    ? data?.filter((d: any) => d.kelurahan?.kota_kab === kota_kab)
    : data

  // Ambil semua kelurahan yang punya geojson sebagai base layer
  let kelurahanQuery = supabase
    .from('kelurahan')
    .select('kode, nama, kecamatan, kota_kab, lat, lng, geojson')
    .not('geojson', 'is', null)
  if (kota_kab) kelurahanQuery = kelurahanQuery.eq('kota_kab', kota_kab)
  const { data: semuaKelurahan } = await kelurahanQuery

  const { haversineKm } = await import('@/lib/haversine')

  const buildEntry = (kode: string, kel: any) => {
    let gerejaTerdekat = null
    if (kel?.lat && kel?.lng && semuaGereja) {
      let minJarak = Infinity
      for (const g of semuaGereja) {
        const jarak = haversineKm(kel.lat, kel.lng, g.lat, g.lng)
        if (jarak < minJarak) {
          minJarak = jarak
          gerejaTerdekat = { nama: g.nama, jarak_km: Math.round(jarak * 10) / 10 }
        }
      }
    }
    return {
      kelurahan_kode: kode,
      nama_kelurahan: kel?.nama ?? kode,
      kecamatan: kel?.kecamatan ?? '',
      kota_kab: kel?.kota_kab ?? '',
      total_warga: 0,
      per_gereja: [],
      gereja_terdekat: gerejaTerdekat,
      geojson: kel?.geojson ?? null,
      lat: kel?.lat ?? null,
      lng: kel?.lng ?? null,
    }
  }

  // Isi map dengan semua kelurahan ber-geojson (total_warga = 0 sebagai default)
  const map = new Map<string, any>()
  for (const kel of semuaKelurahan ?? []) {
    map.set(kel.kode, buildEntry(kel.kode, kel))
  }

  // Overlay data fakta_warga ke dalam map
  for (const row of filtered ?? []) {
    const kode = row.kelurahan_kode
    const kel = row.kelurahan as any

    if (!map.has(kode)) {
      map.set(kode, buildEntry(kode, kel))
    }

    const entry = map.get(kode)
    entry.total_warga += row.jumlah_warga
    entry.per_gereja.push({
      gereja_id: row.gereja_id,
      nama_gereja: (row.gereja as any)?.nama ?? row.gereja_id,
      jumlah: row.jumlah_warga,
    })
  }

  return NextResponse.json(Array.from(map.values()))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tahun, kelurahan_kode, gereja_id, kelompok_id, jumlah_warga } = body
  const { data, error } = await supabaseAdmin
    .from('fakta_warga')
    .upsert(
      { tahun, kelurahan_kode, gereja_id, kelompok_id: kelompok_id ?? null, jumlah_warga },
      { onConflict: 'tahun,kelurahan_kode,gereja_id,kelompok_id' }
    )
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { id, jumlah_warga } = await req.json()
  if (!id) return NextResponse.json({ error: 'id diperlukan' }, { status: 400 })
  const { error } = await supabaseAdmin
    .from('fakta_warga')
    .update({ jumlah_warga })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id diperlukan' }, { status: 400 })
  const { error } = await supabaseAdmin.from('fakta_warga').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
