import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const gereja_id = req.nextUrl.searchParams.get('gereja_id')
  let query = supabase.from('kelompok').select('*').order('nama')
  if (gereja_id) query = query.eq('gereja_id', gereja_id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { gereja_id, kode, nama } = body
  const kelompok_id = `${gereja_id}-${kode.toLowerCase()}`
  const { data, error } = await supabaseAdmin
    .from('kelompok')
    .insert({ kelompok_id, gereja_id, kode, nama })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { kelompok_id, kode, nama } = body
  const { data, error } = await supabaseAdmin
    .from('kelompok')
    .update({ kode, nama })
    .eq('kelompok_id', kelompok_id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const kelompok_id = req.nextUrl.searchParams.get('kelompok_id')
  if (!kelompok_id) return NextResponse.json({ error: 'kelompok_id diperlukan' }, { status: 400 })
  const { error } = await supabaseAdmin.from('kelompok').delete().eq('kelompok_id', kelompok_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
