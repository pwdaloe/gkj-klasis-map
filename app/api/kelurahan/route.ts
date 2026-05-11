import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('kelurahan')
    .select('*')
    .order('nama')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { kode, nama, kecamatan, kota_kab, provinsi } = body
  const { data, error } = await supabaseAdmin
    .from('kelurahan')
    .insert({ kode, nama, kecamatan, kota_kab, provinsi })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { kode, nama, kecamatan, kota_kab, provinsi, lat, lng } = body
  const updates: Record<string, unknown> = { nama, kecamatan, kota_kab, provinsi }
  if (lat !== undefined) updates.lat = lat
  if (lng !== undefined) updates.lng = lng
  const { data, error } = await supabaseAdmin
    .from('kelurahan')
    .update(updates)
    .eq('kode', kode)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const kode = req.nextUrl.searchParams.get('kode')
  if (!kode) return NextResponse.json({ error: 'kode diperlukan' }, { status: 400 })
  const { error } = await supabaseAdmin.from('kelurahan').delete().eq('kode', kode)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
