import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase.from('gereja').select('*').order('nama')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { gereja_id, nama, alamat, lat, lng } = body
  const { data, error } = await supabaseAdmin
    .from('gereja')
    .insert({ gereja_id, nama, alamat, lat, lng })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { gereja_id, nama, alamat, lat, lng } = body
  const { data, error } = await supabaseAdmin
    .from('gereja')
    .update({ nama, alamat, lat, lng })
    .eq('gereja_id', gereja_id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const gereja_id = req.nextUrl.searchParams.get('gereja_id')
  if (!gereja_id) return NextResponse.json({ error: 'gereja_id diperlukan' }, { status: 400 })
  const { error } = await supabaseAdmin.from('gereja').delete().eq('gereja_id', gereja_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
